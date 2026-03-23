import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PricingPreview from "@/components/PricingPreview";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import FloatingMascot from "@/components/FloatingMascot";
import PageTransition from "@/components/motion/PageTransition";
import UpdatePopup from "@/components/UpdatePopup";
import ChallengePopup from "@/components/ChallengePopup";

const Index = () => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingPreview />
        <FinalCTA />
        <Footer />
        <FloatingMascot />
        <UpdatePopup />
        <ChallengePopup />
      </div>
    </PageTransition>
  );
};

export default Index;
