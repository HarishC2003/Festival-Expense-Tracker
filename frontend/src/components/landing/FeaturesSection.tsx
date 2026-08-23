import React from 'react';
import { motion } from 'framer-motion';
import { Banknote, ShieldCheck, PieChart, Users, ImageIcon, FileText } from 'lucide-react';

const features = [
  { icon: Banknote, title: 'Donation Tracking', description: 'Log cash and item donations meticulously with auto-generated secure receipt numbers.' },
  { icon: ShieldCheck, title: 'Expense Management', description: 'Strict multi-tier approval workflows enforcing financial transparency.' },
  { icon: ImageIcon, title: 'Gallery', description: 'Beautiful photo and video albums seamlessly integrated into festival records.' },
  { icon: PieChart, title: 'Reports', description: 'Instantly generate exported PDFs and Excel sheets of the complete Cash Book.' },
  { icon: Users, title: 'Committee Management', description: 'Assign roles, track internal expenditures, and manage vendors across years.' },
  { icon: FileText, title: 'Audit Logs', description: 'Immutable records of every financial and master data change made in the system.' },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-32 bg-[#050505] relative z-10 border-t border-white/5">
      <div className="container mx-auto px-6 md:px-12 relative">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-[#F7F7F7] mb-6 tracking-tight">
            Built for <span className="text-[#D4AF37]">Transparency.</span>
          </h2>
          <p className="text-white/50 text-lg font-light">
            An elegant software suite replacing chaotic spreadsheets with strict state machines, beautiful interfaces, and comprehensive audit trails.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative p-[1px] rounded-2xl overflow-hidden bg-gradient-to-b from-white/10 to-transparent"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/0 to-[#D4AF37]/0 group-hover:from-[#D4AF37]/20 transition-all duration-500" />
              <div className="relative h-full bg-[#0a0a0a] rounded-2xl p-8 backdrop-blur-xl border border-white/5 transition-all duration-500 group-hover:bg-[#0f0f0f]">
                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-white/50 mb-6 group-hover:text-[#D4AF37] group-hover:scale-110 transition-all duration-300 shadow-inner">
                  <feature.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-[#F7F7F7] mb-3">{feature.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
