import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_gold-ride/artifacts/xlxl6dl3_537513862_122096432576993953_3681223875377855937_n.jpg";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      
      if (response.data.user.role !== "admin") {
        toast.error("Accès réservé aux administrateurs");
        return;
      }
      
      localStorage.setItem("mslk_token", response.data.token);
      localStorage.setItem("mslk_user", JSON.stringify(response.data.user));
      navigate("/admin/dashboard");
      toast.success("Connexion réussie !");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Identifiants incorrects");
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
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-[#D4AF37]" />
              </div>
            </div>
            <h1 className="font-heading text-3xl font-bold text-white mb-2" data-testid="admin-login-title">
              Administration <span className="text-[#D4AF37]">MSLK</span>
            </h1>
            <p className="text-[#A1A1A1]">Espace réservé aux administrateurs</p>
          </div>

          {/* Login Form */}
          <div className="bg-[#121212] border border-[#D4AF37]/20 p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#D4AF37] text-xs uppercase tracking-widest flex items-center gap-2">
                  <Mail size={14} /> Email
                </Label>
                <Input
                  type="email"
                  className="input-mslk"
                  placeholder="admin@mslk-vtc.fr"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  data-testid="admin-email"
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
                    data-testid="admin-password"
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
                data-testid="btn-admin-login"
              >
                {loading ? <div className="spinner w-5 h-5" /> : "Se connecter"}
              </Button>
            </form>
          </div>

          {/* Help */}
        </div>
      </div>
    </div>
  );
}
