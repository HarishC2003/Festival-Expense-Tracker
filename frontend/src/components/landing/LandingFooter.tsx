import React from 'react';
import logo from '../../assets/logo.png';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-[#050505] border-t border-white/10 pt-16 pb-8 relative z-10">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div className="mb-6 md:mb-0">
            <img src={logo} alt="Festival Expense Tracker" className="h-16 mb-4" />
            <p className="text-white/50 mt-2 max-w-sm text-sm">
              The premier platform for managing sacred festivals, finances, and committee operations with complete transparency.
            </p>
          </div>
          <div className="flex space-x-8">
            <div className="flex flex-col space-y-3">
              <span className="text-[#F7F7F7] font-medium">Platform</span>
              <a href="#features" className="text-white/50 hover:text-[#D4AF37] text-sm transition-colors">Features</a>
              <a href="/security" className="text-white/50 hover:text-[#D4AF37] text-sm transition-colors">Security</a>
            </div>
            <div className="flex flex-col space-y-3">
              <span className="text-[#F7F7F7] font-medium">Company</span>
              <a href="/about" className="text-white/50 hover:text-[#D4AF37] text-sm transition-colors">About Us</a>
              <a href="/privacy" className="text-white/50 hover:text-[#D4AF37] text-sm transition-colors">Privacy Policy</a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/40 text-xs">
            &copy; {new Date().getFullYear()} Festival Expense Tracker. All rights reserved.
          </p>
          <div className="text-white/40 text-xs mt-4 md:mt-0">
            Crafted for premium scale and security.
          </div>
        </div>
      </div>
    </footer>
  );
};
