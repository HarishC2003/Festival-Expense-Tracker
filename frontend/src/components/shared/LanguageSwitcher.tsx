import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('en') ? 'ta' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <Button 
      variant="ghost" 
      onClick={toggleLanguage}
      className="text-foreground hover:bg-foreground/5 px-3 min-w-[48px] rounded-full border border-foreground/20 transition-all font-medium text-sm"
    >
      {i18n.language.startsWith('en') ? 'தமிழ்' : 'EN'}
    </Button>
  );
};
