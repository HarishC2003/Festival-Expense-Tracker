import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { SubmissionOverlay } from '../../components/shared/SubmissionOverlay';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingName, setLoadingName] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name }
      });
      if (error) throw error;
      
      // Also update the public.users table so it reflects in the Group Members list
      const { error: dbError } = await supabase.from('users').update({ name }).eq('id', user?.id);
      if (dbError) console.error('Failed to update public.users table:', dbError);

      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoadingName(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoadingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });
      if (error) throw error;
      toast.success('Password updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoadingPwd(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <SubmissionOverlay isSubmitting={loadingName || loadingPwd} />
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight text-brass">{t('settings.title') || 'Settings'}</h2>
        <p className="text-muted-foreground mt-1">{t('settings.description') || 'Manage your personal account settings.'}</p>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Update your display name.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Enter your name" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="opacity-50" />
              </div>
              <Button type="submit" disabled={loadingName}>
                {loadingName ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input 
                  type="password"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Minimum 6 characters" 
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input 
                  type="password"
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="Confirm password" 
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={loadingPwd}>
                {loadingPwd ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
