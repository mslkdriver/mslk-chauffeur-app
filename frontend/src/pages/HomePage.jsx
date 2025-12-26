import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { MapPin, Calendar, Clock, Users, Briefcase, Car, Phone, Mail, User, Navigation, LogIn, Zap } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LOGO_URL = "https://customer-assets.emergentagent.com/job_gold-ride/artifacts/xlxl6dl3_537513862_122096432576993953_3681223875377855937_n.jpg";
const HERO_BG = "https://images.unsplash.com/photo-1607332623489-e8ddd788072d?w=1920";

export default function HomePage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [clientUser, setClientUser] = useState(null);
  
  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    pickup_address: "",
    dropoff_address: "",
    pickup_date: "",
    pickup_time: "",
    vehicle_type: "berline",
    luggage_count: 0,
    passengers: 1,
    notes: ""
  });

  const [isNow, setIsNow] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if client is logged in
  useEffect(() => {
    const token = localStorage.getItem("mslk_client_token");
    const user = localStorage.getItem("mslk_client_user");
    if (token && user) {
      const userData = JSON.parse(user);
      setIsLoggedIn(true);
      setClientUser(userData);
      setFormData(prev => ({
        ...prev,
        client_name: userData.name,
        client_phone: userData.phone,
        client_email: userData.email
      }));
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.pickup_address) {
      toast.error("Veuillez entrer une adresse de départ");
      return;
    }
    
    if (!formData.dropoff_address) {
      toast.error("Veuillez entrer une adresse d'arrivée");
      return;
    }

    if (!isNow && (!formData.pickup_date || !formData.pickup_time)) {
      toast.error("Veuillez sélectionner la date et l'heure ou cocher 'Maintenant'");
      return;
    }

    setLoading(true);

    try {
      let pickup_datetime;
      if (isNow) {
        pickup_datetime = new Date().toISOString();
      } else {
        pickup_datetime = new Date(`${formData.pickup_date}T${formData.pickup_time}`).toISOString();
      }
      
      const response = await axios.post(`${API}/trips`, {
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        client_email: formData.client_email,
        pickup_address: formData.pickup_address,
        pickup_lat: 0,
        pickup_lng: 0,
        dropoff_address: formData.dropoff_address,
        dropoff_lat: 0,
        dropoff_lng: 0,
        pickup_datetime,
        vehicle_type: formData.vehicle_type,
        luggage_count: parseInt(formData.luggage_count),
        passengers: parseInt(formData.passengers),
        notes: isNow ? `[MAINTENANT] ${formData.notes}` : formData.notes
      });

      toast.success("Réservation enregistrée ! Numéro: " + response.data.id.slice(0, 8).toUpperCase());
      
      // Store client email for tracking
      localStorage.setItem("mslk_client_email", formData.client_email);
      localStorage.setItem("mslk_client_name", formData.client_name);
      
      // Redirect to client space if logged in, otherwise to confirmation
      if (isLoggedIn) {
        navigate("/client/espace");
      } else {
        navigate(`/confirmation/${response.data.id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la réservation");
    } finally {
      setLoading(false);
    }
  };

  // Logout client
  const handleLogout = () => {
    localStorage.removeItem("mslk_client_token");
    localStorage.removeItem("mslk_client_user");
    setIsLoggedIn(false);
    setClientUser(null);
    setFormData(prev => ({
      ...prev,
      client_name: "",
      client_phone: "",
      client_email: ""
    }));
    toast.success("Déconnexion réussie");
  };

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-black pb-footer">
      {/* Hero Section */}
      <div className="relative">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black" />
        
        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header with Logo and Client Login */}
          <div className="flex items-center justify-between mb-8">
            <div className="w-24" />
            <img 
              src={LOGO_URL} 
              alt="MSLK VTC" 
              className="h-24 md:h-32 w-auto"
              data-testid="logo"
            />
            <div className="w-24 flex justify-end">
              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <Link to="/client/espace" className="text-[#D4AF37] text-sm hover:underline">
                    Mon espace
                  </Link>
                  <button onClick={handleLogout} className="text-[#A1A1A1] text-sm hover:text-red-400">
                    Déconnexion
                  </button>
                </div>
              ) : (
                <Link to="/client/connexion" className="flex items-center gap-2 text-[#D4AF37] hover:text-[#B5952F] transition-colors" data-testid="client-login-link">
                  <LogIn size={18} />
                  <span className="text-sm hidden md:inline">Connexion</span>
                </Link>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4" data-testid="main-title">
              Réservez votre <span className="text-[#D4AF37]">VTC</span>
            </h1>
            <p className="text-[#A1A1A1] text-lg md:text-xl max-w-2xl mx-auto">
              L'élégance et le confort à chaque trajet
            </p>
          </div>

          {/* Booking Form */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-[#121212] border border-[#D4AF37]/20 p-6 md:p-8 space-y-6" data-testid="booking-form">
              
              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                    <User size={14} /> Nom complet
                  </Label>
                  <Input
                    data-testid="input-name"
                    className="input-mslk"
                    placeholder="Votre nom"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    required
                    disabled={isLoggedIn}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                    <Phone size={14} /> Téléphone
                  </Label>
                  <Input
                    data-testid="input-phone"
                    className="input-mslk"
                    placeholder="+33 6 XX XX XX XX"
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    required
                    disabled={isLoggedIn}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                  <Mail size={14} /> Email
                </Label>
                <Input
                  data-testid="input-email"
                  className="input-mslk"
                  placeholder="votre@email.com"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  required
                  disabled={isLoggedIn}
                />
              </div>

              {/* Addresses - Free text */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} /> Adresse de départ
                  </Label>
                  <Input
                    data-testid="input-pickup"
                    className="input-mslk"
                    placeholder="Ex: 15 rue de la Gare, Clermont-Ferrand"
                    value={formData.pickup_address}
                    onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                    <Navigation size={14} /> Adresse d'arrivée
                  </Label>
                  <Input
                    data-testid="input-dropoff"
                    className="input-mslk"
                    placeholder="Ex: Aéroport Clermont-Ferrand"
                    value={formData.dropoff_address}
                    onChange={(e) => setFormData({ ...formData, dropoff_address: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Now option */}
              <div 
                className="flex items-center space-x-3 p-4 bg-black border border-[#D4AF37]/30 rounded cursor-pointer"
                onClick={() => setIsNow(!isNow)}
              >
                <div 
                  className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                    isNow 
                      ? 'bg-[#D4AF37] border-[#D4AF37]' 
                      : 'border-[#D4AF37] bg-transparent'
                  }`}
                  data-testid="checkbox-now"
                >
                  {isNow && (
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Zap size={18} className="text-[#D4AF37]" />
                  <span className="font-medium">Maintenant</span>
                  <span className="text-[#A1A1A1] text-sm">(course immédiate)</span>
                </div>
              </div>

              {/* Date/Time - hidden if "Now" is checked */}
              {!isNow && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} /> Date
                    </Label>
                    <Input
                      data-testid="input-date"
                      type="date"
                      className="input-mslk"
                      min={today}
                      value={formData.pickup_date}
                      onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                      required={!isNow}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} /> Heure
                    </Label>
                    <Input
                      data-testid="input-time"
                      type="time"
                      className="input-mslk"
                      value={formData.pickup_time}
                      onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                      required={!isNow}
                    />
                  </div>
                </div>
              )}

              {/* Vehicle & Passengers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                    <Car size={14} /> Véhicule
                  </Label>
                  <Select 
                    value={formData.vehicle_type} 
                    onValueChange={(v) => setFormData({ ...formData, vehicle_type: v })}
                  >
                    <SelectTrigger className="input-mslk" data-testid="select-vehicle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#D4AF37]">
                      <SelectItem value="berline" className="text-white hover:bg-[#D4AF37]/20">Berline</SelectItem>
                      <SelectItem value="van" className="text-white hover:bg-[#D4AF37]/20">Van</SelectItem>
                      <SelectItem value="prestige" className="text-white hover:bg-[#D4AF37]/20">Prestige</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} /> Passagers
                  </Label>
                  <Select 
                    value={String(formData.passengers)} 
                    onValueChange={(v) => setFormData({ ...formData, passengers: parseInt(v) })}
                  >
                    <SelectTrigger className="input-mslk" data-testid="select-passengers">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#D4AF37]">
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <SelectItem key={n} value={String(n)} className="text-white hover:bg-[#D4AF37]/20">{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={14} /> Bagages
                  </Label>
                  <Select 
                    value={String(formData.luggage_count)} 
                    onValueChange={(v) => setFormData({ ...formData, luggage_count: parseInt(v) })}
                  >
                    <SelectTrigger className="input-mslk" data-testid="select-luggage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#D4AF37]">
                      {[0,1,2,3,4,5].map(n => (
                        <SelectItem key={n} value={String(n)} className="text-white hover:bg-[#D4AF37]/20">{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-[#D4AF37] text-xs uppercase tracking-widest">
                  Notes (optionnel)
                </Label>
                <Textarea
                  data-testid="input-notes"
                  className="input-mslk min-h-[80px]"
                  placeholder="Instructions particulières..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Info prix */}
              <div className="bg-black border border-[#D4AF37]/30 p-4 text-center">
                <p className="text-[#D4AF37] text-sm font-medium mb-1">
                  Prix sur confirmation
                </p>
                <p className="text-[#A1A1A1] text-xs">
                  Le tarif vous sera communiqué par nos services après validation de votre demande
                </p>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="btn-gold w-full h-14 text-lg"
                disabled={loading}
                data-testid="submit-booking"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="spinner w-5 h-5" />
                    Réservation en cours...
                  </span>
                ) : (
                  isNow ? "Réserver maintenant" : "Réserver"
                )}
              </Button>

              <p className="text-center text-[#A1A1A1] text-xs">
                Paiement directement au chauffeur
              </p>
            </form>
          </div>

          {/* Quick Links */}
          <div className="flex justify-center gap-6 mt-8">
            <Link to="/client/connexion" className="nav-link text-sm hover:text-[#D4AF37] transition-colors">
              Espace Client
            </Link>
            <Link to="/chauffeur" className="nav-link text-sm hover:text-[#D4AF37] transition-colors">
              Espace Chauffeur
            </Link>
            <Link to="/admin" className="nav-link text-sm hover:text-[#D4AF37] transition-colors">
              Administration
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer-assistance" data-testid="footer-assistance">
        <p className="text-[#A1A1A1] text-sm">
          Assistance MSLK : <a href="tel:+33780996363" className="text-[#D4AF37] font-semibold">+33 7 80 99 63 63</a>
        </p>
      </div>
    </div>
  );
}
