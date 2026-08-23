import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

export interface Group {
  id: string;
  name: string;
  code: string;
  description: string;
  owner_id: string;
}

export interface GroupMembership {
  role: string;
  status: string;
  groups: Group;
}

interface GroupContextType {
  activeGroupId: string | null;
  activeGroupRole: string | null;
  myGroups: GroupMembership[];
  loadingGroups: boolean;
  setActiveGroup: (groupId: string, role: string) => void;
  refreshGroups: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType>({
  activeGroupId: null,
  activeGroupRole: null,
  myGroups: [],
  loadingGroups: true,
  setActiveGroup: () => {},
  refreshGroups: async () => {},
});

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(() => localStorage.getItem('activeGroupId'));
  const [activeGroupRole, setActiveGroupRole] = useState<string | null>(null);
  const [myGroups, setMyGroups] = useState<GroupMembership[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const fetchGroups = async () => {
    if (!user) {
      setMyGroups([]);
      setLoadingGroups(false);
      return;
    }

    try {
      setLoadingGroups(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/groups/mine`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMyGroups(data);
        
        // If we have an active group in localStorage, verify we still have access
        if (activeGroupId) {
          const membership = data.find((g: GroupMembership) => g.groups.id === activeGroupId && g.status === 'approved');
          if (membership) {
            setActiveGroupRole(membership.role);
          } else {
            // Invalid group or access lost, fallback to first approved group
            fallbackToFirstGroup(data);
          }
        } else {
          fallbackToFirstGroup(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch groups', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fallbackToFirstGroup = (groups: GroupMembership[]) => {
    const approved = groups.filter(g => g.status === 'approved');
    if (approved.length > 0) {
      setActiveGroup(approved[0].groups.id, approved[0].role);
    } else {
      setActiveGroupIdState(null);
      setActiveGroupRole(null);
      localStorage.removeItem('activeGroupId');
    }
  };

  const setActiveGroup = (groupId: string, role: string) => {
    const currentGroupId = localStorage.getItem('activeGroupId');
    setActiveGroupIdState(groupId);
    setActiveGroupRole(role);
    localStorage.setItem('activeGroupId', groupId);
    
    // Hard reload if switching between different active groups to clear component states
    if (currentGroupId && currentGroupId !== groupId) {
      window.location.reload();
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  return (
    <GroupContext.Provider value={{
      activeGroupId,
      activeGroupRole,
      myGroups,
      loadingGroups,
      setActiveGroup,
      refreshGroups: fetchGroups
    }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => useContext(GroupContext);
