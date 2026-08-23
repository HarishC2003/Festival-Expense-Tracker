import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGroup } from '../../context/GroupContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Shield, UserCheck, UserX, UserMinus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { SubmissionOverlay } from '../../components/shared/SubmissionOverlay';
import { toast } from 'sonner';

const API_URL = 'http://localhost:3001/api';

interface Member {
  id: string;
  user_id: string;
  group_id: string;
  role: string;
  status: string;
  created_at: string;
  users: {
    name: string | null;
    email: string;
    phone: string | null;
  };
}

export const GroupMembersPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeGroupId, activeGroupRole } = useGroup();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeGroupId) {
      fetchMembers();
    }
  }, [activeGroupId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/groups/members`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch members');
      }
      const data = await res.json();
      setMembers(data);
    } catch (err: any) {
      console.error('Failed to fetch members:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, action: 'approve' | 'reject' | 'remove') => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/groups/members/${userId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        }
      });
      if (!res.ok) throw new Error(`Failed to ${action}`);
      toast.success(`Successfully ${action}d member`);
      fetchMembers();
    } catch (error) {
      console.error(`Failed to ${action} member:`, error);
      toast.error(`Failed to ${action} member`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/groups/members/${userId}/role`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        },
        body: JSON.stringify({ role })
      });
      if (!res.ok) throw new Error('Failed to update role');
      toast.success('Role updated successfully');
      fetchMembers();
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8 text-primary">Loading...</div>;
  }

  const pendingMembers = members.filter(m => m.status === 'pending');
  const activeMembers = members.filter(m => m.status === 'approved');

  return (
    <div className="space-y-6">
      <SubmissionOverlay isSubmitting={isSubmitting} />
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-display font-bold text-brass tracking-tight">
          Manage Members
        </h1>
      </div>
      
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-center justify-between">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={fetchMembers} className="border-destructive/20 hover:bg-destructive/10">Retry</Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">

      {activeGroupRole === 'owner' && pendingMembers.length > 0 && (
        <Card className="border-brass/30 bg-surface col-span-1 md:col-span-2 lg:col-span-4 h-fit">
          <CardHeader>
            <CardTitle className="text-secondary flex items-center gap-2">
              <Shield size={20} /> Pending Requests
            </CardTitle>
            <CardDescription>Users who have requested to join this group.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-white/5">
                  <div>
                    <p className="font-medium text-foreground">{member.users?.name || member.users?.email || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">{member.users?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="border-kumkum text-kumkum hover:bg-kumkum/10" onClick={() => handleStatusChange(member.user_id, 'reject')}>
                      <UserX size={16} className="mr-2" /> Reject
                    </Button>
                    <Button size="sm" variant="outline" className="border-brass text-brass hover:bg-brass/10" onClick={() => handleStatusChange(member.user_id, 'approve')}>
                      <UserCheck size={16} className="mr-2" /> Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="col-span-1 md:col-span-2 lg:col-span-4 h-fit">
        <CardHeader>
          <CardTitle>Active Members</CardTitle>
          <CardDescription>Manage roles for members of this group.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeMembers.map(member => (
              <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-background/50 border border-white/5 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{member.users?.name || member.users?.email || 'Unknown User'}</p>
                    <Badge variant="outline" className={
                      member.role === 'owner' ? 'border-primary/50 text-primary bg-primary/10' : 
                      member.role === 'editor' ? 'border-secondary/50 text-secondary bg-secondary/10' :
                      'border-muted/50 text-muted-foreground bg-muted/10'
                    }>
                      {member.role === 'owner' ? 'ADMIN' : member.role === 'editor' ? 'MEMBER' : 'VIEWER'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.users?.email}</p>
                </div>
                
                {activeGroupRole === 'owner' && member.user_id !== user?.id && (
                  <div className="flex items-center gap-3">
                    <Select 
                      value={member.role} 
                      onValueChange={(val) => handleRoleChange(member.user_id, val)}
                    >
                      <SelectTrigger className="w-[120px] h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Admin</SelectItem>
                        <SelectItem value="editor">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" className="h-9 px-3 text-destructive border-destructive/20 hover:bg-destructive/10 text-xs font-medium" onClick={() => handleStatusChange(member.user_id, 'remove')}>
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};
