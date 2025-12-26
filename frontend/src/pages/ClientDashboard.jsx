import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { 
  MapPin, Navigation, Calendar, Clock, Car, User, Phone, Mail,
  LogOut, Plus, History, ArrowLeft, Bell, X, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_gold-ride/artifacts/xlxl6dl3_537513862_122096432576993953_3681223875377855937_n.jpg";

// Notification sound
const playNotificationSound = () => {
  const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  audio.volume = 0.6;
  audio.play().catch(() => {});
};

const statusLabels = {
  pending: "En attente de confirmation",
  assigned: "Chauffeur assigné",
  accepted: "Confirmée",
  approaching: "🚗 Chauffeur en route",
  in_progress: "Course en cours",
  completed: "Terminée",
  cancelled: "Annulée"
};

const statusColors = {
  pending: "bg-[#D4AF37]/20 text-[#D4AF37]",
  assigned: "bg-blue-500/20 text-blue-400",
  accepted: "bg-emerald-500/20 text-emerald-400",
  approaching: "bg-orange-500/30 text-orange-400 animate-pulse",
  in_progress: "bg-[#D4AF37]/30 text-[#D4AF37]",
  completed: "bg-emerald-500/30 text-emerald-400",
  cancelled: "bg-red-500/20 text-red-400"
};

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripDialogOpen, setTripDialogOpen] = useState(false);
  const [expandedTrips, setExpandedTrips] = useState({});

  const getAuthHeader = () => {
    const token = localStorage.getItem("mslk_client_token");
    return { Authorization: `Bearer ${token}` };
  };

  // Check for notifications
  const checkNotifications = async (email) => {
    try {
      const response = await axios.get(`${API}/client/notifications?email=${encodeURIComponent(email)}`);
      if (response.data.length > 0) {
        setNotifications(response.data);
        playNotificationSound();
        
        // Show toast for new notifications
        response.data.forEach(notif => {
          if (notif.type === "driver_approaching") {
            toast.info(`🚗 ${notif.message}`, {
              duration: 10000,
              style: { background: '#D4AF37', color: '#000' }
            });
          } else if (notif.type === "payment_due") {
            toast.warning(`💰 ${notif.message}`, {
              duration: 10000
            });
          }
        });
        
        // Mark as read
        for (const notif of response.data) {
          await axios.post(`${API}/client/notifications/${notif.id}/read`);
        }
        
        // Refresh trips
        fetchTrips(email);
      }
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
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
    checkNotifications(userData.email);
  }, [navigate]);

  // Poll for notifications every 10 seconds
  useEffect(() => {
    if (!user?.email) return;
    
    const interval = setInterval(() => {
      checkNotifications(user.email);
      fetchTrips(user.email);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [user?.email]);

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
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const toggleExpand = (tripId) => {
    setExpandedTrips(prev => ({
      ...prev,
      [tripId]: !prev[tripId]
    }));
  };

  const openTripDetails = (trip) => {
    setSelectedTrip(trip);
    setTripDialogOpen(true);
  };

  // Separate active and completed trips
  const activeTrips = trips.filter(t => !["completed", "cancelled"].includes(t.status));
  const completedTrips = trips.filter(t => ["completed", "cancelled"].includes(t.status));

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-[#121212] border-b border-[#D4AF37]/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-[#A1A1A1] hover:text-white">
              <ArrowLeft size={20} />
              <span className="hidden md:inline">Accueil</span>
            </Link>
            <img src={LOGO_URL} alt="MSLK" className="h-12" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-[#A1A1A1] hover:text-red-400"
            >
              <LogOut size={20} />
              <span className="hidden md:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome & New Booking */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
              Bonjour, <span className="text-[#D4AF37]">{user?.name}</span>
            </h1>
            <p className="text-[#A1A1A1] text-sm mt-1">Gérez vos réservations</p>
          </div>
          <Link to="/">
            <Button className="btn-gold flex items-center gap-2">
              <Plus size={18} />
              Nouvelle réservation
            </Button>
          </Link>
        </div>

        {/* Active Trips */}
        <section className="mb-10">
          <h2 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Car className="text-[#D4AF37]" />
            Courses en cours ({activeTrips.length})
          </h2>
          
          {activeTrips.length === 0 ? (
            <div className="bg-[#121212] border border-[#D4AF37]/20 p-8 text-center">
              <Car className="w-12 h-12 text-[#D4AF37] mx-auto mb-4 opacity-50" />
              <p className="text-[#A1A1A1]">Aucune course en cours</p>
              <Link to="/" className="text-[#D4AF37] text-sm hover:underline mt-2 inline-block">
                Réserver une course
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTrips.map((trip) => (
                <div 
                  key={trip.id} 
                  className="bg-[#121212] border border-[#D4AF37]/20 overflow-hidden cursor-pointer hover:border-[#D4AF37]/40 transition-colors"
                  onClick={() => openTripDetails(trip)}
                >
                  {/* Trip Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-[#A1A1A1] text-xs">N° {trip.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-white font-bold mt-1">
                          {formatDate(trip.pickup_datetime)} à {formatTime(trip.pickup_datetime)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-medium ${statusColors[trip.status]}`}>
                        {statusLabels[trip.status]}
                      </span>
                    </div>
                    
                    {/* Addresses */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        <p className="text-white text-sm">{trip.pickup_address}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Navigation size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-white text-sm">{trip.dropoff_address}</p>
                      </div>
                    </div>

                    {/* Price */}
                    {trip.price > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#D4AF37]/10">
                        <p className="text-[#D4AF37] font-bold text-lg">{trip.price.toFixed(2)} €</p>
                      </div>
                    )}

                    {/* Driver Info - Only show if approaching or in_progress, and hide phone after completed */}
                    {trip.driver_name && ["assigned", "accepted", "approaching", "in_progress"].includes(trip.status) && (
                      <div className="mt-4 pt-4 border-t border-[#D4AF37]/10 bg-emerald-500/5 p-3 rounded">
                        <p className="text-[#D4AF37] text-xs uppercase tracking-wider mb-2">Votre chauffeur</p>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                            <User className="w-6 h-6 text-[#D4AF37]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-bold">{trip.driver_name}</p>
                            {trip.driver_phone && (
                              <a href={`tel:${trip.driver_phone}`} className="text-[#D4AF37] text-sm flex items-center gap-1 hover:underline">
                                <Phone size={12} />
                                {trip.driver_phone}
                              </a>
                            )}
                          </div>
                        </div>
                        {(trip.driver_vehicle_model || trip.driver_vehicle_plate) && (
                          <div className="mt-3 pt-3 border-t border-[#D4AF37]/10">
                            <div className="flex items-center gap-2 text-sm">
                              <Car size={14} className="text-[#D4AF37]" />
                              <span className="text-white">
                                {trip.driver_vehicle_model} {trip.driver_vehicle_color && `(${trip.driver_vehicle_color})`}
                              </span>
                            </div>
                            {trip.driver_vehicle_plate && (
                              <p className="text-[#A1A1A1] text-xs mt-1 ml-5">
                                Immatriculation : <span className="text-white font-mono">{trip.driver_vehicle_plate}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status indicator for approaching */}
                  {trip.status === "approaching" && (
                    <div className="bg-orange-500/20 p-3 text-center">
                      <p className="text-orange-400 font-bold animate-pulse">🚗 Votre chauffeur arrive !</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Completed Trips */}
        <section>
          <h2 className="font-heading text-xl font-bold text-[#A1A1A1] mb-4 flex items-center gap-2">
            <History className="text-[#A1A1A1]" />
            Historique ({completedTrips.length})
          </h2>
          
          {completedTrips.length === 0 ? (
            <div className="bg-[#121212] border border-[#D4AF37]/10 p-6 text-center">
              <p className="text-[#A1A1A1] text-sm">Aucune course passée</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedTrips.slice(0, 10).map((trip) => (
                <div 
                  key={trip.id} 
                  className="bg-[#121212] border border-[#D4AF37]/10 p-4 cursor-pointer hover:border-[#D4AF37]/20"
                  onClick={() => openTripDetails(trip)}
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
          )}
        </section>
      </main>

      {/* Trip Details Dialog */}
      <Dialog open={tripDialogOpen} onOpenChange={setTripDialogOpen}>
        <DialogContent className="bg-[#121212] border-[#D4AF37] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-heading">
              Détails de la course
            </DialogTitle>
          </DialogHeader>
          
          {selectedTrip && (
            <div className="space-y-4">
              {/* Booking Number */}
              <div className="bg-black/50 p-3 rounded border border-[#D4AF37]/20 text-center">
                <p className="text-[#A1A1A1] text-xs">N° DE RÉSERVATION</p>
                <p className="text-[#D4AF37] text-xl font-mono font-bold">{selectedTrip.id.slice(0, 8).toUpperCase()}</p>
              </div>

              {/* Status */}
              <div className="text-center">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[selectedTrip.status]}`}>
                  {statusLabels[selectedTrip.status]}
                </span>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-3 p-3 bg-black/30 rounded">
                <Calendar className="text-[#D4AF37]" size={20} />
                <div>
                  <p className="text-white font-medium">{formatDate(selectedTrip.pickup_datetime)}</p>
                  <p className="text-[#D4AF37]">{formatTime(selectedTrip.pickup_datetime)}</p>
                </div>
              </div>

              {/* Addresses */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-black/30 rounded">
                  <MapPin className="text-emerald-400 mt-0.5" size={20} />
                  <div>
                    <p className="text-[#A1A1A1] text-xs">DÉPART</p>
                    <p className="text-white">{selectedTrip.pickup_address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-black/30 rounded">
                  <Navigation className="text-red-400 mt-0.5" size={20} />
                  <div>
                    <p className="text-[#A1A1A1] text-xs">ARRIVÉE</p>
                    <p className="text-white">{selectedTrip.dropoff_address}</p>
                  </div>
                </div>
              </div>

              {/* Price */}
              {selectedTrip.price > 0 && (
                <div className="bg-[#D4AF37]/10 p-4 rounded text-center">
                  <p className="text-[#A1A1A1] text-xs">MONTANT</p>
                  <p className="text-[#D4AF37] text-3xl font-bold">{selectedTrip.price.toFixed(2)} €</p>
                </div>
              )}

              {/* Driver Info - Hide phone for completed trips */}
              {selectedTrip.driver_name && (
                <div className="bg-emerald-500/10 p-4 rounded">
                  <p className="text-[#D4AF37] text-xs uppercase tracking-wider mb-3">CHAUFFEUR</p>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                      <User className="w-8 h-8 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{selectedTrip.driver_name}</p>
                      {/* Only show phone if not completed */}
                      {selectedTrip.status !== "completed" && selectedTrip.driver_phone && (
                        <a href={`tel:${selectedTrip.driver_phone}`} className="text-[#D4AF37] flex items-center gap-1">
                          <Phone size={14} />
                          {selectedTrip.driver_phone}
                        </a>
                      )}
                    </div>
                  </div>
                  {(selectedTrip.driver_vehicle_model || selectedTrip.driver_vehicle_plate) && selectedTrip.status !== "completed" && (
                    <div className="mt-3 pt-3 border-t border-emerald-500/20">
                      <p className="text-white">
                        <Car size={14} className="inline mr-2 text-[#D4AF37]" />
                        {selectedTrip.driver_vehicle_model} {selectedTrip.driver_vehicle_color && `(${selectedTrip.driver_vehicle_color})`}
                      </p>
                      {selectedTrip.driver_vehicle_plate && (
                        <p className="text-[#A1A1A1] text-sm mt-1">
                          Immatriculation : <span className="text-white font-mono">{selectedTrip.driver_vehicle_plate}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Close button */}
              <Button 
                className="w-full bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30"
                onClick={() => setTripDialogOpen(false)}
              >
                Fermer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto">
        <a 
          href="tel:+33780996363"
          className="flex items-center justify-center gap-2 bg-[#D4AF37] text-black py-3 px-6 rounded font-medium hover:bg-[#B5952F] transition-colors"
        >
          <Phone size={18} />
          Assistance : +33 7 80 99 63 63
        </a>
      </div>
    </div>
  );
}
