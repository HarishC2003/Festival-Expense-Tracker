import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../../components/states/PageLoader';
import { ErrorState } from '../../components/states/ErrorState';
import { supabase } from '../../lib/supabase';

interface Stats {
  users: number;
  groups: number;
  festivals: number;
  timestamp: string;
}

export function AdminDashboardPage() {
  const { isPlatformAdmin } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    
    async function fetchStats() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const res = await fetch('http://localhost:3001/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!res.ok) throw new Error('Failed to fetch admin stats');
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [isPlatformAdmin]);

  if (!isPlatformAdmin) {
    return <ErrorState title="Access Denied" description="You do not have permission to view this page." />;
  }

  if (loading) return <PageLoader message="Loading Platform Stats..." />;
  if (error) return <ErrorState title="Failed to load stats" description={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Platform Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface/50 p-6 rounded-xl border border-white/10 flex flex-col items-center justify-center space-y-2">
          <span className="text-muted-foreground text-sm uppercase tracking-wider">Total Users</span>
          <span className="text-4xl font-bold text-white">{stats?.users}</span>
        </div>
        <div className="bg-surface/50 p-6 rounded-xl border border-white/10 flex flex-col items-center justify-center space-y-2">
          <span className="text-muted-foreground text-sm uppercase tracking-wider">Total Groups</span>
          <span className="text-4xl font-bold text-white">{stats?.groups}</span>
        </div>
        <div className="bg-surface/50 p-6 rounded-xl border border-white/10 flex flex-col items-center justify-center space-y-2">
          <span className="text-muted-foreground text-sm uppercase tracking-wider">Total Festivals</span>
          <span className="text-4xl font-bold text-white">{stats?.festivals}</span>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground text-center">Last updated: {stats?.timestamp ? new Date(stats.timestamp).toLocaleString() : 'N/A'}</p>
    </div>
  );
}
