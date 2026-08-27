import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import bgVideo from '../../assets/bgvideo.mp4';
import heroBg from '../../assets/hero.png';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);
  const { t } = useTranslation();
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  // Mouse Parallax Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 30, stiffness: 100, mass: 1 };
  const parallaxX = useSpring(mouseX, springConfig);
  const parallaxY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates (-1 to 1)
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      
      // Move slightly (max 15px)
      mouseX.set(x * 15);
      mouseY.set(y * 15);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section ref={ref} className="relative h-screen w-full overflow-hidden bg-[#050505] flex items-center justify-start">
      
      {/* Video Background with Radial Edge Masking */}
      <motion.div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ y: yBg }}
      >
        <div className="absolute inset-0 w-full h-full"
             style={{ 
               WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 95%)',
               maskImage: 'radial-gradient(circle at center, black 40%, transparent 95%)'
             }}>
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-center"
          >
            <source src={bgVideo} type="video/mp4" />
          </video>
        </div>
        
        {/* The 3-Tier Overlay System */}
        {/* Layer 1: Base wash */}
        <div className="absolute inset-0 bg-black/10" />
        
        {/* Layer 2: Heavy dark gradient on left for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-[#050505]/40 to-transparent w-full md:w-[70%]" />
        
        {/* Layer 3: Warm subtle golden gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/5 via-transparent to-transparent mix-blend-overlay" />

        {/* Dynamic Vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(5,5,5,0.8)]" />
      </motion.div>

      {/* Floating Particles in Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-[#D4AF37] rounded-full blur-[1px]"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, (Math.random() - 0.5) * 30, 0],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      {/* Hero Content - Left Aligned with Parallax */}
      <div className="container mx-auto px-6 md:px-12 relative z-10 pt-16">
        <motion.div 
          style={{ opacity, x: parallaxX, y: parallaxY }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="max-w-3xl"
        >
          {/* Animated Light Bloom behind text */}
          <div className="absolute -left-[20%] top-[20%] w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Tag */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
          >
            <span className="flex h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37] animate-pulse" />
            <span className="text-[11px] font-semibold tracking-[0.2em] text-white/80 uppercase">{t('landing.tag')}</span>
          </motion.div>

          {/* Main Typography */}
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-[#F7F7F7] leading-[1.05] mb-6 drop-shadow-2xl">
            {t('landing.title')} <br />
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#E89A00] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              {t('landing.titleHighlight')}
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl leading-relaxed font-light tracking-wide drop-shadow-md">
            {t('landing.description')}
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <Button 
              size="lg" 
              className="w-full sm:w-auto h-14 px-8 text-base bg-white hover:bg-gray-100 text-black font-semibold rounded-full transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)] group"
              onClick={() => navigate('/register')}
            >
              {t('landing.getStarted')}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto h-14 px-8 text-base border-white/20 text-[#F7F7F7] bg-black/20 backdrop-blur-md hover:bg-white/10 hover:border-white/40 rounded-full transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t('landing.exploreFeatures')}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
