import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { FileText, EyeOff, FileCheck } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-[#F7F7F7] selection:bg-[#D4AF37]/30">
      
      {/* Simple Header */}
      <LandingNavbar />

      {/* Hero */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[800px] h-[400px] bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="container mx-auto px-6 md:px-12 relative z-10 max-w-4xl text-center">
          <FileText className="w-16 h-16 text-[#D4AF37] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">Privacy Policy</h1>
          <p className="text-xl text-white/70">
            We are committed to protecting your personal and financial information.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 pb-24">
        <div className="container mx-auto px-6 md:px-12 max-w-4xl space-y-12">
          
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 flex gap-6">
            <EyeOff className="w-12 h-12 text-[#D4AF37] shrink-0" />
            <div>
              <h3 className="text-2xl font-bold mb-3">Data Collection</h3>
              <p className="text-white/70 leading-relaxed mb-4">
                We only collect data that is strictly necessary for managing your festival operations. This includes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-white/60">
                <li>Account information (Name, Email, Role)</li>
                <li>Financial records (Donations, Expenses, Incomes)</li>
                <li>Audit logs for accountability and transparency</li>
              </ul>
            </div>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 flex gap-6">
            <FileCheck className="w-12 h-12 text-[#D4AF37] shrink-0" />
            <div>
              <h3 className="text-2xl font-bold mb-3">How We Use Your Data</h3>
              <p className="text-white/70 leading-relaxed">
                Your data is exclusively used to provide you with the Festival Expense Tracker service. We do not sell, rent, or share your financial data with any third parties. All financial records belong solely to your registered committee group. Data is only accessible to authorized members within your group based on their assigned role.
              </p>
            </div>
          </div>

          <div className="text-center pt-8">
            <p className="text-white/50 text-sm">
              Last updated: August 2026. If you have questions about this privacy policy, please contact support.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
