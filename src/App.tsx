import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { DirectionProvider } from "@/contexts/DirectionContext";
import Index from "./pages/Index.tsx";
import SignupPage from "./pages/SignupPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import WelcomePage from "./pages/WelcomePage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import ProjectsPage from "./pages/ProjectsPage.tsx";
import PricingPage from "./pages/PricingPage.tsx";
import NotFound from "./pages/NotFound.tsx";

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
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/pricing" element={<PlaceholderPage title="מחירים" />} />
                <Route path="/welcome" element={<WelcomePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </DirectionProvider>
  </ThemeProvider>
);

export default App;
