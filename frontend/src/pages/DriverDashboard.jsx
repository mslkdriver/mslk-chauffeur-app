import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { 
  MapPin, Navigation, Calendar, Clock, Car, Users, Briefcase, Phone, 
  LogOut, Bell, Check, X, Play, Flag, TrendingUp, DollarSign, Route,
  ExternalLink, RefreshCw, Mail, MailX, User, AlertCircle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_gold-ride/artifacts/xlxl6dl3_537513862_122096432576993953_3681223875377855937_n.jpg";

// Money notification sound (cash register)
const playNotificationSound = () => {
  const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/888/888-preview.mp3");
  audio.volume = 0.8;
  audio.play().catch(() => {});
};

const statusLabels = {
  pending: "Disponible",
  assigned: "Assignée",
  accepted: "Acceptée",
  approaching: "En approche",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée"
};

const statusColors = {
  pending: "bg-[#D4AF37]/20 text-[#D4AF37]",
  assigned: "bg-blue-500/20 text-blue-400",
  accepted: "bg-emerald-500/20 text-emerald-400",
  approaching: "bg-orange-500/20 text-orange-400",
  in_progress: "bg-purple-500/20 text-purple-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400"
};

const driverStatusLabels = {
  available: "Disponible",
  busy: "Occupé",
  en_route: "En route",
  offline: "Hors ligne"
};

const driverStatusColors = {
  available: "bg-emerald-500",
  busy: "bg-red-500",
  en_route: "bg-orange-500",
  offline: "bg-gray-500"
};

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripDialogOpen, setTripDialogOpen] = useState(false);
  const lastNotificationCount = useRef(0);

  const getAuthHeader = () => {
    const token = localStorage.getItem("mslk_token");
    return { Authorization: `Bearer ${token}` };
  };

  // Check auth and approval
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
    fetchData();
  }, [navigate]);

  // Poll for updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
      checkNotifications();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [tripsRes, statsRes, userRes] = await Promise.all([
        axios.get(`${API}/driver/trips`, { headers: getAuthHeader() }),
        axios.get(`${API}/driver/stats`, { headers: getAuthHeader() }),
        axios.get(`${API}/auth/me`, { headers: getAuthHeader() })
      ]);
      
      // Check for new trips
      const newTripsCount = tripsRes.data.filter(t => t.status === "pending").length;
      if (newTripsCount > lastNotificationCount.current && lastNotificationCount.current !== 0) {
        playNotificationSound();
        toast.success("🚗 Nouvelle course disponible !", {
          duration: 5000,
          style: { background: '#D4AF37', color: '#000' }
        });
      }
      lastNotificationCount.current = newTripsCount;
      
      setTrips(tripsRes.data);
      setStats(statsRes.data);
      setUser(userRes.data);
      localStorage.setItem("mslk_user", JSON.stringify(userRes.data));
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const checkNotifications = async () => {
    try {
      const response = await axios.get(`${API}/driver/notifications`, { headers: getAuthHeader() });
      if (response.data.length > 0) {
        playNotificationSound();
        response.data.forEach(notif => {
          if (notif.type === "collect_payment") {
            toast.success(`💰 ${notif.message}`, {
              duration: 10000,
              style: { background: '#10B981', color: '#fff' }
            });
          } else {
            toast.info(notif.message, { duration: 5000 });
          }
        });
        
        // Mark as read
        for (const notif of response.data) {
          await axios.post(`${API}/driver/notifications/${notif.id}/read`, {}, { headers: getAuthHeader() });
        }
      }
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("mslk_token");
    localStorage.removeItem("mslk_user");
    navigate("/chauffeur");
  };

  const handleAcceptTrip = async (tripId) => {
    try {
      await axios.post(`${API}/driver/trips/${tripId}/accept`, {}, { headers: getAuthHeader() });
      toast.success("Course acceptée !");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  const handleApproach = async (tripId) => {
    try {
      await axios.post(`${API}/driver/trips/${tripId}/approach`, {}, { headers: getAuthHeader() });
      toast.success("Client notifié - Vous êtes en approche !");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  const handleStartTrip = async (tripId) => {
    try {
      await axios.post(`${API}/driver/trips/${tripId}/start`, {}, { headers: getAuthHeader() });
      toast.success("Course démarrée !");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  const handleCompleteTrip = async (tripId) => {
    try {
      await axios.post(`${API}/driver/trips/${tripId}/complete`, {}, { headers: getAuthHeader() });
      toast.success("Course terminée ! Encaissez le client.");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  const handleToggleEmailNotifications = async () => {
    try {
      await axios.put(`${API}/driver/email-notifications`, 
        { email_notifications: !user?.email_notifications },
        { headers: getAuthHeader() }
      );
      fetchData();
    } catch (error) {
      toast.error("Erreur");
    }
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

  const openTripDetails = (trip) => {
    setSelectedTrip(trip);
    setTripDialogOpen(true);
  };

  // Separate trips by status
  const pendingTrips = trips.filter(t => t.status === "pending");
  const myTrips = trips.filter(t => ["assigned", "accepted", "approaching", "in_progress"].includes(t.status) && t.driver_id === user?.id);
  const completedTrips = trips.filter(t => t.status === "completed" && t.driver_id === user?.id).slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <header className="bg-[#121212] border-b border-[#D4AF37]/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="MSLK" className="h-10" />
              <div>
                <p className="text-white font-bold text-sm">{user?.name}</p>
                <span className={`inline-block w-2 h-2 rounded-full mr-1 ${driverStatusColors[user?.status || 'offline']}`}></span>
                <span className="text-xs text-[#A1A1A1]">{driverStatusLabels[user?.status || 'offline']}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleToggleEmailNotifications}
                className={`p-2 rounded ${user?.email_notifications ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-500/20 text-gray-400'}`}
                title={user?.email_notifications ? 'Notifications email ON' : 'Notifications email OFF'}
              >
                {user?.email_notifications ? <Mail size={18} /> : <MailX size={18} />}
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-[#A1A1A1] hover:text-red-400"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#121212] border border-[#D4AF37]/20 p-3 text-center">
            <DollarSign className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
            <p className="text-[#D4AF37] text-xl font-bold">{stats?.daily_revenue?.toFixed(0) || 0}€</p>
            <p className="text-[#A1A1A1] text-xs">Aujourd'hui</p>
          </div>
          <div className="bg-[#121212] border border-red-500/20 p-3 text-center">
            <DollarSign className="w-6 h-6 text-red-400 mx-auto mb-1" />
            <p className="text-red-400 text-xl font-bold">{(user?.total_commission || 0).toFixed(0)}€</p>
            <p className="text-[#A1A1A1] text-xs">Commission due</p>
          </div>
          <div className="bg-[#121212] border border-[#D4AF37]/20 p-3 text-center">
            <TrendingUp className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
            <p className="text-white text-xl font-bold">{(user?.total_revenue || 0).toFixed(0)}€</p>
            <p className="text-[#A1A1A1] text-xs">CA Total</p>
          </div>
          <div className="bg-[#121212] border border-[#D4AF37]/20 p-3 text-center">
            <Route className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
            <p className="text-white text-xl font-bold">{user?.total_trips || 0}</p>
            <p className="text-[#A1A1A1] text-xs">Courses</p>
          </div>
        </div>

        {/* My Active Trips - Transport Voucher Style */}
        {myTrips.length > 0 && (
          <section className="mb-6">
            <h2 className="text-[#D4AF37] text-lg font-bold mb-3 flex items-center gap-2">
              <Car size={20} />
              Mes courses ({myTrips.length})
            </h2>
            
            <div className="space-y-4">
              {myTrips.map((trip) => (
                <div key={trip.id} className="bg-[#121212] border-2 border-[#D4AF37] overflow-hidden">
                  {/* Voucher Header */}
                  <div className="bg-[#D4AF37] text-black p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold">BON DE TRANSPORT</p>
                      <p className="font-mono font-bold">N° {trip.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{trip.price.toFixed(2)} €</p>
                      <p className="text-xs font-bold">À ENCAISSER</p>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className={`py-2 px-3 text-center text-sm font-bold ${
                    trip.status === "approaching" ? "bg-orange-500 text-white animate-pulse" :
                    trip.status === "in_progress" ? "bg-purple-500 text-white" :
                    "bg-blue-500 text-white"
                  }`}>
                    {statusLabels[trip.status].toUpperCase()}
                  </div>

                  {/* Client Info */}
                  <div className="p-4 border-b border-[#D4AF37]/20">
                    <p className="text-[#A1A1A1] text-xs uppercase mb-2">Client</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-[#D4AF37]" />
                        </div>
                        <div>
                          <p className="text-white font-bold">{trip.client_name}</p>
                          <a href={`tel:${trip.client_phone}`} className="text-[#D4AF37] flex items-center gap-1">
                            <Phone size={14} />
                            {trip.client_phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3 text-white">
                      <Calendar size={18} className="text-[#D4AF37]" />
                      <span className="font-bold">{formatDate(trip.pickup_datetime)}</span>
                      <Clock size={18} className="text-[#D4AF37] ml-2" />
                      <span className="font-bold">{formatTime(trip.pickup_datetime)}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-3 p-2 bg-emerald-500/10 rounded">
                        <MapPin size={18} className="text-emerald-400 mt-0.5" />
                        <div>
                          <p className="text-[#A1A1A1] text-xs">DÉPART</p>
                          <p className="text-white">{trip.pickup_address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-2 bg-red-500/10 rounded">
                        <Navigation size={18} className="text-red-400 mt-0.5" />
                        <div>
                          <p className="text-[#A1A1A1] text-xs">ARRIVÉE</p>
                          <p className="text-white">{trip.dropoff_address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Commission Info */}
                    <div className="text-center text-sm text-[#A1A1A1] pt-2 border-t border-[#D4AF37]/20">
                      Commission ({(trip.commission_rate * 100).toFixed(0)}%) : <span className="text-red-400">{(trip.price * trip.commission_rate).toFixed(2)}€</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 bg-black/50 space-y-2">
                    {trip.status === "assigned" && (
                      <Button 
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 text-lg font-bold"
                        onClick={() => handleAcceptTrip(trip.id)}
                      >
                        <Check className="mr-2" /> ACCEPTER LA COURSE
                      </Button>
                    )}
                    
                    {trip.status === "accepted" && (
                      <Button 
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-lg font-bold"
                        onClick={() => handleApproach(trip.id)}
                      >
                        <Car className="mr-2" /> EN APPROCHE
                      </Button>
                    )}
                    
                    {trip.status === "approaching" && (
                      <Button 
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white h-12 text-lg font-bold"
                        onClick={() => handleStartTrip(trip.id)}
                      >
                        <Play className="mr-2" /> DÉMARRER LA COURSE
                      </Button>
                    )}
                    
                    {trip.status === "in_progress" && (
                      <Button 
                        className="w-full bg-green-500 hover:bg-green-600 text-white h-12 text-lg font-bold"
                        onClick={() => handleCompleteTrip(trip.id)}
                      >
                        <Flag className="mr-2" /> TERMINER & ENCAISSER
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Available Trips */}
        <section className="mb-6">
          <h2 className="text-[#A1A1A1] text-lg font-bold mb-3 flex items-center gap-2">
            <Bell size={20} className="text-[#D4AF37]" />
            Courses disponibles ({pendingTrips.length})
          </h2>
          
          {pendingTrips.length === 0 ? (
            <div className="bg-[#121212] border border-[#D4AF37]/10 p-8 text-center">
              <Bell className="w-12 h-12 text-[#D4AF37] mx-auto mb-4 opacity-30" />
              <p className="text-[#A1A1A1]">Aucune course disponible</p>
              <p className="text-[#A1A1A1] text-sm mt-1">Les nouvelles courses apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTrips.map((trip) => (
                <div 
                  key={trip.id} 
                  className="bg-[#121212] border border-[#D4AF37]/30 p-4 cursor-pointer hover:border-[#D4AF37] transition-colors"
                  onClick={() => openTripDetails(trip)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[#D4AF37] font-bold">{formatDate(trip.pickup_datetime)}</p>
                      <p className="text-white text-lg font-bold">{formatTime(trip.pickup_datetime)}</p>
                    </div>
                    {trip.price > 0 && (
                      <p className="text-[#D4AF37] text-xl font-bold">{trip.price.toFixed(2)}€</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-emerald-400" />
                      <span className="text-white truncate">{trip.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Navigation size={14} className="text-red-400" />
                      <span className="text-white truncate">{trip.dropoff_address}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-[#A1A1A1]">
                    <span><User size={12} className="inline mr-1" />{trip.client_name}</span>
                    <span><Users size={12} className="inline mr-1" />{trip.passengers}</span>
                    <span><Briefcase size={12} className="inline mr-1" />{trip.luggage_count}</span>
                    <span className="text-red-400">Commission: {((trip.commission_rate || 0.15) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Completed */}
        {completedTrips.length > 0 && (
          <section>
            <h2 className="text-[#A1A1A1] text-lg font-bold mb-3">Dernières courses</h2>
            <div className="space-y-2">
              {completedTrips.map((trip) => (
                <div 
                  key={trip.id} 
                  className="bg-[#121212] border border-[#D4AF37]/10 p-3 flex justify-between items-center cursor-pointer hover:border-[#D4AF37]/30 transition-colors"
                  onClick={() => openTripDetails(trip)}
                >
                  <div>
                    <p className="text-white text-sm">{trip.pickup_address.split(",")[0]}</p>
                    <p className="text-[#A1A1A1] text-xs">{formatDate(trip.pickup_datetime)}</p>
                    <p className="text-[#A1A1A1] text-xs">Client: {trip.client_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#D4AF37] font-bold">{trip.price.toFixed(2)}€</p>
                    <p className="text-red-400 text-xs">-{(trip.commission_amount || 0).toFixed(2)}€</p>
                    <p className="text-[#A1A1A1] text-xs">N° {trip.id.slice(0,8).toUpperCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Trip Detail Dialog */}
      <Dialog open={tripDialogOpen} onOpenChange={setTripDialogOpen}>
        <DialogContent className="bg-[#121212] border-[#D4AF37] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Détails de la course</DialogTitle>
          </DialogHeader>
          
          {selectedTrip && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-[#A1A1A1] text-xs">N° RÉSERVATION</p>
                <p className="text-[#D4AF37] text-xl font-mono font-bold">{selectedTrip.id.slice(0, 8).toUpperCase()}</p>
              </div>

              {/* Status */}
              <div className="text-center">
                <span className={`px-4 py-1 rounded text-sm font-medium ${statusColors[selectedTrip.status]}`}>
                  {statusLabels[selectedTrip.status]}
                </span>
              </div>
              
              <div className="bg-black/50 p-3 rounded">
                <p className="text-white font-bold">{formatDate(selectedTrip.pickup_datetime)} à {formatTime(selectedTrip.pickup_datetime)}</p>
              </div>
              
              <div className="space-y-2">
                <div className="p-2 bg-emerald-500/10 rounded">
                  <p className="text-[#A1A1A1] text-xs">DÉPART</p>
                  <p className="text-white">{selectedTrip.pickup_address}</p>
                </div>
                <div className="p-2 bg-red-500/10 rounded">
                  <p className="text-[#A1A1A1] text-xs">ARRIVÉE</p>
                  <p className="text-white">{selectedTrip.dropoff_address}</p>
                </div>
              </div>
              
              {/* Client Info - Hide phone/email for completed trips */}
              <div className="bg-black/50 p-3 rounded">
                <p className="text-[#A1A1A1] text-xs">CLIENT</p>
                <p className="text-white font-bold">{selectedTrip.client_name}</p>
                {/* Only show phone for active trips, not completed */}
                {selectedTrip.status !== "completed" && selectedTrip.status !== "cancelled" && (
                  <a href={`tel:${selectedTrip.client_phone}`} className="text-[#D4AF37] flex items-center gap-1 mt-1">
                    <Phone size={14} />
                    {selectedTrip.client_phone}
                  </a>
                )}
              </div>
              
              {selectedTrip.price > 0 && (
                <div className="bg-[#D4AF37]/10 p-4 rounded text-center">
                  <p className="text-3xl font-bold text-[#D4AF37]">{selectedTrip.price.toFixed(2)} €</p>
                  <p className="text-red-400 text-sm">Commission: {(selectedTrip.price * (selectedTrip.commission_rate || 0.15)).toFixed(2)}€</p>
                </div>
              )}
              
              <Button className="w-full btn-gold" onClick={() => setTripDialogOpen(false)}>
                Fermer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#D4AF37]/20 py-3 px-4">
        <div className="flex justify-around">
          <Link to="/" className="flex flex-col items-center text-[#A1A1A1] hover:text-[#D4AF37]">
            <MapPin size={20} />
            <span className="text-xs mt-1">Accueil</span>
          </Link>
          <button onClick={() => fetchData()} className="flex flex-col items-center text-[#D4AF37]">
            <RefreshCw size={20} />
            <span className="text-xs mt-1">Actualiser</span>
          </button>
          <button onClick={handleLogout} className="flex flex-col items-center text-[#A1A1A1] hover:text-red-400">
            <LogOut size={20} />
            <span className="text-xs mt-1">Déconnexion</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
