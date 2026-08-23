import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export const UsersPage: React.FC = () => {
  const { role } = useAuth();
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (role === 'super_admin') {
      const fetchUsers = async () => {
        const { data, error } = await supabase.from('users').select('*');
        if (data) setUsers(data);
      };
      fetchUsers();
    }
  }, [role]);

  if (role !== 'super_admin') {
    return <div>{t('users.accessDenied')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('users.title')}</h2>
        <p className="text-muted-foreground">{t('users.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.systemUsers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="flex justify-between items-center p-4 border rounded-md">
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize">{user.role?.replace('_', ' ')}</Badge>
                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {user.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
