import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import Dashboard from "@/pages/Dashboard";
import PublisherDashboard from "@/pages/PublisherDashboard";
import BulkUploadPage from "@/pages/BulkUploadPage";
import AdminDashboard from "@/pages/AdminDashboard";
import CreateCampaignPage from "@/pages/CreateCampaignPage";
import RTBSimulatorPage from "@/pages/RTBSimulatorPage";
import InventoryPage from "@/pages/InventoryPage";
import InventoryDetailPage from "@/pages/InventoryDetailPage";
import CampaignAnalyticsPage from "@/pages/CampaignAnalyticsPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import UpdatePasswordPage from "@/pages/UpdatePasswordPage";
import MyInventoryPage from "@/pages/MyInventoryPage";
import PublisherInventoryDetailPage from "@/pages/PublisherInventoryDetailPage";
import BuyerAccessRulesPage from "@/pages/BuyerAccessRulesPage";
import { Toaster } from 'sonner';

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campaigns/new" element={<CreateCampaignPage />} />
        <Route path="/campaigns/analytics" element={<CampaignAnalyticsPage />} />
        <Route path="/publisher-dashboard" element={<PublisherDashboard />} />
        <Route path="/publisher/my-inventory" element={<MyInventoryPage />} />
        <Route path="/publisher/inventory/:id" element={<PublisherInventoryDetailPage />} />
        <Route path="/publisher/inventory/:id/buyer-rules" element={<BuyerAccessRulesPage />} />
        <Route path="/publisher/bulk-upload" element={<BulkUploadPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/rtb-simulator" element={<RTBSimulatorPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/:id" element={<InventoryDetailPage />} />
        {/* Redirect unknown routes to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
