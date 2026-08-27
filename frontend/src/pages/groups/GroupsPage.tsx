import React, { useState } from 'react';
import { useGroup } from '../../context/GroupContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Bell, LogOut, Key, Plus, Shield, Users, CheckCircle, Clock, Copy } from 'lucide-react';
import { LanguageSwitcher } from '../../components/shared/LanguageSwitcher';
import { toast } from 'sonner';
import logo from '../../assets/logo.png';

export const GroupsPage = () => {
  const { myGroups, activeGroupId, setActiveGroup, refreshGroups } = useGroup();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const [isCreating, setIsCreating] = useState(searchParams.get('action') === 'new');
  const [isJoining, setIsJoining] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName || !newGroupCode) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, code: newGroupCode, description: newGroupDesc })
      });
      if (res.ok) {
        await refreshGroups();
        setIsCreating(false);
        setNewGroupName('');
        setNewGroupCode('');
        setNewGroupDesc('');
      } else {
        toast.error('Failed to create group');
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode })
      });
      if (res.ok) {
        await refreshGroups();
        setIsJoining(false);
        setJoinCode('');
        toast.success('Successfully requested to join group. Wait for approval from an owner.');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to join group');
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="bg-background text-foreground min-h-screen selection:bg-primary/30 font-sans">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-20 bg-background/90 backdrop-blur-xl border-b border-brass/10 shadow-sm">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Festival Expense Tracker" className="h-16" />
        </div>
        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          
          <button onClick={handleSignOut} className="text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-destructive/10">
            <LogOut size={20} />
          </button>
          
          <div className="w-10 h-10 rounded-full overflow-hidden border border-brass/20 cursor-pointer">
            <img 
              alt="Profile" 
              className="w-full h-full object-cover" 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email || 'User'}&backgroundColor=f2ca50&textColor=000000`} 
            />
          </div>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="pt-32 pb-24 px-6 max-w-[1440px] mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">My Groups</h1>
            <p className="text-lg text-muted-foreground">Select a group to continue...</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => setIsJoining(true)}
              className="px-6 py-3 rounded-sm border border-brass/50 text-brass font-semibold hover:bg-brass/10 transition-colors flex items-center gap-2 justify-center"
            >
              <Key size={18} /> Join with Code
            </button>
            <button 
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 rounded-sm bg-brass text-brass-foreground font-semibold hover:bg-brass/90 transition-colors flex items-center gap-2 justify-center"
            >
              <Plus size={18} /> Create Group
            </button>
          </div>
        </header>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {myGroups.map((membership) => {
            const isActive = activeGroupId === membership.groups.id;
            const isPending = membership.status === 'pending';
            
            return (
              <div 
                key={membership.groups.id}
                onClick={() => {
                  if (!isPending) {
                    setActiveGroup(membership.groups.id, membership.role);
                    navigate('/dashboard');
                  }
                }}
                className={`bg-surface border rounded-md p-6 flex flex-col gap-6 relative overflow-hidden transition-all duration-300 
                  ${isPending ? 'opacity-60 grayscale-[30%] cursor-not-allowed border-brass/10' : 'cursor-pointer hover:border-brass/40 hover:bg-surface/80 group border-brass/20'}
                  ${isActive ? 'border-brass bg-brass/5' : ''}
                `}
              >
                <div className="flex justify-between items-start z-10 relative">
                  <div className="w-12 h-12 rounded-sm bg-ground border border-brass/20 flex items-center justify-center text-brass group-hover:scale-105 transition-transform">
                    <Shield size={24} />
                  </div>
                  <span className={`px-3 py-1 rounded-sm text-xs font-semibold border ${
                    membership.role === 'owner' ? 'bg-oillamp/10 text-oillamp border-oillamp/30' : 
                    membership.role === 'editor' ? 'bg-turmeric/10 text-turmeric border-turmeric/30' :
                    'bg-surface text-textSecondary border-brass/10'
                  }`}>
                    {membership.role.charAt(0).toUpperCase() + membership.role.slice(1)}
                  </span>
                </div>
                
                <div className="z-10 relative">
                  <h3 className="text-2xl font-display font-bold text-textPrimary mb-1 truncate">{membership.groups.name}</h3>
                  {membership.groups.description && (
                    <p className="text-sm text-textSecondary truncate mb-2">{membership.groups.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-brass bg-brass/10 px-2 py-1 rounded border border-brass/20">Code: {membership.groups.code}</span>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        navigator.clipboard.writeText(membership.groups.code); 
                        toast.success('Code copied to clipboard!'); 
                      }} 
                      className="p-1.5 hover:bg-brass/20 text-brass rounded transition-colors"
                      title="Copy Group Code"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-brass/10 z-10 relative text-textSecondary text-sm font-semibold">
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>Role: {membership.role}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${isPending ? '' : 'text-secondary'}`}>
                    {isPending ? <Clock size={16} /> : <CheckCircle size={16} />}
                    <span>{isPending ? 'Awaiting Approval' : isActive ? 'Currently Active' : 'Select'}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {myGroups.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center bg-surface rounded-md border border-dashed border-brass/30">
              <Users className="w-12 h-12 text-textSecondary mx-auto mb-3 opacity-50" />
              <h3 className="text-xl font-display font-bold text-brass mb-2">No Groups Found</h3>
              <p className="text-textSecondary mb-6">You don't belong to any groups yet.</p>
              <button 
                onClick={() => setIsCreating(true)}
                className="px-6 py-3 rounded-sm bg-brass text-brass-foreground font-semibold hover:bg-brass/90 transition-colors"
              >
                Create Your First Group
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Group Modal */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Group</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Set up a new space for your temple committee or family festival.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGroup} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name</label>
              <Input 
                value={newGroupName} 
                onChange={e => setNewGroupName(e.target.value)} 
                placeholder="e.g. Anna Nagar Vinayagar Committee" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unique Code</label>
              <Input 
                value={newGroupCode} 
                onChange={e => setNewGroupCode(e.target.value.replace(/[^A-Za-z0-9-_]/g, '').toUpperCase())} 
                placeholder="e.g. ANNANAGAR-2024" 
                required 
                className="font-mono text-brass text-lg tracking-widest drop-shadow-sm"
              />
              <p className="text-xs text-muted-foreground">Used by others to request to join.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input 
                value={newGroupDesc} 
                onChange={e => setNewGroupDesc(e.target.value)} 
                placeholder="Brief description of the group" 
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading} className="w-full">Create Group</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Join Group Modal */}
      <Dialog open={isJoining} onOpenChange={setIsJoining}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join an Existing Group</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter the unique group code provided by the group owner.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJoinGroup} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Code</label>
              <Input 
                value={joinCode} 
                onChange={e => setJoinCode(e.target.value.toUpperCase())} 
                placeholder="Enter exact code" 
                required 
                className="font-mono text-brass text-lg tracking-widest drop-shadow-sm text-center"
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading} className="w-full">Request Access</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
