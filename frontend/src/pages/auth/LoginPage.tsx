import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { motion } from 'framer-motion';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
      } else {
        await supabase.auth.setSession(data.session);
        navigate('/groups');
      }
    } catch (e: any) {
      setError('Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="w-[400px]">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              {t('auth.loginTitle')}
            </CardTitle>
            <CardDescription>{t('auth.loginDesc')}</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && <div className="text-sm font-medium text-destructive">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('auth.loggingIn') : t('auth.loginBtn')}
              </Button>
              <div className="flex flex-col items-center space-y-2 text-sm text-muted-foreground w-full">
                <div>
                  {t('auth.noAccount')} <Link to="/register" className="text-primary hover:underline font-medium">
                    {t('auth.registerLink')}
                  </Link>
                </div>
                <div className="h-px w-full bg-border/50 my-2" />
                <Link to="/" className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                  <Home className="mr-1 h-3 w-3" />
                  {t('auth.backToHome')}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
