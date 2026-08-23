import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { Shield, Lock, Server, Key } from 'lucide-react';

export const SecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-[#F7F7F7] selection:bg-[#D4AF37]/30">
      
      {/* Simple Header */}
      <LandingNavbar />

      {/* Hero */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[800px] h-[400px] bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="container mx-auto px-6 md:px-12 relative z-10 max-w-4xl text-center">
          <Shield className="w-16 h-16 text-[#D4AF37] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">Security Architecture</h1>
          <p className="text-xl text-white/70">
            Enterprise-grade security designed to protect your sacred financial data.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 pb-24">
        <div className="container mx-auto px-6 md:px-12 max-w-4xl space-y-12">
          
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 flex gap-6">
            <Lock className="w-12 h-12 text-[#D4AF37] shrink-0" />
            <div>
              <h3 className="text-2xl font-bold mb-3">Role-Based Access Control (RBAC)</h3>
              <p className="text-white/70 leading-relaxed">
                Our platform enforces strict role-based access control. Every action is verified against the user's role (Super Admin, Owner, Treasurer, Editor, Viewer). Financial records can only be approved by authorized personnel, and sensitive actions require explicit permissions.
              </p>
            </div>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 flex gap-6">
            <Key className="w-12 h-12 text-[#D4AF37] shrink-0" />
            <div>
              <h3 className="text-2xl font-bold mb-3">Authentication & Sessions</h3>
              <p className="text-white/70 leading-relaxed">
                We utilize industry-standard JSON Web Tokens (JWT) for secure authentication. User sessions are securely managed, and all API requests are verified through Bearer tokens. Passwords are cryptographically hashed and never stored in plain text.
              </p>
            </div>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 flex gap-6">
            <Server className="w-12 h-12 text-[#D4AF37] shrink-0" />
            <div>
              <h3 className="text-2xl font-bold mb-3">Data Encryption & Infrastructure</h3>
              <p className="text-white/70 leading-relaxed">
                All data transmitted between your browser and our servers is encrypted using TLS (HTTPS). Our infrastructure is built on highly secure cloud environments, ensuring that your financial data and records are protected against unauthorized access and breaches.
              </p>
            </div>
          </div>

          <div className="text-center pt-8">
            <p className="text-white/50 text-sm">
              Last updated: August 2026. For security disclosures, please contact our support team.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
