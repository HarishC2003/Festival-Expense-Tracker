import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const AnimatedNumber: React.FC<{ value: number; suffix?: string; prefix?: string }> = ({ value, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2000; 
      let startTime: number | null = null;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const percentage = Math.min(progress / duration, 1);
        
        // Easing function: easeOutExpo
        const easeOut = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
        
        setCount(Math.floor(end * easeOut));

        if (progress < duration) {
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

export const StatsSection: React.FC = () => {
  return (
    <section className="py-24 bg-[#050505] relative overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 bg-[#D4AF37]/5 blur-[100px] rounded-full transform -translate-y-1/2 scale-150" />
      
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="text-4xl md:text-5xl font-bold text-[#F7F7F7] tracking-tight mb-2">
              <AnimatedNumber prefix="₹" value={1.2} suffix="M+" />
            </div>
            <div className="text-sm text-[#D4AF37] uppercase tracking-widest font-semibold">Donation Managed</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="text-4xl md:text-5xl font-bold text-[#F7F7F7] tracking-tight mb-2">
              <AnimatedNumber value={15} suffix="K+" />
            </div>
            <div className="text-sm text-[#D4AF37] uppercase tracking-widest font-semibold">Transactions</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="text-4xl md:text-5xl font-bold text-[#F7F7F7] tracking-tight mb-2">
              <AnimatedNumber value={250} suffix="+" />
            </div>
            <div className="text-sm text-[#D4AF37] uppercase tracking-widest font-semibold">Committee Members</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="text-4xl md:text-5xl font-bold text-[#F7F7F7] tracking-tight mb-2">
              <AnimatedNumber value={99} suffix=".9%" />
            </div>
            <div className="text-sm text-[#D4AF37] uppercase tracking-widest font-semibold">Secure & Verified</div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
