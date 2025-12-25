import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { 
  MapPin, Navigation, Calendar, Clock, Car, User, Phone, Mail,
  LogOut, Plus, History, ArrowLeft
} from "lucide-react";
import { Button } from "../components/ui/button";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_gold-ride/artifacts/xlxl6dl3_537513862_122096432576993953_3681223875377855937_n.jpg";

const statusLabels = {
  pending: "En attente",
  assigned: "Chauffeur assigné",
  accepted: "Confirmée",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée"
};

const statusColors = {
  pending: "bg-[#D4AF37]/20 text-[#D4AF37]",
  assigned: "bg-blue-500/20 text-blue-400",
  accepted: "bg-emerald-500/20 text-emerald-400",
  in_progress: "bg-[#D4AF37]/30 text-[#D4AF37]",
  completed: "bg-emerald-500/30 text-emerald-400",
  cancelled: "bg-red-500/20 text-red-400"
};

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeader = () => {
    const token = localStorage.getItem("mslk_client_token");
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const token = localStorage.getItem("mslk_client_token");
    const savedUser = localStorage.getItem("mslk_client_user");
    
    if (!token || !savedUser) {
      navigate("/client/connexion");
      return;
    }
    
    const userData = JSON.parse(savedUser);
    setUser(userData);
    fetchTrips(userData.email);
  }, [navigate]);

  const fetchTrips = async (email) => {
    try {
      const response = await axios.get(`${API}/trips/client/${encodeURIComponent(email)}`);
      setTrips(response.data);
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("mslk_client_token");
    localStorage.removeItem("mslk_client_user");
    navigate("/");
    toast.success("Déconnexion réussie");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  // Separate upcoming and past trips
  const now = new Date();
  const upcomingTrips = trips.filter(t => new Date(t.pickup_datetime) >= now && t.status !== "completed" && t.status !== "cancelled");
  const pastTrips = trips.filter(t => new Date(t.pickup_datetime) < now || t.status === "completed" || t.status === "cancelled");

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <header className="bg-[#121212] border-b border-[#D4AF37]/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-[#A1A1A1] hover:text-[#D4AF37]">
              <ArrowLeft size={20} />
            </Link>
            <img src={LOGO_URL} alt="MSLK VTC" className="h-10 w-auto" />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="text-[#A1A1A1] hover:text-red-400"
              data-testid="btn-client-logout"
            >
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Welcome Card */}
        <div className="bg-[#121212] border border-[#D4AF37]/20 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <User className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-white" data-testid="client-welcome">
                Bonjour, <span className="text-[#D4AF37]">{user?.name}</span>
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-[#A1A1A1]">
                <span className="flex items-center gap-1">
                  <Mail size={14} className="text-[#D4AF37]" />
                  {user?.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone size={14} className="text-[#D4AF37]" />
                  {user?.phone}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* New Booking Button */}
        <Link to="/">
          <Button className="btn-gold w-full h-14 text-lg mb-8" data-testid="btn-new-trip">
            <Plus size={20} className="mr-2" />
            Nouvelle réservation
          </Button>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="stats-card">
            <p className="stats-value text-2xl">{trips.length}</p>
            <p className="stats-label">Total courses</p>
          </div>
          <div className="stats-card">
            <p className="stats-value text-2xl">{upcomingTrips.length}</p>
            <p className="stats-label">À venir</p>
          </div>
        </div>

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <div className="mb-8">
            <h2 className="font-heading text-xl font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Prochaines courses ({upcomingTrips.length})
            </h2>
            <div className="space-y-4">
              {upcomingTrips.map((trip) => (
                <div key={trip.id} className="trip-card" data-testid={`upcoming-trip-${trip.id}`}>
                  {/* Status & Price */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[trip.status]}`}>
                      {statusLabels[trip.status]}
                    </span>
                    <p className="text-[#D4AF37] font-heading text-2xl font-bold">
                      {trip.price.toFixed(2)} €
                    </p>
                  </div>

                  {/* Date/Time */}
                  <div className="bg-black/50 p-3 rounded mb-4">
                    <div className="flex items-center gap-2 text-white">
                      <Calendar size={16} className="text-[#D4AF37]" />
                      <span className="font-medium">{formatDate(trip.pickup_datetime)}</span>
                      <Clock size={16} className="text-[#D4AF37] ml-2" />
                      <span className="font-medium">{formatTime(trip.pickup_datetime)}</span>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[#A1A1A1] text-xs">DÉPART</p>
                        <p className="text-white text-sm">{trip.pickup_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Navigation className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[#A1A1A1] text-xs">ARRIVÉE</p>
                        <p className="text-white text-sm">{trip.dropoff_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Driver info */}
                  {trip.driver_name && (
                    <div className="mt-4 pt-4 border-t border-[#D4AF37]/10">
                      <p className="text-sm">
                        <span className="text-[#A1A1A1]">Chauffeur : </span>
                        <span className="text-white font-medium">{trip.driver_name}</span>
                      </p>
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex flex-wrap gap-4 text-xs text-[#A1A1A1] mt-4 pt-4 border-t border-[#D4AF37]/10">
                    <span className="flex items-center gap-1">
                      <Car size={12} className="text-[#D4AF37]" />
                      {trip.vehicle_type}
                    </span>
                    <span>{trip.passengers} passager(s)</span>
                    <span>{trip.luggage_count} bagage(s)</span>
                    <span className="text-[#D4AF37]">{trip.distance_km.toFixed(1)} km</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Trips */}
        {pastTrips.length > 0 && (
          <div>
            <h2 className="font-heading text-xl font-bold text-[#A1A1A1] mb-4 flex items-center gap-2">
              <History size={20} />
              Historique ({pastTrips.length})
            </h2>
            <div className="space-y-3">
              {pastTrips.slice(0, 10).map((trip) => (
                <div 
                  key={trip.id} 
                  className="bg-[#121212] border border-[#D4AF37]/10 p-4"
                  data-testid={`past-trip-${trip.id}`}
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
                      <span className={`text-xs ${statusColors[trip.status]}`}>
                        {statusLabels[trip.status]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {trips.length === 0 && (
          <div className="text-center py-16">
            <Car className="w-16 h-16 text-[#D4AF37] mx-auto mb-4 opacity-50" />
            <p className="text-[#A1A1A1] mb-4">Vous n'avez pas encore de course</p>
            <Link to="/">
              <Button className="btn-gold">Réserver maintenant</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="mobile-nav">
        <div className="flex justify-around items-center py-2">
          <Link to="/" className="flex flex-col items-center text-[#A1A1A1] hover:text-[#D4AF37]">
            <Plus size={20} />
            <span className="text-xs mt-1">Réserver</span>
          </Link>
          <Link to="/client/espace" className="flex flex-col items-center text-[#D4AF37]">
            <History size={20} />
            <span className="text-xs mt-1">Mes courses</span>
          </Link>
          <button onClick={handleLogout} className="flex flex-col items-center text-[#A1A1A1] hover:text-red-400">
            <LogOut size={20} />
            <span className="text-xs mt-1">Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
}
