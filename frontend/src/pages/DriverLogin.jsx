import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft, Car } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_gold-ride/artifacts/xlxl6dl3_537513862_122096432576993953_3681223875377855937_n.jpg";

export default function DriverLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  // Register form
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    vehicle_model: "",
    vehicle_color: "",
    vehicle_plate: ""
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      localStorage.setItem("mslk_token", response.data.token);
      localStorage.setItem("mslk_user", JSON.stringify(response.data.user));
      
      if (response.data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/chauffeur/dashboard");
      }
      toast.success("Connexion réussie !");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (registerData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (!registerData.vehicle_model || !registerData.vehicle_plate) {
      toast.error("Veuillez renseigner le modèle et l'immatriculation du véhicule");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, {
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password,
        role: "driver",
        vehicle_model: registerData.vehicle_model,
        vehicle_color: registerData.vehicle_color,
        vehicle_plate: registerData.vehicle_plate
      });
      
      localStorage.setItem("mslk_token", response.data.token);
      localStorage.setItem("mslk_user", JSON.stringify(response.data.user));
      navigate("/chauffeur/dashboard");
      toast.success("Inscription réussie !");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Link to="/" className="flex items-center gap-2 text-[#A1A1A1] hover:text-[#D4AF37] transition-colors">
          <ArrowLeft size={20} />
          Retour à l'accueil
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={LOGO_URL} alt="MSLK VTC" className="h-20 w-auto" />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold text-white mb-2" data-testid="driver-login-title">
              Espace <span className="text-[#D4AF37]">Chauffeur</span>
            </h1>
            <p className="text-[#A1A1A1]">Connectez-vous pour accéder à vos courses</p>
          </div>

          {/* Tabs */}
          <div className="bg-[#121212] border border-[#D4AF37]/20 p-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black mb-6">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black"
                  data-testid="tab-login"
                >
                  Connexion
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black"
                  data-testid="tab-register"
                >
                  Inscription
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                      <Mail size={14} /> Email
                    </Label>
                    <Input
                      type="email"
                      className="input-mslk"
                      placeholder="votre@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      data-testid="login-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                      <Lock size={14} /> Mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="input-mslk pr-12"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        data-testid="login-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1A1] hover:text-[#D4AF37]"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="btn-gold w-full h-12" 
                    disabled={loading}
                    data-testid="btn-login"
                  >
                    {loading ? <div className="spinner w-5 h-5" /> : "Se connecter"}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                      <User size={14} /> Nom complet
                    </Label>
                    <Input
                      type="text"
                      className="input-mslk"
                      placeholder="Prénom Nom"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                      data-testid="register-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                      <Mail size={14} /> Email
                    </Label>
                    <Input
                      type="email"
                      className="input-mslk"
                      placeholder="votre@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      data-testid="register-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                      <Phone size={14} /> Téléphone
                    </Label>
                    <Input
                      type="tel"
                      className="input-mslk"
                      placeholder="+33 6 XX XX XX XX"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      required
                      data-testid="register-phone"
                    />
                  </div>

                  {/* Vehicle Info Section */}
                  <div className="pt-4 border-t border-[#D4AF37]/20">
                    <p className="text-[#D4AF37] text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Car size={14} /> Informations véhicule
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-[#A1A1A1] text-xs">Modèle *</Label>
                        <Input
                          type="text"
                          className="input-mslk"
                          placeholder="Ex: Mercedes Classe E"
                          value={registerData.vehicle_model}
                          onChange={(e) => setRegisterData({ ...registerData, vehicle_model: e.target.value })}
                          required
                          data-testid="register-vehicle-model"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#A1A1A1] text-xs">Couleur</Label>
                        <Input
                          type="text"
                          className="input-mslk"
                          placeholder="Ex: Noir"
                          value={registerData.vehicle_color}
                          onChange={(e) => setRegisterData({ ...registerData, vehicle_color: e.target.value })}
                          data-testid="register-vehicle-color"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mt-3">
                      <Label className="text-[#A1A1A1] text-xs">Immatriculation *</Label>
                      <Input
                        type="text"
                        className="input-mslk uppercase"
                        placeholder="Ex: AB-123-CD"
                        value={registerData.vehicle_plate}
                        onChange={(e) => setRegisterData({ ...registerData, vehicle_plate: e.target.value.toUpperCase() })}
                        required
                        data-testid="register-vehicle-plate"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                      <Lock size={14} /> Mot de passe
                    </Label>
                    <Input
                      type="password"
                      className="input-mslk"
                      placeholder="Min. 6 caractères"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      data-testid="register-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#D4AF37] text-xs uppercase tracking-widest">
                      Confirmer le mot de passe
                    </Label>
                    <Input
                      type="password"
                      className="input-mslk"
                      placeholder="Confirmer"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                      data-testid="register-confirm-password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="btn-gold w-full h-12" 
                    disabled={loading}
                    data-testid="btn-register"
                  >
                    {loading ? <div className="spinner w-5 h-5" /> : "S'inscrire"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          {/* Help */}
          <div className="text-center mt-6">
            <p className="text-[#A1A1A1] text-sm">
              Besoin d'aide ? Contactez <a href="tel:+33780996363" className="text-[#D4AF37]">+33 7 80 99 63 63</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
