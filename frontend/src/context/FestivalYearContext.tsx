import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useGroup } from './GroupContext';
import { useAuth } from './AuthContext';

interface FestivalYear {
  id: string;
  festival_id: string;
  year: number;
  locked: boolean;
  name?: string;
}

interface FestivalYearContextType {
  activeYear: FestivalYear | null;
  setActiveYear: (year: FestivalYear | null) => void;
  // Other modules will need to know if it's locked
  isLocked: boolean; 
}

const FestivalYearContext = createContext<FestivalYearContextType>({
  activeYear: null,
  setActiveYear: () => {},
  isLocked: false,
});

export const FestivalYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeYear, setActiveYearState] = useState<FestivalYear | null>(() => {
    const saved = localStorage.getItem('activeFestivalYear');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isReady, setIsReady] = useState(false);

  const setActiveYear = (year: FestivalYear | null) => {
    setActiveYearState(year);
    if (year) {
      localStorage.setItem('activeFestivalYear', JSON.stringify(year));
    } else {
      localStorage.removeItem('activeFestivalYear');
    }
  };

  const { activeGroupId, activeGroupRole } = useGroup();
  const { user } = useAuth();

  // Auto-fetch and select the latest open year if none is selected, auto-creating if necessary
  useEffect(() => {
    let mounted = true;
    
    const fetchLatestYear = async () => {
      if (!activeGroupId || !user || activeGroupRole === null) {
        setIsReady(true);
        return;
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Only owners and editors have permission to auto-init.
        // Viewers will just rely on the API returning the current year, which we can fetch directly 
        // if auto-init is skipped, but currently auto-init returns the active year.
        // Let's call auto-init only if we have permissions, otherwise just fetch open year.
        if (activeGroupRole === 'viewer') {
          const { data: yearData } = await supabase
            .from('festival_years')
            .select('*')
            .eq('group_id', activeGroupId)
            .eq('locked', false)
            .order('year', { ascending: false })
            .limit(1)
            .single();
            
          if (yearData && mounted) {
            setActiveYear({
              id: yearData.id,
              festival_id: yearData.festival_id,
              year: yearData.year,
              locked: yearData.locked,
              name: yearData.description
            });
          }
        } else {
          const res = await fetch(`http://localhost:3001/api/festivals/auto-init`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'X-Group-Id': activeGroupId
            }
          });
          
          if (res.ok && mounted) {
            const { year: data } = await res.json();
            if (data) {
              setActiveYear({
                id: data.id,
                festival_id: data.festival_id,
                year: data.year,
                locked: data.locked,
                name: data.description
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to auto-init year", err);
      } finally {
        if (mounted) setIsReady(true);
      }
    };
    
    // Only run if we don't already have an active year, or if we switched groups (which would invalidate the old year)
    // Actually, to be safe on group switch, if activeYear doesn't match activeGroupId, we'd need to re-fetch.
    // For simplicity, just run this every time activeGroupId changes to ensure we have a valid year.
    fetchLatestYear();
    
    return () => { mounted = false; };
  }, [activeGroupId, user, activeGroupRole]);

  if (!isReady && activeGroupId && user) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading context...</div>;
  }

  return (
    <FestivalYearContext.Provider value={{ 
      activeYear, 
      setActiveYear,
      isLocked: activeYear?.locked ?? false 
    }}>
      {children}
    </FestivalYearContext.Provider>
  );
};

export const useFestivalYear = () => useContext(FestivalYearContext);
