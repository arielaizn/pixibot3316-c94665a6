import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PricingPreview from "@/components/PricingPreview";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import FloatingMascot from "@/components/FloatingMascot";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingPreview />
      <FinalCTA />
      <Footer />
      <FloatingMascot />
    </div>
  );
};

export default Index;
