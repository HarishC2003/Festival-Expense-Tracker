import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { ParticleBackground } from '../components/landing/ParticleBackground';
import { HeroSection } from '../components/landing/HeroSection';
import { StatsSection } from '../components/landing/StatsSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { LandingFooter } from '../components/landing/LandingFooter';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-[#F7F7F7] selection:bg-[#D4AF37]/30">
      <LandingNavbar />
      
      <main className="relative">
        <ParticleBackground />
        
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
      </main>

      <LandingFooter />
    </div>
  );
};
