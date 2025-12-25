import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Search, MapPin, Navigation, Calendar, Clock, Car, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_gold-ride/artifacts/xlxl6dl3_537513862_122096432576993953_3681223875377855937_n.jpg";

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

export default function ClientHistory() {
  const [email, setEmail] = useState("");
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchTrips = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Veuillez entrer votre email");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API}/trips/client/${encodeURIComponent(email)}`);
      setTrips(response.data);
      setSearched(true);
      if (response.data.length === 0) {
        toast.info("Aucune course trouvée pour cet email");
      }
    } catch (error) {
      toast.error("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-black pb-footer">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-[#A1A1A1] hover:text-[#D4AF37] transition-colors">
            <ArrowLeft size={20} />
            Retour
          </Link>
          <img src={LOGO_URL} alt="MSLK VTC" className="h-12 w-auto" />
          <div className="w-20" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2" data-testid="history-title">
            Mes <span className="text-[#D4AF37]">Courses</span>
          </h1>
          <p className="text-[#A1A1A1]">Consultez l'historique de vos réservations</p>
        </div>

        {/* Search Form */}
        <div className="max-w-md mx-auto mb-10">
          <form onSubmit={searchTrips} className="flex gap-3">
            <Input
              type="email"
              className="input-mslk flex-1"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-search-email"
            />
            <Button type="submit" className="btn-gold px-6" disabled={loading} data-testid="btn-search">
              {loading ? <div className="spinner w-5 h-5" /> : <Search size={20} />}
            </Button>
          </form>
        </div>

        {/* Results */}
        {searched && (
          <div className="max-w-3xl mx-auto">
            {trips.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-[#121212] flex items-center justify-center mx-auto mb-4">
                  <Car className="w-10 h-10 text-[#D4AF37]" />
                </div>
                <p className="text-[#A1A1A1]">Aucune course trouvée</p>
                <Link to="/">
                  <Button className="btn-gold mt-4">Réserver une course</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {trips.map((trip, index) => (
                  <div 
                    key={trip.id} 
                    className="trip-card animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    data-testid={`trip-card-${trip.id}`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`status-badge ${statusColors[trip.status]}`}>
                          {statusLabels[trip.status]}
                        </span>
                        <span className="text-[#A1A1A1] text-xs">
                          #{trip.id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[#D4AF37] font-heading text-xl font-bold">
                        {trip.price.toFixed(2)} €
                      </p>
                    </div>

                    {/* Addresses */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[#A1A1A1] text-xs uppercase tracking-widest">Départ</p>
                          <p className="text-white text-sm">{trip.pickup_address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Navigation className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[#A1A1A1] text-xs uppercase tracking-widest">Arrivée</p>
                          <p className="text-white text-sm">{trip.dropoff_address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#A1A1A1] pt-4 border-t border-[#D4AF37]/10">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-[#D4AF37]" />
                        {formatDate(trip.pickup_datetime)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-[#D4AF37]" />
                        {formatTime(trip.pickup_datetime)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Car size={14} className="text-[#D4AF37]" />
                        {trip.vehicle_type}
                      </div>
                      <div className="text-[#D4AF37]">
                        {trip.distance_km.toFixed(1)} km
                      </div>
                    </div>

                    {/* Driver */}
                    {trip.driver_name && (
                      <div className="mt-3 pt-3 border-t border-[#D4AF37]/10">
                        <p className="text-sm">
                          <span className="text-[#A1A1A1]">Chauffeur : </span>
                          <span className="text-white">{trip.driver_name}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="footer-assistance">
        <p className="text-[#A1A1A1] text-sm">
          Assistance MSLK : <a href="tel:+33780996363" className="text-[#D4AF37] font-semibold">+33 7 80 99 63 63</a>
        </p>
      </div>
    </div>
  );
}
