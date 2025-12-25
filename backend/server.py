from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum
import httpx
from geopy.distance import geodesic
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'mslk-vtc-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="MSLK VTC API")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MSLK Pricing
PRICE_PER_KM = 2.0  # €/km
BASE_PRICE = 5.0    # € prise en charge

# Enums
class UserRole(str, Enum):
    CLIENT = "client"
    DRIVER = "driver"
    ADMIN = "admin"

class TripStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class DriverStatus(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    EN_ROUTE = "en_route"
    OFFLINE = "offline"

class VehicleType(str, Enum):
    BERLINE = "berline"
    VAN = "van"
    PRESTIGE = "prestige"

# Pydantic Models
class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    phone: str
    name: str

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.DRIVER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: UserRole
    status: DriverStatus = DriverStatus.OFFLINE
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_trips: int = 0
    total_revenue: float = 0.0
    commission_rate: float = 0.15  # 15% default
    notes: str = ""
    is_active: bool = True

class UserResponse(BaseModel):
    id: str
    email: str
    phone: str
    name: str
    role: str
    status: str
    created_at: str
    total_trips: int
    total_revenue: float
    commission_rate: float
    notes: str
    is_active: bool

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class TripCreate(BaseModel):
    client_name: str
    client_phone: str
    client_email: EmailStr
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    dropoff_address: str
    dropoff_lat: float
    dropoff_lng: float
    pickup_datetime: datetime
    vehicle_type: VehicleType = VehicleType.BERLINE
    luggage_count: int = 0
    passengers: int = 1
    notes: str = ""

class Trip(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    client_phone: str
    client_email: str
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    dropoff_address: str
    dropoff_lat: float
    dropoff_lng: float
    pickup_datetime: datetime
    vehicle_type: VehicleType
    luggage_count: int
    passengers: int
    notes: str
    distance_km: float = 0.0
    price: float = 0.0
    status: TripStatus = TripStatus.PENDING
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    commission_amount: float = 0.0
    commission_rate: float = 0.15
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class TripResponse(BaseModel):
    id: str
    client_name: str
    client_phone: str
    client_email: str
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    dropoff_address: str
    dropoff_lat: float
    dropoff_lng: float
    pickup_datetime: str
    vehicle_type: str
    luggage_count: int
    passengers: int
    notes: str
    distance_km: float
    price: float
    status: str
    driver_id: Optional[str]
    driver_name: Optional[str]
    commission_amount: float
    commission_rate: float
    created_at: str
    updated_at: str
    completed_at: Optional[str]

class TripAssign(BaseModel):
    driver_id: str
    commission_rate: Optional[float] = None

class TripStatusUpdate(BaseModel):
    status: TripStatus

class DriverStatusUpdate(BaseModel):
    status: DriverStatus

class CommissionUpdate(BaseModel):
    commission_rate: float

class DriverNoteUpdate(BaseModel):
    notes: str

class AddressSearchResult(BaseModel):
    display_name: str
    lat: float
    lon: float

class StatsResponse(BaseModel):
    total_trips: int
    completed_trips: int
    pending_trips: int
    total_revenue: float
    total_commission: float
    acceptance_rate: float

class DriverStats(BaseModel):
    daily_revenue: float
    weekly_revenue: float
    monthly_revenue: float
    total_trips: int
    completed_trips: int
    commission_due: float

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in km between two points"""
    return geodesic((lat1, lng1), (lat2, lng2)).kilometers

def calculate_price(distance_km: float) -> float:
    """Calculate price: 2€/km + 5€ base"""
    return round(BASE_PRICE + (distance_km * PRICE_PER_KM), 2)

def user_to_response(user: dict) -> UserResponse:
    return UserResponse(
        id=user.get("id", ""),
        email=user.get("email", ""),
        phone=user.get("phone", ""),
        name=user.get("name", ""),
        role=user.get("role", "driver"),
        status=user.get("status", "offline"),
        created_at=user.get("created_at", datetime.now(timezone.utc).isoformat()) if isinstance(user.get("created_at"), str) else user.get("created_at", datetime.now(timezone.utc)).isoformat(),
        total_trips=user.get("total_trips", 0),
        total_revenue=user.get("total_revenue", 0.0),
        commission_rate=user.get("commission_rate", 0.15),
        notes=user.get("notes", ""),
        is_active=user.get("is_active", True)
    )

def trip_to_response(trip: dict) -> TripResponse:
    def format_datetime(dt):
        if dt is None:
            return None
        if isinstance(dt, str):
            return dt
        return dt.isoformat()
    
    return TripResponse(
        id=trip.get("id", ""),
        client_name=trip.get("client_name", ""),
        client_phone=trip.get("client_phone", ""),
        client_email=trip.get("client_email", ""),
        pickup_address=trip.get("pickup_address", ""),
        pickup_lat=trip.get("pickup_lat", 0.0),
        pickup_lng=trip.get("pickup_lng", 0.0),
        dropoff_address=trip.get("dropoff_address", ""),
        dropoff_lat=trip.get("dropoff_lat", 0.0),
        dropoff_lng=trip.get("dropoff_lng", 0.0),
        pickup_datetime=format_datetime(trip.get("pickup_datetime")),
        vehicle_type=trip.get("vehicle_type", "berline"),
        luggage_count=trip.get("luggage_count", 0),
        passengers=trip.get("passengers", 1),
        notes=trip.get("notes", ""),
        distance_km=trip.get("distance_km", 0.0),
        price=trip.get("price", 0.0),
        status=trip.get("status", "pending"),
        driver_id=trip.get("driver_id"),
        driver_name=trip.get("driver_name"),
        commission_amount=trip.get("commission_amount", 0.0),
        commission_rate=trip.get("commission_rate", 0.15),
        created_at=format_datetime(trip.get("created_at")),
        updated_at=format_datetime(trip.get("updated_at")),
        completed_at=format_datetime(trip.get("completed_at"))
    )

# Email notification via Gmail SMTP
async def send_email_notification(to_email: str, subject: str, body: str):
    """Send email notification via SMTP"""
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')
    smtp_from = os.environ.get('SMTP_FROM', smtp_user)
    
    if not smtp_user or not smtp_pass:
        logger.warning(f"SMTP not configured - Email to {to_email}: {subject}")
        return
    
    try:
        # Create HTML email
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"MSLK VTC <{smtp_from}>"
        message["To"] = to_email
        
        # HTML content with MSLK branding
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Helvetica', Arial, sans-serif; background-color: #000000; color: #ffffff; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: #121212; border: 1px solid #D4AF37; padding: 30px; }}
                .header {{ text-align: center; margin-bottom: 30px; }}
                .logo {{ font-size: 32px; color: #D4AF37; font-weight: bold; }}
                .content {{ color: #ffffff; line-height: 1.6; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #D4AF37; text-align: center; color: #A1A1A1; font-size: 12px; }}
                .gold {{ color: #D4AF37; }}
                .btn {{ display: inline-block; background-color: #D4AF37; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">MSLK VTC</div>
                    <p class="gold">L'élégance et le confort à chaque trajet</p>
                </div>
                <div class="content">
                    {body.replace(chr(10), '<br>')}
                </div>
                <div class="footer">
                    <p>Assistance MSLK : <span class="gold">+33 7 80 99 63 63</span></p>
                    <p>Clermont-Ferrand | © 2024 MSLK VTC</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_part = MIMEText(body, "plain")
        html_part = MIMEText(html_body, "html")
        message.attach(text_part)
        message.attach(html_part)
        
        # Send via SMTP
        await aiosmtplib.send(
            message,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_pass,
            start_tls=True
        )
        logger.info(f"Email sent to {to_email}: {subject}")
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")

# Routes

# Health check
@api_router.get("/")
async def root():
    return {"message": "MSLK VTC API", "status": "running"}

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        phone=user_data.phone,
        name=user_data.name,
        role=user_data.role
    )
    
    user_dict = user.model_dump()
    user_dict["password_hash"] = hash_password(user_data.password)
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    
    token = create_token(user.id, user.role.value)
    return TokenResponse(token=token, user=user_to_response(user_dict))

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account disabled")
    
    token = create_token(user["id"], user["role"])
    return TokenResponse(token=token, user=user_to_response(user))

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return user_to_response(current_user)

# Client Auth Routes
class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str

class ClientResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    created_at: str

class ClientTokenResponse(BaseModel):
    token: str
    user: ClientResponse

@api_router.post("/auth/client/register", response_model=ClientTokenResponse)
async def register_client(client_data: ClientCreate):
    """Register a new client"""
    existing = await db.clients.find_one({"email": client_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    client_id = str(uuid.uuid4())
    client = {
        "id": client_id,
        "name": client_data.name,
        "email": client_data.email,
        "phone": client_data.phone,
        "password_hash": hash_password(client_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.clients.insert_one(client)
    
    token = create_token(client_id, "client")
    
    # Send welcome email
    await send_email_notification(
        client_data.email,
        "Bienvenue chez MSLK VTC",
        f"Bonjour {client_data.name},\n\nVotre compte MSLK VTC a été créé avec succès.\n\nVous pouvez maintenant réserver vos courses et suivre leur statut depuis votre espace personnel.\n\nL'équipe MSLK VTC"
    )
    
    return ClientTokenResponse(
        token=token,
        user=ClientResponse(
            id=client["id"],
            name=client["name"],
            email=client["email"],
            phone=client["phone"],
            created_at=client["created_at"]
        )
    )

@api_router.post("/auth/client/login", response_model=ClientTokenResponse)
async def login_client(credentials: UserLogin):
    """Login as client"""
    client = await db.clients.find_one({"email": credentials.email}, {"_id": 0})
    if not client or not verify_password(credentials.password, client.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    token = create_token(client["id"], "client")
    return ClientTokenResponse(
        token=token,
        user=ClientResponse(
            id=client["id"],
            name=client["name"],
            email=client["email"],
            phone=client["phone"],
            created_at=client["created_at"]
        )
    )

# Trip Routes (Public - for clients)
@api_router.post("/trips", response_model=TripResponse)
async def create_trip(trip_data: TripCreate):
    """Create a new trip booking (public endpoint for clients)"""
    # Calculate distance and price
    distance = calculate_distance(
        trip_data.pickup_lat, trip_data.pickup_lng,
        trip_data.dropoff_lat, trip_data.dropoff_lng
    )
    price = calculate_price(distance)
    
    trip = Trip(
        client_name=trip_data.client_name,
        client_phone=trip_data.client_phone,
        client_email=trip_data.client_email,
        pickup_address=trip_data.pickup_address,
        pickup_lat=trip_data.pickup_lat,
        pickup_lng=trip_data.pickup_lng,
        dropoff_address=trip_data.dropoff_address,
        dropoff_lat=trip_data.dropoff_lat,
        dropoff_lng=trip_data.dropoff_lng,
        pickup_datetime=trip_data.pickup_datetime,
        vehicle_type=trip_data.vehicle_type,
        luggage_count=trip_data.luggage_count,
        passengers=trip_data.passengers,
        notes=trip_data.notes,
        distance_km=round(distance, 2),
        price=price
    )
    
    trip_dict = trip.model_dump()
    trip_dict["pickup_datetime"] = trip_dict["pickup_datetime"].isoformat()
    trip_dict["created_at"] = trip_dict["created_at"].isoformat()
    trip_dict["updated_at"] = trip_dict["updated_at"].isoformat()
    
    await db.trips.insert_one(trip_dict)
    
    # Send confirmation email
    await send_email_notification(
        trip_data.client_email,
        "MSLK VTC - Confirmation de réservation",
        f"Votre course du {trip_data.pickup_datetime.strftime('%d/%m/%Y à %H:%M')} a été enregistrée. Prix estimé: {price}€"
    )
    
    return trip_to_response(trip_dict)

@api_router.get("/trips/calculate-price")
async def calculate_trip_price(pickup_lat: float, pickup_lng: float, dropoff_lat: float, dropoff_lng: float):
    """Calculate price preview"""
    distance = calculate_distance(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)
    price = calculate_price(distance)
    return {
        "distance_km": round(distance, 2),
        "price": price,
        "base_price": BASE_PRICE,
        "price_per_km": PRICE_PER_KM
    }

@api_router.get("/trips/client/{email}", response_model=List[TripResponse])
async def get_client_trips(email: str):
    """Get trip history for a client by email"""
    trips = await db.trips.find({"client_email": email}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [trip_to_response(t) for t in trips]

# Driver Routes
@api_router.get("/driver/trips", response_model=List[TripResponse])
async def get_driver_trips(current_user: dict = Depends(get_current_user)):
    """Get available trips for drivers (pending and assigned to them)"""
    if current_user["role"] not in [UserRole.DRIVER.value, UserRole.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Drivers only")
    
    # Get pending trips and trips assigned to this driver
    trips = await db.trips.find({
        "$or": [
            {"status": TripStatus.PENDING.value},
            {"status": TripStatus.ASSIGNED.value, "driver_id": current_user["id"]},
            {"driver_id": current_user["id"]}
        ]
    }, {"_id": 0}).sort("pickup_datetime", 1).to_list(100)
    
    return [trip_to_response(t) for t in trips]

@api_router.post("/driver/trips/{trip_id}/accept", response_model=TripResponse)
async def accept_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    """Driver accepts a trip"""
    if current_user["role"] != UserRole.DRIVER.value:
        raise HTTPException(status_code=403, detail="Drivers only")
    
    trip = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if trip["status"] not in [TripStatus.PENDING.value, TripStatus.ASSIGNED.value]:
        raise HTTPException(status_code=400, detail="Trip cannot be accepted")
    
    if trip["status"] == TripStatus.ASSIGNED.value and trip.get("driver_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Trip assigned to another driver")
    
    # Update trip
    now = datetime.now(timezone.utc).isoformat()
    await db.trips.update_one(
        {"id": trip_id},
        {"$set": {
            "status": TripStatus.ACCEPTED.value,
            "driver_id": current_user["id"],
            "driver_name": current_user["name"],
            "updated_at": now
        }}
    )
    
    # Update driver status
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"status": DriverStatus.BUSY.value}}
    )
    
    updated = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    return trip_to_response(updated)

@api_router.post("/driver/trips/{trip_id}/refuse", response_model=dict)
async def refuse_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    """Driver refuses an assigned trip"""
    if current_user["role"] != UserRole.DRIVER.value:
        raise HTTPException(status_code=403, detail="Drivers only")
    
    trip = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if trip.get("driver_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your trip")
    
    # Reset trip to pending
    now = datetime.now(timezone.utc).isoformat()
    await db.trips.update_one(
        {"id": trip_id},
        {"$set": {
            "status": TripStatus.PENDING.value,
            "driver_id": None,
            "driver_name": None,
            "updated_at": now
        }}
    )
    
    return {"message": "Trip refused"}

@api_router.post("/driver/trips/{trip_id}/status", response_model=TripResponse)
async def update_trip_status(trip_id: str, status_update: TripStatusUpdate, current_user: dict = Depends(get_current_user)):
    """Update trip status (in_progress, completed)"""
    if current_user["role"] != UserRole.DRIVER.value:
        raise HTTPException(status_code=403, detail="Drivers only")
    
    trip = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if trip.get("driver_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your trip")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {
        "status": status_update.status.value,
        "updated_at": now
    }
    
    # If completing trip
    if status_update.status == TripStatus.COMPLETED:
        update_data["completed_at"] = now
        commission = trip["price"] * trip.get("commission_rate", 0.15)
        update_data["commission_amount"] = round(commission, 2)
        
        # Update driver stats
        await db.users.update_one(
            {"id": current_user["id"]},
            {
                "$inc": {
                    "total_trips": 1,
                    "total_revenue": trip["price"]
                },
                "$set": {"status": DriverStatus.AVAILABLE.value}
            }
        )
    elif status_update.status == TripStatus.IN_PROGRESS:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"status": DriverStatus.EN_ROUTE.value}}
        )
    
    await db.trips.update_one({"id": trip_id}, {"$set": update_data})
    
    updated = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    return trip_to_response(updated)

@api_router.put("/driver/status", response_model=UserResponse)
async def update_driver_status(status_update: DriverStatusUpdate, current_user: dict = Depends(get_current_user)):
    """Update driver availability status"""
    if current_user["role"] != UserRole.DRIVER.value:
        raise HTTPException(status_code=403, detail="Drivers only")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"status": status_update.status.value}}
    )
    
    updated = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    return user_to_response(updated)

@api_router.get("/driver/stats", response_model=DriverStats)
async def get_driver_stats(current_user: dict = Depends(get_current_user)):
    """Get driver statistics"""
    if current_user["role"] != UserRole.DRIVER.value:
        raise HTTPException(status_code=403, detail="Drivers only")
    
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    driver_id = current_user["id"]
    
    # Daily revenue
    daily_trips = await db.trips.find({
        "driver_id": driver_id,
        "status": TripStatus.COMPLETED.value,
        "completed_at": {"$gte": today_start}
    }, {"_id": 0, "price": 1}).to_list(1000)
    daily_revenue = sum(t.get("price", 0) for t in daily_trips)
    
    # Weekly revenue
    weekly_trips = await db.trips.find({
        "driver_id": driver_id,
        "status": TripStatus.COMPLETED.value,
        "completed_at": {"$gte": week_start}
    }, {"_id": 0, "price": 1}).to_list(1000)
    weekly_revenue = sum(t.get("price", 0) for t in weekly_trips)
    
    # Monthly revenue
    monthly_trips = await db.trips.find({
        "driver_id": driver_id,
        "status": TripStatus.COMPLETED.value,
        "completed_at": {"$gte": month_start}
    }, {"_id": 0, "price": 1, "commission_amount": 1}).to_list(1000)
    monthly_revenue = sum(t.get("price", 0) for t in monthly_trips)
    commission_due = sum(t.get("commission_amount", 0) for t in monthly_trips)
    
    # Total trips
    total_trips = await db.trips.count_documents({"driver_id": driver_id})
    completed_trips = await db.trips.count_documents({"driver_id": driver_id, "status": TripStatus.COMPLETED.value})
    
    return DriverStats(
        daily_revenue=round(daily_revenue, 2),
        weekly_revenue=round(weekly_revenue, 2),
        monthly_revenue=round(monthly_revenue, 2),
        total_trips=total_trips,
        completed_trips=completed_trips,
        commission_due=round(commission_due, 2)
    )

# Admin Routes
@api_router.get("/admin/drivers", response_model=List[UserResponse])
async def get_all_drivers(current_user: dict = Depends(get_current_user)):
    """Get all drivers (admin only)"""
    if current_user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admins only")
    
    drivers = await db.users.find({"role": UserRole.DRIVER.value}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [user_to_response(d) for d in drivers]

@api_router.get("/admin/trips", response_model=List[TripResponse])
async def get_all_trips(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get all trips (admin only)"""
    if current_user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admins only")
    
    query = {}
    if status:
        query["status"] = status
    
    trips = await db.trips.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [trip_to_response(t) for t in trips]

@api_router.post("/admin/trips/{trip_id}/assign", response_model=TripResponse)
async def assign_trip(trip_id: str, assignment: TripAssign, current_user: dict = Depends(get_current_user)):
    """Assign trip to driver (admin dispatch)"""
    if current_user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admins only")
    
    trip = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    driver = await db.users.find_one({"id": assignment.driver_id, "role": UserRole.DRIVER.value}, {"_id": 0})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    now = datetime.now(timezone.utc).isoformat()
    commission_rate = assignment.commission_rate if assignment.commission_rate is not None else driver.get("commission_rate", 0.15)
    
    await db.trips.update_one(
        {"id": trip_id},
        {"$set": {
            "status": TripStatus.ASSIGNED.value,
            "driver_id": driver["id"],
            "driver_name": driver["name"],
            "commission_rate": commission_rate,
            "updated_at": now
        }}
    )
    
    # Notify driver (email)
    await send_email_notification(
        driver["email"],
        "MSLK VTC - Nouvelle course assignée",
        f"Une nouvelle course vous a été assignée. Départ: {trip['pickup_address']}"
    )
    
    updated = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    return trip_to_response(updated)

@api_router.put("/admin/trips/{trip_id}/commission", response_model=TripResponse)
async def update_trip_commission(trip_id: str, commission: CommissionUpdate, current_user: dict = Depends(get_current_user)):
    """Update commission rate for a specific trip"""
    if current_user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admins only")
    
    trip = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    commission_amount = trip["price"] * commission.commission_rate
    
    await db.trips.update_one(
        {"id": trip_id},
        {"$set": {
            "commission_rate": commission.commission_rate,
            "commission_amount": round(commission_amount, 2),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    return trip_to_response(updated)

@api_router.delete("/admin/trips/{trip_id}")
async def cancel_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel a trip"""
    if current_user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admins only")
    
    result = await db.trips.update_one(
        {"id": trip_id},
        {"$set": {
            "status": TripStatus.CANCELLED.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return {"message": "Trip cancelled"}

@api_router.put("/admin/drivers/{driver_id}/commission", response_model=UserResponse)
async def update_driver_commission(driver_id: str, commission: CommissionUpdate, current_user: dict = Depends(get_current_user)):
    """Update default commission rate for a driver"""
    if current_user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admins only")
    
    result = await db.users.update_one(
        {"id": driver_id, "role": UserRole.DRIVER.value},
        {"$set": {"commission_rate": commission.commission_rate}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    updated = await db.users.find_one({"id": driver_id}, {"_id": 0})
    return user_to_response(updated)

@api_router.put("/admin/drivers/{driver_id}/notes", response_model=UserResponse)
async def update_driver_notes(driver_id: str, note_update: DriverNoteUpdate, current_user: dict = Depends(get_current_user)):
    """Add notes to a driver"""
    if current_user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admins only")
    
    result = await db.users.update_one(
        {"id": driver_id, "role": UserRole.DRIVER.value},
        {"$set": {"notes": note_update.notes}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    updated = await db.users.find_one({"id": driver_id}, {"_id": 0})
    return user_to_response(updated)

@api_router.put("/admin/drivers/{driver_id}/toggle-active", response_model=UserResponse)
async def toggle_driver_active(driver_id: str, current_user: dict = Depends(get_current_user)):
    """Enable/disable a driver"""
    if current_user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admins only")
    
    driver = await db.users.find_one({"id": driver_id, "role": UserRole.DRIVER.value}, {"_id": 0})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    new_status = not driver.get("is_active", True)
    await db.users.update_one(
        {"id": driver_id},
        {"$set": {"is_active": new_status}}
    )
    
    updated = await db.users.find_one({"id": driver_id}, {"_id": 0})
    return user_to_response(updated)

@api_router.get("/admin/stats", response_model=StatsResponse)
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    """Get global statistics"""
    if current_user["role"] != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admins only")
    
    total_trips = await db.trips.count_documents({})
    completed_trips = await db.trips.count_documents({"status": TripStatus.COMPLETED.value})
    pending_trips = await db.trips.count_documents({"status": TripStatus.PENDING.value})
    
    # Calculate totals
    completed = await db.trips.find({"status": TripStatus.COMPLETED.value}, {"_id": 0, "price": 1, "commission_amount": 1}).to_list(10000)
    total_revenue = sum(t.get("price", 0) for t in completed)
    total_commission = sum(t.get("commission_amount", 0) for t in completed)
    
    # Acceptance rate
    assigned_count = await db.trips.count_documents({"status": {"$in": [TripStatus.ASSIGNED.value, TripStatus.ACCEPTED.value, TripStatus.IN_PROGRESS.value, TripStatus.COMPLETED.value]}})
    acceptance_rate = (assigned_count / total_trips * 100) if total_trips > 0 else 0
    
    return StatsResponse(
        total_trips=total_trips,
        completed_trips=completed_trips,
        pending_trips=pending_trips,
        total_revenue=round(total_revenue, 2),
        total_commission=round(total_commission, 2),
        acceptance_rate=round(acceptance_rate, 1)
    )

# Address autocomplete - Local database with common addresses
CLERMONT_ADDRESSES = [
    {"name": "Place de Jaude, Clermont-Ferrand", "lat": 45.7772, "lon": 3.0870},
    {"name": "Gare SNCF Clermont-Ferrand", "lat": 45.7789, "lon": 3.1003},
    {"name": "Aéroport Clermont-Ferrand Auvergne", "lat": 45.7867, "lon": 3.1631},
    {"name": "CHU Clermont-Ferrand Gabriel Montpied", "lat": 45.7534, "lon": 3.1134},
    {"name": "Centre Jaude, Clermont-Ferrand", "lat": 45.7765, "lon": 3.0875},
    {"name": "Cathédrale Notre-Dame-de-l'Assomption, Clermont-Ferrand", "lat": 45.7791, "lon": 3.0847},
    {"name": "Stade Gabriel Montpied, Clermont-Ferrand", "lat": 45.7628, "lon": 3.1265},
    {"name": "Université Clermont Auvergne, Campus des Cézeaux", "lat": 45.7601, "lon": 3.1108},
    {"name": "Vulcania, Saint-Ours-les-Roches", "lat": 45.8142, "lon": 2.9408},
    {"name": "Place Delille, Clermont-Ferrand", "lat": 45.7784, "lon": 3.0823},
    {"name": "Les Puys, Clermont-Ferrand", "lat": 45.7723, "lon": 3.0612},
    {"name": "Royat, Puy-de-Dôme", "lat": 45.7669, "lon": 3.0494},
    {"name": "Chamalières, Puy-de-Dôme", "lat": 45.7742, "lon": 3.0625},
    {"name": "Cournon-d'Auvergne, Puy-de-Dôme", "lat": 45.7356, "lon": 3.1969},
    {"name": "Riom, Puy-de-Dôme", "lat": 45.8931, "lon": 3.1133},
    {"name": "Vichy, Allier", "lat": 46.1283, "lon": 3.4258},
    {"name": "Place du 1er Mai, Clermont-Ferrand", "lat": 45.7808, "lon": 3.0839},
    {"name": "Montferrand, Clermont-Ferrand", "lat": 45.7917, "lon": 3.1139},
    {"name": "La Pardieu, Clermont-Ferrand", "lat": 45.7583, "lon": 3.1319},
    {"name": "Croix de Neyrat, Clermont-Ferrand", "lat": 45.8014, "lon": 3.0953},
    {"name": "Zenith d'Auvergne, Cournon-d'Auvergne", "lat": 45.7389, "lon": 3.1975},
    {"name": "Polydome, Clermont-Ferrand", "lat": 45.7661, "lon": 3.1167},
    {"name": "Maison de la Culture, Clermont-Ferrand", "lat": 45.7747, "lon": 3.0992},
    {"name": "Boulevard Trudaine, Clermont-Ferrand", "lat": 45.7756, "lon": 3.0847},
    {"name": "Avenue Julien, Clermont-Ferrand", "lat": 45.7739, "lon": 3.0772},
]

@api_router.get("/geocode/search", response_model=List[AddressSearchResult])
async def search_address(q: str):
    """Search address - local database for Clermont-Ferrand region"""
    if len(q) < 2:
        return []
    
    query = q.lower().strip()
    results = []
    
    # Search in local database
    for addr in CLERMONT_ADDRESSES:
        if query in addr["name"].lower():
            results.append(AddressSearchResult(
                display_name=addr["name"],
                lat=addr["lat"],
                lon=addr["lon"]
            ))
    
    # If no local results, try external API
    if not results:
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                # Try Nominatim with proper headers
                response = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={
                        "q": f"{q}, France",
                        "format": "json",
                        "limit": 5,
                        "countrycodes": "fr"
                    },
                    headers={
                        "User-Agent": "MSLK-VTC-Clermont-Ferrand/1.0 (contact@mslk-vtc.fr)",
                        "Accept-Language": "fr"
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    for r in data:
                        results.append(AddressSearchResult(
                            display_name=r.get("display_name", ""),
                            lat=float(r.get("lat", 0)),
                            lon=float(r.get("lon", 0))
                        ))
            except Exception as e:
                logger.warning(f"External geocoding failed: {e}")
    
    return results[:5]

# Create default admin on startup
@app.on_event("startup")
async def create_default_admin():
    admin = await db.users.find_one({"role": UserRole.ADMIN.value})
    if not admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "mslkdriver@gmail.com",
            "phone": "+33780996363",
            "name": "Admin MSLK",
            "role": UserRole.ADMIN.value,
            "status": DriverStatus.OFFLINE.value,
            "password_hash": hash_password("SAMIR1663"),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "total_trips": 0,
            "total_revenue": 0.0,
            "commission_rate": 0,
            "notes": "",
            "is_active": True
        }
        await db.users.insert_one(admin_user)
        logger.info("Admin MSLK created")

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
