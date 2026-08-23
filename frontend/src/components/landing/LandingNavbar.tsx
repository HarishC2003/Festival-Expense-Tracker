import React, { useState, useEffect } from 'react';
import { motion, useScroll } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { LanguageSwitcher } from '../shared/LanguageSwitcher';
import logo from '../../assets/logo.png';

export const LandingNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  const navLinks = [
    { name: t('common.home'), href: '/' },
    { name: t('common.features'), href: '/#features' },
    { name: t('common.about'), href: '/about' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        isScrolled 
          ? 'bg-[#050505]/85 backdrop-blur-xl border-b border-white/10 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)]' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
          <img src={logo} alt="Festival Expense Tracker" className="h-14" />
        </div>

        <div className="hidden lg:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className="text-sm font-medium text-white/70 hover:text-[#D4AF37] transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <Button 
            variant="ghost" 
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => navigate('/login')}
          >
            {t('common.login')}
          </Button>
          <Button 
            className="bg-[#D4AF37] hover:bg-[#E89A00] text-black font-semibold border-none rounded-full px-6 transition-all duration-300 hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]"
            onClick={() => navigate('/register')}
          >
            {t('common.register')}
          </Button>
        </div>
      </div>
    </motion.nav>
  );
};
