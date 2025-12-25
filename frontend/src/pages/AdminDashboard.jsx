import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { 
  MapPin, Navigation, Calendar, Clock, Car, Users, Phone, 
  LogOut, TrendingUp, DollarSign, Route, UserCheck, RefreshCw,
  Check, X, Edit, Download, Ban, AlertCircle, Trash2, Bell
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";

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

const driverStatusLabels = {
  available: "Disponible",
  busy: "Occupé",
  en_route: "En route",
  offline: "Hors ligne"
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Assignment dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [assignDriverId, setAssignDriverId] = useState("");
  const [assignCommission, setAssignCommission] = useState("0.15");

  // Commission dialog
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [commissionTrip, setCommissionTrip] = useState(null);
  const [newCommission, setNewCommission] = useState("");

  // Price dialog
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [priceTrip, setPriceTrip] = useState(null);
  const [newPrice, setNewPrice] = useState("");

  // Driver dialog
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverNotes, setDriverNotes] = useState("");
  const [driverCommission, setDriverCommission] = useState("");

  const getAuthHeader = () => {
    const token = localStorage.getItem("mslk_token");
    return { Authorization: `Bearer ${token}` };
  };

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem("mslk_token");
    const savedUser = localStorage.getItem("mslk_user");
    
    if (!token || !savedUser) {
      navigate("/admin");
      return;
    }
    
    const userData = JSON.parse(savedUser);
    if (userData.role !== "admin") {
      navigate("/admin");
      return;
    }
    
    setUser(userData);
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [tripsRes, driversRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/trips`, { headers: getAuthHeader() }),
        axios.get(`${API}/admin/drivers`, { headers: getAuthHeader() }),
        axios.get(`${API}/admin/stats`, { headers: getAuthHeader() })
      ]);
      
      setTrips(tripsRes.data);
      setDrivers(driversRes.data);
      setStats(statsRes.data);
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Assign trip
  const handleAssignTrip = async () => {
    if (!assignDriverId || !selectedTrip) return;
    
    try {
      await axios.post(
        `${API}/admin/trips/${selectedTrip.id}/assign`,
        { 
          driver_id: assignDriverId,
          commission_rate: parseFloat(assignCommission)
        },
        { headers: getAuthHeader() }
      );
      toast.success("Course assignée !");
      setAssignDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Update trip commission
  const handleUpdateCommission = async () => {
    if (!commissionTrip || !newCommission) return;
    
    try {
      await axios.put(
        `${API}/admin/trips/${commissionTrip.id}/commission`,
        { commission_rate: parseFloat(newCommission) },
        { headers: getAuthHeader() }
      );
      toast.success("Commission mise à jour !");
      setCommissionDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Update trip price
  const handleUpdatePrice = async () => {
    if (!priceTrip || !newPrice) return;
    
    try {
      await axios.put(
        `${API}/admin/trips/${priceTrip.id}/price`,
        { price: parseFloat(newPrice) },
        { headers: getAuthHeader() }
      );
      toast.success("Prix confirmé et client notifié !");
      setPriceDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Delete trip
  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm("Supprimer définitivement cette course ?")) return;
    
    try {
      await axios.delete(`${API}/admin/trips/${tripId}`, { headers: getAuthHeader() });
      toast.success("Course supprimée");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Delete driver
  const handleDeleteDriver = async (driverId, driverName) => {
    if (!window.confirm(`Supprimer définitivement le chauffeur ${driverName} ?`)) return;
    
    try {
      await axios.delete(`${API}/admin/drivers/${driverId}`, { headers: getAuthHeader() });
      toast.success("Chauffeur supprimé");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Ring drivers for a trip
  const handleRingDrivers = async (tripId) => {
    try {
      const response = await axios.post(
        `${API}/admin/trips/${tripId}/ring`,
        {},
        { headers: getAuthHeader() }
      );
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'envoi");
    }
  };

  // Update driver
  const handleUpdateDriver = async () => {
    if (!selectedDriver) return;
    
    try {
      if (driverNotes !== selectedDriver.notes) {
        await axios.put(
          `${API}/admin/drivers/${selectedDriver.id}/notes`,
          { notes: driverNotes },
          { headers: getAuthHeader() }
        );
      }
      
      if (driverCommission && parseFloat(driverCommission) !== selectedDriver.commission_rate) {
        await axios.put(
          `${API}/admin/drivers/${selectedDriver.id}/commission`,
          { commission_rate: parseFloat(driverCommission) },
          { headers: getAuthHeader() }
        );
      }
      
      toast.success("Chauffeur mis à jour !");
      setDriverDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Toggle driver active
  const handleToggleDriver = async (driverId) => {
    try {
      await axios.put(
        `${API}/admin/drivers/${driverId}/toggle-active`,
        {},
        { headers: getAuthHeader() }
      );
      toast.success("Statut mis à jour");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ["ID", "Client", "Téléphone", "Départ", "Arrivée", "Date", "Prix", "Statut", "Chauffeur", "Commission"];
    const rows = trips.map(t => [
      t.id.substring(0, 8),
      t.client_name,
      t.client_phone,
      t.pickup_address,
      t.dropoff_address,
      new Date(t.pickup_datetime).toLocaleString("fr-FR"),
      t.price.toFixed(2),
      statusLabels[t.status],
      t.driver_name || "-",
      t.commission_amount.toFixed(2)
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mslk_courses_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const handleLogout = () => {
    localStorage.removeItem("mslk_token");
    localStorage.removeItem("mslk_user");
    navigate("/admin");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  // Filter trips
  const filteredTrips = statusFilter === "all" 
    ? trips 
    : trips.filter(t => t.status === statusFilter);

  // Available drivers for assignment
  const availableDrivers = drivers.filter(d => d.is_active);

  return (
    <div className="min-h-screen bg-black pb-8">
      {/* Header */}
      <header className="bg-[#121212] border-b border-[#D4AF37]/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={LOGO_URL} alt="MSLK VTC" className="h-10 w-auto" />
              <span className="text-[#D4AF37] text-xs uppercase tracking-widest hidden md:block">Administration</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRefresh}
                className="text-[#A1A1A1] hover:text-[#D4AF37]"
                data-testid="btn-admin-refresh"
              >
                <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="text-[#A1A1A1] hover:text-red-400"
                data-testid="btn-admin-logout"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="stats-card" data-testid="admin-stat-total">
              <Route className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
              <p className="stats-value text-2xl">{stats.total_trips}</p>
              <p className="stats-label">Total courses</p>
            </div>
            <div className="stats-card" data-testid="admin-stat-pending">
              <AlertCircle className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
              <p className="stats-value text-2xl">{stats.pending_trips}</p>
              <p className="stats-label">En attente</p>
            </div>
            <div className="stats-card" data-testid="admin-stat-completed">
              <Check className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="stats-value text-2xl">{stats.completed_trips}</p>
              <p className="stats-label">Terminées</p>
            </div>
            <div className="stats-card" data-testid="admin-stat-revenue">
              <DollarSign className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
              <p className="stats-value text-2xl">{stats.total_revenue.toFixed(0)}€</p>
              <p className="stats-label">CA Total</p>
            </div>
            <div className="stats-card" data-testid="admin-stat-commission">
              <TrendingUp className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
              <p className="stats-value text-2xl">{stats.total_commission.toFixed(0)}€</p>
              <p className="stats-label">Commission MSLK</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="trips" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#121212] mb-6">
            <TabsTrigger 
              value="trips" 
              className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black"
              data-testid="tab-trips"
            >
              Courses ({trips.length})
            </TabsTrigger>
            <TabsTrigger 
              value="drivers" 
              className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black"
              data-testid="tab-drivers"
            >
              Chauffeurs ({drivers.length})
            </TabsTrigger>
          </TabsList>

          {/* Trips Tab */}
          <TabsContent value="trips">
            {/* Filter & Export */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-black border-[#D4AF37]/50" data-testid="filter-status">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#D4AF37]">
                  <SelectItem value="all" className="text-white">Toutes</SelectItem>
                  <SelectItem value="pending" className="text-[#D4AF37]">En attente</SelectItem>
                  <SelectItem value="assigned" className="text-blue-400">Assignées</SelectItem>
                  <SelectItem value="accepted" className="text-emerald-400">Acceptées</SelectItem>
                  <SelectItem value="in_progress" className="text-[#D4AF37]">En cours</SelectItem>
                  <SelectItem value="completed" className="text-emerald-400">Terminées</SelectItem>
                  <SelectItem value="cancelled" className="text-red-400">Annulées</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                className="border-[#D4AF37] text-[#D4AF37]"
                onClick={exportCSV}
                data-testid="btn-export"
              >
                <Download size={16} className="mr-2" /> Export CSV
              </Button>
            </div>

            {/* Trips Table */}
            <div className="overflow-x-auto">
              <table className="table-mslk" data-testid="trips-table">
                <thead>
                  <tr>
                    <th>Date/Heure</th>
                    <th>Client</th>
                    <th>Trajet</th>
                    <th>Prix</th>
                    <th>Statut</th>
                    <th>Chauffeur</th>
                    <th>Commission</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip) => (
                    <tr key={trip.id} data-testid={`trip-row-${trip.id}`}>
                      <td className="whitespace-nowrap">
                        <p className="text-white">{formatDate(trip.pickup_datetime)}</p>
                        <p className="text-[#A1A1A1] text-xs">{formatTime(trip.pickup_datetime)}</p>
                      </td>
                      <td>
                        <p className="text-white">{trip.client_name}</p>
                        <p className="text-[#A1A1A1] text-xs">{trip.client_phone}</p>
                      </td>
                      <td className="max-w-[200px]">
                        <p className="text-white text-xs truncate">{trip.pickup_address.split(",")[0]}</p>
                        <p className="text-[#A1A1A1] text-xs truncate">→ {trip.dropoff_address.split(",")[0]}</p>
                      </td>
                      <td>
                        {trip.price > 0 ? (
                          <>
                            <p className="text-[#D4AF37] font-bold">{trip.price.toFixed(2)}€</p>
                            <p className="text-[#A1A1A1] text-xs">{trip.distance_km.toFixed(1)} km</p>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-emerald-500 text-white hover:bg-emerald-600"
                            onClick={() => {
                              setPriceTrip(trip);
                              // Calculate suggested price
                              const suggestedPrice = (5 + trip.distance_km * 2).toFixed(2);
                              setNewPrice(suggestedPrice);
                              setPriceDialogOpen(true);
                            }}
                            data-testid={`set-price-btn-${trip.id}`}
                          >
                            Définir prix
                          </Button>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${statusColors[trip.status]}`}>
                          {statusLabels[trip.status]}
                        </span>
                      </td>
                      <td>
                        {trip.driver_name ? (
                          <p className="text-white">{trip.driver_name}</p>
                        ) : (
                          <span className="text-[#A1A1A1]">-</span>
                        )}
                      </td>
                      <td>
                        <p className="text-white">{(trip.commission_rate * 100).toFixed(0)}%</p>
                        <p className="text-[#A1A1A1] text-xs">{trip.commission_amount.toFixed(2)}€</p>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {(trip.status === "pending" || trip.status === "assigned") && (
                            <Button
                              size="sm"
                              className="bg-emerald-500 text-white hover:bg-emerald-600"
                              onClick={() => handleRingDrivers(trip.id)}
                              data-testid={`ring-btn-${trip.id}`}
                              title="Sonner les chauffeurs"
                            >
                              <Bell size={14} className="mr-1" /> Sonner
                            </Button>
                          )}
                          {trip.status === "pending" && (
                            <Button
                              size="sm"
                              className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
                              onClick={() => {
                                setSelectedTrip(trip);
                                setAssignDialogOpen(true);
                              }}
                              data-testid={`assign-btn-${trip.id}`}
                            >
                              Assigner
                            </Button>
                          )}
                          {trip.status !== "completed" && trip.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[#D4AF37]"
                              onClick={() => {
                                setCommissionTrip(trip);
                                setNewCommission(String(trip.commission_rate));
                                setCommissionDialogOpen(true);
                              }}
                            >
                              <Edit size={14} />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => handleDeleteTrip(trip.id)}
                            data-testid={`delete-trip-${trip.id}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTrips.length === 0 && (
              <div className="text-center py-12">
                <Car className="w-12 h-12 text-[#D4AF37] mx-auto mb-4 opacity-50" />
                <p className="text-[#A1A1A1]">Aucune course trouvée</p>
              </div>
            )}
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers">
            <div className="overflow-x-auto">
              <table className="table-mslk" data-testid="drivers-table">
                <thead>
                  <tr>
                    <th>Chauffeur</th>
                    <th>Contact</th>
                    <th>Statut</th>
                    <th>Courses</th>
                    <th>CA Total</th>
                    <th>Commission due</th>
                    <th>Taux</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver) => (
                    <tr key={driver.id} className={!driver.is_active ? "opacity-50" : ""} data-testid={`driver-row-${driver.id}`}>
                      <td>
                        <div className="flex items-center gap-2">
                          {!driver.is_active && <Ban size={14} className="text-red-400" />}
                          <p className="text-white">{driver.name}</p>
                        </div>
                      </td>
                      <td>
                        <p className="text-white text-sm">{driver.email}</p>
                        <p className="text-[#A1A1A1] text-xs">{driver.phone}</p>
                      </td>
                      <td>
                        <span className={`${
                          driver.status === "available" ? "text-emerald-400" :
                          driver.status === "busy" ? "text-red-400" :
                          driver.status === "en_route" ? "text-[#D4AF37]" : "text-gray-500"
                        }`}>
                          {driverStatusLabels[driver.status]}
                        </span>
                      </td>
                      <td className="text-white">{driver.total_trips}</td>
                      <td className="text-[#D4AF37] font-bold">{driver.total_revenue.toFixed(0)}€</td>
                      <td className="text-red-400 font-bold">{(driver.total_commission || 0).toFixed(2)}€</td>
                      <td className="text-white">{(driver.commission_rate * 100).toFixed(0)}%</td>
                      <td>
                        <span className={driver.email_notifications ? "text-emerald-400" : "text-gray-500"}>
                          {driver.email_notifications ? "✓" : "✗"}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[#D4AF37]"
                            onClick={() => {
                              setSelectedDriver(driver);
                              setDriverNotes(driver.notes || "");
                              setDriverCommission(String(driver.commission_rate));
                              setDriverDialogOpen(true);
                            }}
                            data-testid={`edit-driver-${driver.id}`}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={driver.is_active ? "text-orange-400" : "text-emerald-400"}
                            onClick={() => handleToggleDriver(driver.id)}
                            data-testid={`toggle-driver-${driver.id}`}
                          >
                            {driver.is_active ? <Ban size={14} /> : <Check size={14} />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => handleDeleteDriver(driver.id, driver.name)}
                            data-testid={`delete-driver-${driver.id}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {drivers.length === 0 && (
              <div className="text-center py-12">
                <UserCheck className="w-12 h-12 text-[#D4AF37] mx-auto mb-4 opacity-50" />
                <p className="text-[#A1A1A1]">Aucun chauffeur inscrit</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign Trip Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="bg-[#121212] border-[#D4AF37]">
          <DialogHeader>
            <DialogTitle className="text-white font-heading">Assigner la course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#D4AF37]">Chauffeur</Label>
              <Select value={assignDriverId} onValueChange={setAssignDriverId}>
                <SelectTrigger className="input-mslk" data-testid="select-driver">
                  <SelectValue placeholder="Choisir un chauffeur" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#D4AF37]">
                  {availableDrivers.map(d => (
                    <SelectItem key={d.id} value={d.id} className="text-white">
                      {d.name} ({driverStatusLabels[d.status]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#D4AF37]">Commission (%)</Label>
              <Select value={assignCommission} onValueChange={setAssignCommission}>
                <SelectTrigger className="input-mslk" data-testid="select-commission">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#D4AF37]">
                  <SelectItem value="0.10" className="text-white">10%</SelectItem>
                  <SelectItem value="0.15" className="text-white">15%</SelectItem>
                  <SelectItem value="0.20" className="text-white">20%</SelectItem>
                  <SelectItem value="0.25" className="text-white">25%</SelectItem>
                  <SelectItem value="0.30" className="text-white">30%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="btn-gold w-full" onClick={handleAssignTrip} data-testid="btn-confirm-assign">
              Assigner
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Commission Dialog */}
      <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
        <DialogContent className="bg-[#121212] border-[#D4AF37]">
          <DialogHeader>
            <DialogTitle className="text-white font-heading">Modifier la commission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#D4AF37]">Commission (%)</Label>
              <Select value={newCommission} onValueChange={setNewCommission}>
                <SelectTrigger className="input-mslk">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#D4AF37]">
                  <SelectItem value="0.10" className="text-white">10%</SelectItem>
                  <SelectItem value="0.15" className="text-white">15%</SelectItem>
                  <SelectItem value="0.20" className="text-white">20%</SelectItem>
                  <SelectItem value="0.25" className="text-white">25%</SelectItem>
                  <SelectItem value="0.30" className="text-white">30%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="btn-gold w-full" onClick={handleUpdateCommission}>
              Mettre à jour
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Price Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent className="bg-[#121212] border-[#D4AF37]">
          <DialogHeader>
            <DialogTitle className="text-white font-heading">Confirmer le prix</DialogTitle>
          </DialogHeader>
          {priceTrip && (
            <div className="space-y-4">
              <div className="bg-black/50 p-3 rounded text-sm">
                <p className="text-[#A1A1A1]">Client: <span className="text-white">{priceTrip.client_name}</span></p>
                <p className="text-[#A1A1A1]">Distance: <span className="text-[#D4AF37]">{priceTrip.distance_km.toFixed(1)} km</span></p>
                <p className="text-[#A1A1A1]">Trajet: <span className="text-white">{priceTrip.pickup_address.split(",")[0]} → {priceTrip.dropoff_address.split(",")[0]}</span></p>
              </div>
              <div className="space-y-2">
                <Label className="text-[#D4AF37]">Prix de la course (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-mslk text-xl font-bold text-center"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  data-testid="input-price"
                />
                <p className="text-[#A1A1A1] text-xs text-center">
                  Prix suggéré (2€/km + 5€): {(5 + priceTrip.distance_km * 2).toFixed(2)}€
                </p>
              </div>
              <Button className="btn-gold w-full" onClick={handleUpdatePrice} data-testid="btn-confirm-price">
                Confirmer et notifier le client
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Driver Dialog */}
      <Dialog open={driverDialogOpen} onOpenChange={setDriverDialogOpen}>
        <DialogContent className="bg-[#121212] border-[#D4AF37]">
          <DialogHeader>
            <DialogTitle className="text-white font-heading">
              Modifier {selectedDriver?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#D4AF37]">Commission par défaut (%)</Label>
              <Select value={driverCommission} onValueChange={setDriverCommission}>
                <SelectTrigger className="input-mslk">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#D4AF37]">
                  <SelectItem value="0.10" className="text-white">10%</SelectItem>
                  <SelectItem value="0.15" className="text-white">15%</SelectItem>
                  <SelectItem value="0.20" className="text-white">20%</SelectItem>
                  <SelectItem value="0.25" className="text-white">25%</SelectItem>
                  <SelectItem value="0.30" className="text-white">30%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#D4AF37]">Notes</Label>
              <Textarea
                className="input-mslk min-h-[100px]"
                placeholder="Notes sur ce chauffeur..."
                value={driverNotes}
                onChange={(e) => setDriverNotes(e.target.value)}
              />
            </div>
            <Button className="btn-gold w-full" onClick={handleUpdateDriver}>
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
