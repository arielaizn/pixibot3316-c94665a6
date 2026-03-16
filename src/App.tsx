import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { DirectionProvider } from "@/contexts/DirectionContext";
import WhatsAppGate from "@/components/WhatsAppGate";
import Index from "./pages/Index.tsx";
import SignupPage from "./pages/SignupPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import WelcomePage from "./pages/WelcomePage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import ProjectsPage from "./pages/ProjectsPage.tsx";
import PricingPage from "./pages/PricingPage.tsx";
import PaymentCallbackPage from "./pages/PaymentCallbackPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import SharedPage from "./pages/SharedPage.tsx";
import PublicVideoPage from "./pages/PublicVideoPage.tsx";
// Admin pages
import AdminLoginPage from "./pages/admin/AdminLoginPage.tsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.tsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.tsx";
import AdminSubscriptionsPage from "./pages/admin/AdminSubscriptionsPage.tsx";
import AdminCreditsPage from "./pages/admin/AdminCreditsPage.tsx";
import AdminVideosPage from "./pages/admin/AdminVideosPage.tsx";
import AdminProjectsPage from "./pages/admin/AdminProjectsPage.tsx";
import AdminWhatsAppPage from "./pages/admin/AdminWhatsAppPage.tsx";
import AdminReferralsPage from "./pages/admin/AdminReferralsPage.tsx";
import NotAdminPage from "./pages/admin/NotAdminPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="pixi_theme">
    <DirectionProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <WhatsAppGate>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/welcome" element={<WelcomePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:projectId" element={<ProjectsPage />} />
                <Route path="/projects/:projectId/video/:videoId" element={<ProjectsPage />} />
                <Route path="/payment/callback" element={<PaymentCallbackPage />} />
                {/* Admin */}
                <Route path="/admin" element={<AdminLoginPage />} />
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
                <Route path="/admin/credits" element={<AdminCreditsPage />} />
                <Route path="/admin/videos" element={<AdminVideosPage />} />
                <Route path="/admin/projects" element={<AdminProjectsPage />} />
                <Route path="/admin/whatsapp" element={<AdminWhatsAppPage />} />
                <Route path="/admin/referrals" element={<AdminReferralsPage />} />
                <Route path="/not-admin" element={<NotAdminPage />} />
                <Route path="/share/:type/:token" element={<SharedPage />} />
                <Route path="/share/:videoId" element={<PublicVideoPage />} />
                <Route path="/s/:token" element={<SharedPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </WhatsAppGate>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </DirectionProvider>
  </ThemeProvider>
);

export default App;
