import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useFestivalYear } from '../../context/FestivalYearContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Lock, Unlock, Calendar, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useGroup } from '../../context/GroupContext';

export const YearsPage: React.FC = () => {
  const { role } = useAuth();
  const { activeYear, setActiveYear } = useFestivalYear();
  const { t } = useTranslation();
  const { activeGroupId } = useGroup();
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newYearData, setNewYearData] = useState({ year: new Date().getFullYear() + 1, start_date: '', end_date: '', description: '' });

  const fetchYears = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('festival_years')
      .select('*, festivals(name)')
      .eq('group_id', activeGroupId)
      .order('year', { ascending: false });

    if (!error && data) {
      setYears(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleLock = async (yearId: string) => {
    if (!confirm(t('years.confirmLock'))) return;
    
    // Ideally this calls the backend endpoint to ensure audit log is written via service role
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    
    try {
      const response = await fetch(`/api/festivals/years/${yearId}/lock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchYears();
        // If the locked year is the active one, update context
        if (activeYear?.id === yearId) {
          setActiveYear({ ...activeYear, locked: true });
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || t('years.lockFailed'));
      }
    } catch (e) {
      console.error(e);
      alert(t('years.networkError'));
    }
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId) return;
    
    // Auto-resolve festival_id for this group
    const { data: festival } = await supabase.from('festivals').select('id').eq('group_id', activeGroupId).single();
    if (!festival) {
      alert("No festival found for this group. Please contact support.");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/festivals/years`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId
        },
        body: JSON.stringify({ ...newYearData, festival_id: festival.id })
      });
      
      if (res.ok) {
        setIsCreating(false);
        fetchYears();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to create year");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('years.title')}</h2>
          <p className="text-muted-foreground">{t('years.description')}</p>
        </div>
        {(role === 'super_admin' || role === 'treasurer') && (
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('years.newYear')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Festival Year</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateYear} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input type="number" required value={newYearData.year} onChange={e => setNewYearData({...newYearData, year: parseInt(e.target.value)})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" required value={newYearData.start_date} onChange={e => setNewYearData({...newYearData, start_date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" required value={newYearData.end_date} onChange={e => setNewYearData({...newYearData, end_date: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={newYearData.description} onChange={e => setNewYearData({...newYearData, description: e.target.value})} placeholder="e.g. 2027 Grand Festival" />
                </div>
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div>{t('years.loading')}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {years.map((year) => (
            <Card key={year.id} className={`flex flex-col ${activeYear?.id === year.id ? 'border-primary ring-1 ring-primary' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    {year.year}
                  </CardTitle>
                  <Badge variant={year.locked ? 'destructive' : 'secondary'} className="flex items-center gap-1">
                    {year.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    {year.locked ? t('years.locked') : t('years.open')}
                  </Badge>
                </div>
                <CardDescription>{year.description || t('years.noDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 text-sm text-muted-foreground">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>{t('years.start')}: {year.start_date ? new Date(year.start_date).toLocaleDateString() : t('years.na')}</div>
                  <div>{t('years.end')}: {year.end_date ? new Date(year.end_date).toLocaleDateString() : t('years.na')}</div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between gap-2 border-t pt-4">
                <Button 
                  variant={activeYear?.id === year.id ? 'secondary' : 'default'}
                  className="flex-1"
                  onClick={() => setActiveYear({ id: year.id, festival_id: year.festival_id, year: year.year, locked: year.locked, name: year.description })}
                >
                  {activeYear?.id === year.id ? t('years.selected') : t('years.selectContext')}
                </Button>
                
                {!year.locked && (role === 'super_admin' || role === 'treasurer') && (
                  <Button variant="outline" size="icon" title={t('years.lockYear')} onClick={() => handleLock(year.id)}>
                    <Lock className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
