import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import "@/App.css";

// Pages
import HomePage from "./pages/HomePage";
import BookingConfirmation from "./pages/BookingConfirmation";
import ClientHistory from "./pages/ClientHistory";
import ClientLogin from "./pages/ClientLogin";
import ClientDashboard from "./pages/ClientDashboard";
import DriverLogin from "./pages/DriverLogin";
import DriverDashboard from "./pages/DriverDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <div className="App min-h-screen bg-black">
      <BrowserRouter>
        <Routes>
          {/* Client Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/confirmation/:tripId" element={<BookingConfirmation />} />
          <Route path="/historique" element={<ClientHistory />} />
          <Route path="/client/connexion" element={<ClientLogin />} />
          <Route path="/client/espace" element={<ClientDashboard />} />
          
          {/* Driver Routes */}
          <Route path="/chauffeur" element={<DriverLogin />} />
          <Route path="/chauffeur/dashboard" element={<DriverDashboard />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#121212',
            border: '1px solid #D4AF37',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

export default App;
