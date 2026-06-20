import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/sections/HeroSection';
import ThemeSelectionSection from '../components/sections/ThemeSelectionSection';
import WhyOrvixSection from '../components/sections/WhyOrvixSection';
import HowItWorksSection from '../components/sections/HowItWorksSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import SecuritySection from '../components/sections/SecuritySection';
import AppPreviewSection from '../components/sections/AppPreviewSection';

import FAQSection from '../components/sections/FAQSection';
import FinalCTASection from '../components/sections/FinalCTASection';
import Footer from '../components/sections/Footer';
import AetherFlowBackground from '../components/AetherFlowBackground';

export default function Landing() {

  return (
    <div className="website-shell min-h-screen bg-background relative overflow-hidden font-body text-text selection:bg-primary/30 selection:text-text transition-colors duration-500 ease-in-out">
      
      <AetherFlowBackground />

      <Navbar />
      
      <main className="relative z-10 flex flex-col">
        <HeroSection />
        <ThemeSelectionSection />
        <WhyOrvixSection />
        <HowItWorksSection />
        <FeaturesSection />
        <SecuritySection />
        <AppPreviewSection />

        <FAQSection />
        <FinalCTASection />
      </main>

      <Footer />
      
    </div>
  );
}
