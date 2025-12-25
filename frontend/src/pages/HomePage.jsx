import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { MapPin, Calendar, Clock, Users, Briefcase, Car, Phone, Mail, User, Navigation, LogIn } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LOGO_URL = "https://customer-assets.emergentagent.com/job_gold-ride/artifacts/xlxl6dl3_537513862_122096432576993953_3681223875377855937_n.jpg";
const HERO_BG = "https://images.unsplash.com/photo-1607332623489-e8ddd788072d?w=1920";

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [clientUser, setClientUser] = useState(null);
  
  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    pickup_address: "",
    pickup_lat: 0,
    pickup_lng: 0,
    dropoff_address: "",
    dropoff_lat: 0,
    dropoff_lng: 0,
    pickup_date: "",
    pickup_time: "",
    vehicle_type: "berline",
    luggage_count: 0,
    passengers: 1,
    notes: ""
  });

  // Address search states
  const [pickupQuery, setPickupQuery] = useState("");
  const [dropoffQuery, setDropoffQuery] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [showPickupDropdown, setShowPickupDropdown] = useState(false);
  const [showDropoffDropdown, setShowDropoffDropdown] = useState(false);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [dropoffLoading, setDropoffLoading] = useState(false);
  const [pricePreview, setPricePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);

  // Debounced queries
  const debouncedPickup = useDebounce(pickupQuery, 500);
  const debouncedDropoff = useDebounce(dropoffQuery, 500);

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

  // Search pickup address
  useEffect(() => {
    const searchPickup = async () => {
      if (debouncedPickup.length < 2) {
        setPickupSuggestions([]);
        return;
      }
      setPickupLoading(true);
      try {
        const response = await axios.get(`${API}/geocode/search`, { 
          params: { q: debouncedPickup } 
        });
        setPickupSuggestions(response.data);
        setShowPickupDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Pickup search error:", error);
      } finally {
        setPickupLoading(false);
      }
    };
    searchPickup();
  }, [debouncedPickup]);

  // Search dropoff address
  useEffect(() => {
    const searchDropoff = async () => {
      if (debouncedDropoff.length < 2) {
        setDropoffSuggestions([]);
        return;
      }
      setDropoffLoading(true);
      try {
        const response = await axios.get(`${API}/geocode/search`, { 
          params: { q: debouncedDropoff } 
        });
        setDropoffSuggestions(response.data);
        setShowDropoffDropdown(response.data.length > 0);
      } catch (error) {
        console.error("Dropoff search error:", error);
      } finally {
        setDropoffLoading(false);
      }
    };
    searchDropoff();
  }, [debouncedDropoff]);

  // Select pickup address
  const selectPickupAddress = (address) => {
    setFormData(prev => ({
      ...prev,
      pickup_address: address.display_name,
      pickup_lat: parseFloat(address.lat),
      pickup_lng: parseFloat(address.lon)
    }));
    setPickupQuery(address.display_name);
    setShowPickupDropdown(false);
    setPickupSuggestions([]);
  };

  // Select dropoff address
  const selectDropoffAddress = (address) => {
    setFormData(prev => ({
      ...prev,
      dropoff_address: address.display_name,
      dropoff_lat: parseFloat(address.lat),
      dropoff_lng: parseFloat(address.lon)
    }));
    setDropoffQuery(address.display_name);
    setShowDropoffDropdown(false);
    setDropoffSuggestions([]);
  };

  // Calculate price preview
  useEffect(() => {
    const calculatePrice = async () => {
      if (formData.pickup_lat && formData.dropoff_lat && formData.pickup_lat !== 0 && formData.dropoff_lat !== 0) {
        try {
          const response = await axios.get(`${API}/trips/calculate-price`, {
            params: {
              pickup_lat: formData.pickup_lat,
              pickup_lng: formData.pickup_lng,
              dropoff_lat: formData.dropoff_lat,
              dropoff_lng: formData.dropoff_lng
            }
          });
          setPricePreview(response.data);
        } catch (error) {
          console.error("Price calculation error:", error);
        }
      } else {
        setPricePreview(null);
      }
    };
    calculatePrice();
  }, [formData.pickup_lat, formData.pickup_lng, formData.dropoff_lat, formData.dropoff_lng]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.pickup_lat || formData.pickup_lat === 0) {
      toast.error("Veuillez sélectionner une adresse de départ dans la liste");
      return;
    }
    
    if (!formData.dropoff_lat || formData.dropoff_lat === 0) {
      toast.error("Veuillez sélectionner une adresse d'arrivée dans la liste");
      return;
    }

    if (!formData.pickup_date || !formData.pickup_time) {
      toast.error("Veuillez sélectionner la date et l'heure");
      return;
    }

    setLoading(true);

    try {
      const pickup_datetime = new Date(`${formData.pickup_date}T${formData.pickup_time}`).toISOString();
      
      const response = await axios.post(`${API}/trips`, {
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        client_email: formData.client_email,
        pickup_address: formData.pickup_address,
        pickup_lat: formData.pickup_lat,
        pickup_lng: formData.pickup_lng,
        dropoff_address: formData.dropoff_address,
        dropoff_lat: formData.dropoff_lat,
        dropoff_lng: formData.dropoff_lng,
        pickup_datetime,
        vehicle_type: formData.vehicle_type,
        luggage_count: parseInt(formData.luggage_count),
        passengers: parseInt(formData.passengers),
        notes: formData.notes
      });

      toast.success("Réservation enregistrée !");
      navigate(`/confirmation/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la réservation");
    } finally {
      setLoading(false);
    }
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickupRef.current && !pickupRef.current.contains(e.target)) {
        setShowPickupDropdown(false);
      }
      if (dropoffRef.current && !dropoffRef.current.contains(e.target)) {
        setShowDropoffDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

              {/* Addresses */}
              <div className="space-y-4">
                {/* Pickup Address */}
                <div className="space-y-2 relative" ref={pickupRef}>
                  <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} /> Adresse de départ
                  </Label>
                  <div className="relative">
                    <Input
                      data-testid="input-pickup"
                      className="input-mslk"
                      placeholder="Tapez une adresse (ex: Place de Jaude, Clermont)"
                      value={pickupQuery}
                      onChange={(e) => {
                        setPickupQuery(e.target.value);
                        setFormData(prev => ({ ...prev, pickup_address: e.target.value, pickup_lat: 0, pickup_lng: 0 }));
                      }}
                      onFocus={() => pickupSuggestions.length > 0 && setShowPickupDropdown(true)}
                      required
                    />
                    {pickupLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {showPickupDropdown && pickupSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-[#1a1a1a] border border-[#D4AF37] max-h-[200px] overflow-y-auto z-50" data-testid="pickup-suggestions">
                      {pickupSuggestions.map((s, i) => (
                        <div
                          key={i}
                          className="px-4 py-3 cursor-pointer border-b border-[#D4AF37]/10 hover:bg-[#D4AF37]/10 transition-colors"
                          onClick={() => selectPickupAddress(s)}
                        >
                          <p className="text-white text-sm">{s.display_name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {formData.pickup_lat !== 0 && (
                    <p className="text-emerald-400 text-xs mt-1">✓ Adresse sélectionnée</p>
                  )}
                </div>

                {/* Dropoff Address */}
                <div className="space-y-2 relative" ref={dropoffRef}>
                  <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                    <Navigation size={14} /> Adresse d'arrivée
                  </Label>
                  <div className="relative">
                    <Input
                      data-testid="input-dropoff"
                      className="input-mslk"
                      placeholder="Tapez une adresse (ex: Gare SNCF Clermont)"
                      value={dropoffQuery}
                      onChange={(e) => {
                        setDropoffQuery(e.target.value);
                        setFormData(prev => ({ ...prev, dropoff_address: e.target.value, dropoff_lat: 0, dropoff_lng: 0 }));
                      }}
                      onFocus={() => dropoffSuggestions.length > 0 && setShowDropoffDropdown(true)}
                      required
                    />
                    {dropoffLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {showDropoffDropdown && dropoffSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-[#1a1a1a] border border-[#D4AF37] max-h-[200px] overflow-y-auto z-50" data-testid="dropoff-suggestions">
                      {dropoffSuggestions.map((s, i) => (
                        <div
                          key={i}
                          className="px-4 py-3 cursor-pointer border-b border-[#D4AF37]/10 hover:bg-[#D4AF37]/10 transition-colors"
                          onClick={() => selectDropoffAddress(s)}
                        >
                          <p className="text-white text-sm">{s.display_name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {formData.dropoff_lat !== 0 && (
                    <p className="text-emerald-400 text-xs mt-1">✓ Adresse sélectionnée</p>
                  )}
                </div>
              </div>

              {/* Date/Time */}
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
                    required
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
                    required
                  />
                </div>
              </div>

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
                  "Réserver maintenant"
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
