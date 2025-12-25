import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { CheckCircle, MapPin, Navigation, Calendar, Clock, Car, Users, Briefcase, Phone, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_gold-ride/artifacts/xlxl6dl3_537513862_122096432576993953_3681223875377855937_n.jpg";

export default function BookingConfirmation() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, we'll show a generic confirmation
    // In a real app, we'd fetch the trip by ID
    setLoading(false);
  }, [tripId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
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
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/">
            <img src={LOGO_URL} alt="MSLK VTC" className="h-20 w-auto" />
          </Link>
        </div>

        {/* Confirmation Card */}
        <div className="max-w-xl mx-auto">
          <div className="bg-[#121212] border border-[#D4AF37]/20 p-8 text-center animate-fade-in">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-[#D4AF37]" />
              </div>
            </div>

            {/* Title */}
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2" data-testid="confirmation-title">
              Réservation <span className="text-[#D4AF37]">Confirmée</span>
            </h1>
            <p className="text-[#A1A1A1] mb-6">
              Votre demande de course a été enregistrée avec succès.
            </p>

            {/* Reference */}
            <div className="bg-black border border-[#D4AF37] p-4 mb-6">
              <p className="text-[#A1A1A1] text-xs uppercase tracking-widest mb-1">
                Numéro de réservation
              </p>
              <p className="text-[#D4AF37] text-xl font-mono font-bold" data-testid="trip-reference">
                {tripId?.substring(0, 8).toUpperCase()}
              </p>
            </div>

            {/* Info */}
            <div className="space-y-4 text-left mb-8">
              <div className="flex items-start gap-3 p-3 bg-black/50 border border-[#D4AF37]/10">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#D4AF37] text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="text-white font-medium">Demande enregistrée</p>
                  <p className="text-[#A1A1A1] text-sm">Votre demande de réservation a été transmise à nos services.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-black/50 border border-[#D4AF37]/10">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#D4AF37] text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="text-white font-medium">Confirmation du tarif</p>
                  <p className="text-[#A1A1A1] text-sm">Nos services vous contacteront pour confirmer le prix de la course.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-black/50 border border-[#D4AF37]/10">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#D4AF37] text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="text-white font-medium">Paiement au chauffeur</p>
                  <p className="text-[#A1A1A1] text-sm">Le paiement s'effectue directement auprès du chauffeur.</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link to="/">
                <Button className="btn-gold w-full h-12" data-testid="btn-new-booking">
                  Nouvelle réservation
                </Button>
              </Link>
              <Link to="/historique">
                <Button variant="outline" className="w-full h-12 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black">
                  Voir mes courses
                </Button>
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-6 text-center">
            <p className="text-[#A1A1A1] text-sm mb-2">Une question ?</p>
            <a 
              href="tel:+33780996363" 
              className="inline-flex items-center gap-2 text-[#D4AF37] font-semibold"
              data-testid="contact-phone"
            >
              <Phone size={18} />
              +33 7 80 99 63 63
            </a>
          </div>
        </div>
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
