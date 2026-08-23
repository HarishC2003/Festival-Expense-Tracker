import React, { useState, useEffect } from 'react';
import { Hourglass } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const SessionExpiredModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleSessionExpired = () => {
      setIsOpen(true);
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  const handleSignIn = () => {
    setIsOpen(false);
    // Redirect to login, preserving current location
    navigate('/login', { state: { from: location.pathname } });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#1E293B] border border-white/10 rounded-2xl shadow-modal w-full max-w-sm p-8 flex flex-col items-center text-center animate-scale-in">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Hourglass className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>
        
        <h3 className="text-xl font-serif font-bold text-foreground mb-2">
          Your session has expired
        </h3>
        
        <p className="text-sm text-muted-foreground mb-8">
          For your security, we've paused your session. Please sign in again to continue where you left off.
        </p>
        
        <button 
          onClick={handleSignIn}
          className="w-full inline-flex items-center justify-center px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
