import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { 
  MapPin, Navigation, Calendar, Clock, Car, Users, Briefcase, Phone, 
  LogOut, Bell, Check, X, Play, Flag, TrendingUp, DollarSign, Route,
  ExternalLink, RefreshCw, Mail, MailX
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_gold-ride/artifacts/xlxl6dl3_537513862_122096432576993953_3681223875377855937_n.jpg";

// Money notification sound (cash register)
const playNotificationSound = () => {
  const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/888/888-preview.mp3");
  audio.volume = 0.8;
  audio.play().catch(() => {});
};

const statusLabels = {
  pending: "En attente",
  assigned: "Assignée",
  accepted: "Acceptée",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée"
};

const statusColors = {
  pending: "status-pending",
  assigned: "status-assigned",
  accepted: "status-accepted",
  in_progress: "status-in-progress",
  completed: "status-completed",
  cancelled: "status-cancelled"
};

const driverStatusLabels = {
  available: "Disponible",
  busy: "Occupé",
  en_route: "En route",
  offline: "Hors ligne"
};

const driverStatusColors = {
  available: "text-emerald-400",
  busy: "text-red-400",
  en_route: "text-[#D4AF37]",
  offline: "text-gray-500"
};

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const lastNotificationCheck = useRef(null);

  // Get token from localStorage
  const getAuthHeader = () => {
    const token = localStorage.getItem("mslk_token");
    return { Authorization: `Bearer ${token}` };
  };

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem("mslk_token");
    const savedUser = localStorage.getItem("mslk_user");
    
    if (!token || !savedUser) {
      navigate("/chauffeur");
      return;
    }
    
    const userData = JSON.parse(savedUser);
    if (userData.role !== "driver") {
      navigate("/chauffeur");
      return;
    }
    
    setUser(userData);
    setEmailNotifications(userData.email_notifications !== false);
    fetchData();
    checkNotifications();
  }, [navigate]);

  // Check for new notifications (from admin ring)
  const checkNotifications = async () => {
    try {
      const response = await axios.get(`${API}/driver/notifications`, { headers: getAuthHeader() });
      if (response.data.length > 0) {
        // Play sound for new notifications
        playNotificationSound();
        toast.info("🔔 Nouvelle course disponible !", {
          duration: 5000,
          style: { background: '#D4AF37', color: '#000' }
        });
        
        // Mark notifications as read
        for (const notif of response.data) {
          await axios.post(`${API}/driver/notifications/${notif.id}/read`, {}, { headers: getAuthHeader() });
        }
        
        // Refresh data
        fetchData();
      }
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  };

  // Check notifications every 10 seconds
  useEffect(() => {
    const interval = setInterval(checkNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch trips and stats
  const fetchData = async () => {
    try {
      const [tripsRes, statsRes, meRes] = await Promise.all([
        axios.get(`${API}/driver/trips`, { headers: getAuthHeader() }),
        axios.get(`${API}/driver/stats`, { headers: getAuthHeader() }),
        axios.get(`${API}/auth/me`, { headers: getAuthHeader() })
      ]);
      
      setTrips(tripsRes.data);
      setStats(statsRes.data);
      setUser(meRes.data);
      setEmailNotifications(meRes.data.email_notifications !== false);
      localStorage.setItem("mslk_user", JSON.stringify(meRes.data));
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Toggle email notifications
  const toggleEmailNotifications = async (enabled) => {
    try {
      await axios.put(
        `${API}/driver/email-notifications`,
        { email_notifications: enabled },
        { headers: getAuthHeader() }
      );
      setEmailNotifications(enabled);
      toast.success(enabled ? "Notifications email activées" : "Notifications email désactivées");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // Update status
  const updateDriverStatus = async (status) => {
    try {
      const response = await axios.put(
        `${API}/driver/status`,
        { status },
        { headers: getAuthHeader() }
      );
      setUser(response.data);
      localStorage.setItem("mslk_user", JSON.stringify(response.data));
      toast.success(`Statut: ${driverStatusLabels[status]}`);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  // Accept trip
  const acceptTrip = async (tripId) => {
    try {
      await axios.post(
        `${API}/driver/trips/${tripId}/accept`,
        {},
        { headers: getAuthHeader() }
      );
      toast.success("Course acceptée !");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Refuse trip
  const refuseTrip = async (tripId) => {
    try {
      await axios.post(
        `${API}/driver/trips/${tripId}/refuse`,
        {},
        { headers: getAuthHeader() }
      );
      toast.info("Course refusée");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Update trip status
  const updateTripStatus = async (tripId, status) => {
    try {
      await axios.post(
        `${API}/driver/trips/${tripId}/status`,
        { status },
        { headers: getAuthHeader() }
      );
      toast.success(`Course ${statusLabels[status].toLowerCase()}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Open navigation
  const openNavigation = (lat, lng, address) => {
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    
    // Try Waze first, fallback to Google Maps
    window.open(wazeUrl, "_blank");
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("mslk_token");
    localStorage.removeItem("mslk_user");
    navigate("/chauffeur");
  };

  // Format helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  // Separate trips by category
  const pendingTrips = trips.filter(t => t.status === "pending" || (t.status === "assigned" && t.driver_id === user?.id));
  const activeTrips = trips.filter(t => t.status === "accepted" || t.status === "in_progress");
  const completedTrips = trips.filter(t => t.status === "completed").slice(0, 5);

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <header className="bg-[#121212] border-b border-[#D4AF37]/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <img src={LOGO_URL} alt="MSLK VTC" className="h-10 w-auto" />
            
            <div className="flex items-center gap-4">
              {/* Status Selector */}
              <Select 
                value={user?.status || "offline"} 
                onValueChange={updateDriverStatus}
              >
                <SelectTrigger className="w-[140px] bg-black border-[#D4AF37]/50 text-white" data-testid="driver-status-select">
                  <div className={`flex items-center gap-2 ${driverStatusColors[user?.status || "offline"]}`}>
                    <span className="w-2 h-2 rounded-full bg-current" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#D4AF37]">
                  <SelectItem value="available" className="text-emerald-400">Disponible</SelectItem>
                  <SelectItem value="busy" className="text-red-400">Occupé</SelectItem>
                  <SelectItem value="offline" className="text-gray-400">Hors ligne</SelectItem>
                </SelectContent>
              </Select>

              {/* Refresh */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRefresh}
                className="text-[#A1A1A1] hover:text-[#D4AF37]"
                data-testid="btn-refresh"
              >
                <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
              </Button>

              {/* Logout */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="text-[#A1A1A1] hover:text-red-400"
                data-testid="btn-logout"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-white" data-testid="driver-welcome">
            Bonjour, <span className="text-[#D4AF37]">{user?.name}</span>
          </h1>
          <p className="text-[#A1A1A1] text-sm">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* Email notification toggle */}
        <div className="bg-[#121212] border border-[#D4AF37]/20 p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {emailNotifications ? (
              <Mail className="w-5 h-5 text-emerald-400" />
            ) : (
              <MailX className="w-5 h-5 text-gray-500" />
            )}
            <div>
              <p className="text-white text-sm font-medium">Notifications par email</p>
              <p className="text-[#A1A1A1] text-xs">Recevoir un email pour chaque nouvelle course</p>
            </div>
          </div>
          <Switch
            checked={emailNotifications}
            onCheckedChange={toggleEmailNotifications}
            className="data-[state=checked]:bg-[#D4AF37]"
            data-testid="email-toggle"
          />
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="stats-card" data-testid="stat-daily">
              <DollarSign className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
              <p className="stats-value">{stats.daily_revenue.toFixed(0)}€</p>
              <p className="stats-label">Aujourd'hui</p>
            </div>
            <div className="stats-card" data-testid="stat-commission">
              <DollarSign className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="stats-value text-red-400">{(user?.total_commission || 0).toFixed(0)}€</p>
              <p className="stats-label">Commission totale</p>
            </div>
            <div className="stats-card" data-testid="stat-monthly">
              <DollarSign className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
              <p className="stats-value">{stats.monthly_revenue.toFixed(0)}€</p>
              <p className="stats-label">Ce mois</p>
            </div>
            <div className="stats-card" data-testid="stat-trips">
              <Route className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
              <p className="stats-value">{stats.completed_trips}</p>
              <p className="stats-label">Courses terminées</p>
            </div>
          </div>
        )}

        {/* Total Revenue Card */}
        <div className="bg-[#121212] border border-[#D4AF37]/30 p-4 mb-8">
          <p className="text-[#A1A1A1] text-sm">Revenu total généré</p>
          <p className="text-[#D4AF37] text-2xl font-bold">{(user?.total_revenue || 0).toFixed(2)} €</p>
        </div>

        {/* Pending/Assigned Trips */}
        {pendingTrips.length > 0 && (
          <div className="mb-8">
            <h2 className="font-heading text-xl font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
              <Bell className="animate-pulse" />
              Courses disponibles ({pendingTrips.length})
            </h2>
            <div className="space-y-4">
              {pendingTrips.map((trip) => (
                <div 
                  key={trip.id} 
                  className="trip-card new-trip animate-fade-in"
                  data-testid={`pending-trip-${trip.id}`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`status-badge ${statusColors[trip.status]}`}>
                      {trip.status === "assigned" ? "Pour vous" : statusLabels[trip.status]}
                    </span>
                    <p className="text-[#D4AF37] font-heading text-2xl font-bold">
                      {trip.price.toFixed(2)} €
                    </p>
                  </div>

                  {/* Date/Time */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1 text-white">
                      <Calendar size={14} className="text-[#D4AF37]" />
                      {formatDate(trip.pickup_datetime)}
                    </div>
                    <div className="flex items-center gap-1 text-white">
                      <Clock size={14} className="text-[#D4AF37]" />
                      {formatTime(trip.pickup_datetime)}
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[#A1A1A1] text-xs">DÉPART</p>
                        <p className="text-white text-sm">{trip.pickup_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Navigation className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[#A1A1A1] text-xs">ARRIVÉE</p>
                        <p className="text-white text-sm">{trip.dropoff_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Client & Details */}
                  <div className="flex flex-wrap gap-4 text-sm text-[#A1A1A1] mb-4 pt-4 border-t border-[#D4AF37]/10">
                    <span>{trip.client_name}</span>
                    <a href={`tel:${trip.client_phone}`} className="flex items-center gap-1 text-[#D4AF37]">
                      <Phone size={14} /> {trip.client_phone}
                    </a>
                    <span className="flex items-center gap-1">
                      <Car size={14} /> {trip.vehicle_type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} /> {trip.passengers}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase size={14} /> {trip.luggage_count}
                    </span>
                    <span className="text-[#D4AF37]">{trip.distance_km.toFixed(1)} km</span>
                    <span className="text-red-400 text-xs">Commission: {((trip.commission_rate || 0.15) * 100).toFixed(0)}%</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button 
                      className="btn-gold flex-1 h-12"
                      onClick={() => acceptTrip(trip.id)}
                      data-testid={`accept-trip-${trip.id}`}
                    >
                      <Check size={18} className="mr-2" /> Accepter
                    </Button>
                    {trip.status === "assigned" && (
                      <Button 
                        variant="outline"
                        className="flex-1 h-12 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                        onClick={() => refuseTrip(trip.id)}
                        data-testid={`refuse-trip-${trip.id}`}
                      >
                        <X size={18} className="mr-2" /> Refuser
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Trips */}
        {activeTrips.length > 0 && (
          <div className="mb-8">
            <h2 className="font-heading text-xl font-bold text-emerald-400 mb-4">
              Courses en cours ({activeTrips.length})
            </h2>
            <div className="space-y-4">
              {activeTrips.map((trip) => (
                <div 
                  key={trip.id} 
                  className="trip-card border-emerald-400/30"
                  data-testid={`active-trip-${trip.id}`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`status-badge ${statusColors[trip.status]}`}>
                      {statusLabels[trip.status]}
                    </span>
                    <p className="text-[#D4AF37] font-heading text-2xl font-bold">
                      {trip.price.toFixed(2)} €
                    </p>
                  </div>

                  {/* Addresses */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white text-sm">{trip.pickup_address}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[#D4AF37]"
                        onClick={() => openNavigation(trip.pickup_lat, trip.pickup_lng, trip.pickup_address)}
                      >
                        <ExternalLink size={16} />
                      </Button>
                    </div>
                    <div className="flex items-start gap-3">
                      <Navigation className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white text-sm">{trip.dropoff_address}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-emerald-400"
                        onClick={() => openNavigation(trip.dropoff_lat, trip.dropoff_lng, trip.dropoff_address)}
                      >
                        <ExternalLink size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Client */}
                  <div className="flex items-center gap-4 text-sm mb-4 pt-4 border-t border-[#D4AF37]/10">
                    <span className="text-white">{trip.client_name}</span>
                    <a href={`tel:${trip.client_phone}`} className="flex items-center gap-1 text-[#D4AF37]">
                      <Phone size={14} /> Appeler
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {trip.status === "accepted" && (
                      <Button 
                        className="btn-gold flex-1 h-12"
                        onClick={() => updateTripStatus(trip.id, "in_progress")}
                        data-testid={`start-trip-${trip.id}`}
                      >
                        <Play size={18} className="mr-2" /> Démarrer
                      </Button>
                    )}
                    {trip.status === "in_progress" && (
                      <Button 
                        className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={() => updateTripStatus(trip.id, "completed")}
                        data-testid={`complete-trip-${trip.id}`}
                      >
                        <Flag size={18} className="mr-2" /> Terminer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Completed */}
        {completedTrips.length > 0 && (
          <div>
            <h2 className="font-heading text-xl font-bold text-[#A1A1A1] mb-4">
              Dernières courses
            </h2>
            <div className="space-y-3">
              {completedTrips.map((trip) => (
                <div 
                  key={trip.id} 
                  className="bg-[#121212] border border-[#D4AF37]/10 p-4"
                  data-testid={`completed-trip-${trip.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm">{trip.pickup_address.split(",")[0]}</p>
                      <p className="text-[#A1A1A1] text-xs">
                        {formatDate(trip.pickup_datetime)} • {formatTime(trip.pickup_datetime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#D4AF37] font-bold">{trip.price.toFixed(2)} €</p>
                      <p className="text-[#A1A1A1] text-xs">{trip.distance_km.toFixed(1)} km</p>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-[#D4AF37]/10 text-xs">
                    <span className="text-[#A1A1A1]">Commission ({((trip.commission_rate || 0.15) * 100).toFixed(0)}%)</span>
                    <span className="text-red-400">{(trip.commission_amount || 0).toFixed(2)} €</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {pendingTrips.length === 0 && activeTrips.length === 0 && (
          <div className="text-center py-16">
            <Car className="w-16 h-16 text-[#D4AF37] mx-auto mb-4 opacity-50" />
            <p className="text-[#A1A1A1] mb-2">Aucune course pour le moment</p>
            <p className="text-[#A1A1A1] text-sm">Vous serez notifié dès qu'une course sera disponible</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="mobile-nav">
        <div className="flex justify-around items-center py-2">
          <Link to="/chauffeur/dashboard" className="flex flex-col items-center text-[#D4AF37]">
            <Car size={20} />
            <span className="text-xs mt-1">Courses</span>
          </Link>
          <button 
            onClick={handleRefresh}
            className="flex flex-col items-center text-[#A1A1A1] hover:text-[#D4AF37]"
          >
            <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
            <span className="text-xs mt-1">Actualiser</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center text-[#A1A1A1] hover:text-red-400"
          >
            <LogOut size={20} />
            <span className="text-xs mt-1">Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
}
