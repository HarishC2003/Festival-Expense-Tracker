import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFestivalYear } from '../../context/FestivalYearContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { ExpenseDetailDrawer } from '../../components/expenses/ExpenseDetailDrawer';
import { RefreshCw, Eye, Plus, Receipt, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SubmissionOverlay } from '../../components/shared/SubmissionOverlay';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { PageLoader } from '../../components/states/PageLoader';
import { ErrorState } from '../../components/states/ErrorState';
import { EmptyState } from '../../components/states/EmptyState';

export const ExpensesListPage: React.FC = () => {
  const { activeYear, isLocked } = useFestivalYear();
  const { activeGroupId, activeGroupRole } = useGroup();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, description: string, variant?: 'danger' | 'default', onConfirm: () => Promise<void>} | null>(null);

  const fetchExpenses = async () => {
    if (!activeYear || !activeGroupId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3001/api/expenses?yearId=${activeYear.id}`, {
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        }
      });
      if (res.ok) {
        setExpenses(await res.json());
      } else {
        throw new Error('Failed to fetch expenses');
      }
    } catch (e: any) {
      setError(e);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [activeYear]);

  const handleReimburse = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: 'Reimburse Expense',
      description: t('expenses.confirmReimburse') || 'Mark this personal expense as reimbursed?',
      onConfirm: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(`http://localhost:3001/api/expenses/${id}/reimburse`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${session?.access_token}`,
              'X-Group-Id': activeGroupId || ''
            }
          });
          if (res.ok) fetchExpenses();
          else {
            alert(t('expenses.failedReimburse'));
            toast.error('Failed to mark expense as reimbursed');
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Expense',
      description: 'Are you sure you want to delete this expense? This action cannot be undone.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(`http://localhost:3001/api/expenses/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'X-Group-Id': activeGroupId || ''
            }
          });
          
          if (res.ok) {
            toast.success('Expense deleted successfully');
            fetchExpenses();
          } else {
            const err = await res.json();
            toast.error(err.error || 'Failed to delete expense');
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to delete expense');
        }
      }
    });
  };

  const renderTable = (status: string) => {
    const filtered = status === 'all' ? expenses : expenses.filter(e => e.status === status);
    
    return (
      <div className="border rounded-md mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date / Time Logged</TableHead>
              <TableHead>{t('expenses.description')}</TableHead>
              <TableHead>{t('expenses.category')}</TableHead>
              <TableHead>{t('expenses.paidBy')}</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead className="text-right">{t('expenses.amount')}</TableHead>
              <TableHead className="text-right">{t('expenses.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-64 p-0">
                  <EmptyState 
                    icon={Receipt} 
                    title="No expenses found" 
                    description={status === 'all' ? "No expenses have been recorded for this festival year." : `No ${status} expenses found.`} 
                    action={status === 'all' && !isLocked ? () => navigate('/expenses/new') : undefined}
                    actionLabel="Submit New Expense"
                  />
                </TableCell>
              </TableRow>
            )}
            {filtered.map((e) => (
              <TableRow key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedExpense(e)}>
                <TableCell className="whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</TableCell>
                <TableCell className="font-medium">{e.description}</TableCell>
                <TableCell>{e.expense_categories?.name}</TableCell>
                <TableCell>{e.committee_members?.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{e.users?.email}</TableCell>
                <TableCell className="text-right font-bold">₹{e.amount}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); setSelectedExpense(e); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {status === 'approved' && activeGroupRole === 'owner' && (
                    <Button variant="outline" size="sm" className="ml-2 bg-[#1A3330] text-[#71B5A9] hover:bg-[#1A3330]/80 border-brass" onClick={(ev) => handleReimburse(ev, e.id)}>
                      {t('expenses.markReimbursed')}
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(ev) => ev.stopPropagation()}>
                      <Button variant="ghost" className="h-8 w-8 p-0 ml-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(ev) => { ev.stopPropagation(); setTimeout(() => navigate(`/expenses/edit/${e.id}`), 10); }} disabled={isLocked || activeGroupRole !== 'owner'}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                      <DropdownMenuItem onClick={(ev) => { ev.stopPropagation(); setTimeout(() => handleDelete(ev, e.id), 10); }} disabled={isLocked || activeGroupRole !== 'owner'} className="text-red-500">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={confirmConfig?.isOpen || false}
        title={confirmConfig?.title || ''}
        description={confirmConfig?.description || ''}
        variant={confirmConfig?.variant}
        processingText={confirmConfig?.variant === 'danger' ? 'Deleting...' : 'Processing...'}
        onConfirm={confirmConfig?.onConfirm || (() => {})}
        onCancel={() => setConfirmConfig(prev => prev ? { ...prev, isOpen: false } : null)}
      />
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-brass tracking-tight">{t('expenses.listTitle')}</h2>
          <p className="text-textSecondary mt-1">{t('expenses.listDesc', { year: activeYear?.name || activeYear?.year || new Date().getFullYear() })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchExpenses}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
          <Button onClick={() => navigate('/expenses/new')} disabled={isLocked || activeGroupRole === 'viewer'}><Plus className="mr-2 h-4 w-4" /> {t('expenses.submitNew')}</Button>
        </div>
      </div>

      {loading ? (
        <PageLoader message="Loading expenses..." className="min-h-[50vh]" />
      ) : error ? (
        <ErrorState onRetry={fetchExpenses} />
      ) : (
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All <Badge variant="secondary" className="ml-2">{expenses.length}</Badge></TabsTrigger>
          <TabsTrigger value="pending">{t('expenses.pending')} <Badge variant="secondary" className="ml-2">{expenses.filter(e=>e.status==='pending').length}</Badge></TabsTrigger>
          <TabsTrigger value="approved">{t('expenses.approved')} <Badge variant="secondary" className="ml-2">{expenses.filter(e=>e.status==='approved').length}</Badge></TabsTrigger>
          <TabsTrigger value="reimbursed">{t('expenses.reimbursed')}</TabsTrigger>
          <TabsTrigger value="rejected">{t('expenses.rejected')}</TabsTrigger>
        </TabsList>
        <TabsContent value="all">{renderTable('all')}</TabsContent>
        <TabsContent value="pending">{renderTable('pending')}</TabsContent>
        <TabsContent value="approved">{renderTable('approved')}</TabsContent>
        <TabsContent value="reimbursed">{renderTable('reimbursed')}</TabsContent>
        <TabsContent value="rejected">{renderTable('rejected')}</TabsContent>
      </Tabs>
      )}

      <ExpenseDetailDrawer expense={selectedExpense} isOpen={!!selectedExpense} onClose={() => setSelectedExpense(null)} />
    </div>
  );
};
