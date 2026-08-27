import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFestivalYear } from '../../context/FestivalYearContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ExpenseDetailDrawer } from '../../components/expenses/ExpenseDetailDrawer';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import { SubmissionOverlay } from '../../components/shared/SubmissionOverlay';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { PromptDialog } from '../../components/shared/PromptDialog';
import { useGroup } from '../../context/GroupContext';

export const ApprovalQueuePage: React.FC = () => {
  const { activeYear, isLocked } = useFestivalYear();
  const { activeGroupId } = useGroup();
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, description: string, variant?: 'danger' | 'default', onConfirm: () => void} | null>(null);
  const [promptConfig, setPromptConfig] = useState<{isOpen: boolean, title: string, description: string, placeholder?: string, onConfirm: (val: string) => void} | null>(null);

  const fetchPending = async () => {
    if (!activeYear) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/expenses?yearId=${activeYear.id}`, {
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.filter((e: any) => e.status === 'pending' || (e.status === 'approved' && e.fund_source === 'personal')));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [activeYear]);

  const handleApprove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isLocked) return alert(t('expenses.locked'));
    setConfirmConfig({
      isOpen: true,
      title: 'Approve Expense',
      description: t('expenses.confirmApprove') || 'Approve this expense?',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(`/api/expenses/${id}/approve`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${session?.access_token}`,
              'X-Group-Id': activeGroupId || ''
            }
          });
          if (res.ok) fetchPending();
          else alert(t('expenses.failedApprove'));
        } catch (err) {
          console.error(err);
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  const handleReject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isLocked) return alert(t('expenses.locked'));
    setPromptConfig({
      isOpen: true,
      title: 'Reject Expense',
      description: t('expenses.reasonReject') || 'Please enter a reason for rejection:',
      placeholder: 'Reason...',
      onConfirm: async (reason: string) => {
        setIsProcessing(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(`/api/expenses/${id}/reject`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
              'X-Group-Id': activeGroupId || ''
            },
            body: JSON.stringify({ reason })
          });
          if (res.ok) fetchPending();
          else alert(t('expenses.failedReject'));
        } catch (err) {
          console.error(err);
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  const handleReimburse = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isLocked) return alert(t('expenses.locked'));
    setConfirmConfig({
      isOpen: true,
      title: 'Reimburse Expense',
      description: 'Mark this personal expense as reimbursed?',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/expenses/${id}/reimburse`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        }
      });
      if (res.ok) fetchPending();
      else alert('Failed to reimburse');
        } catch (err) {
          console.error(err);
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  if (!activeYear) return <div className="p-8">{t('expenses.noActiveYear')}</div>;

  return (
    <div className="space-y-6">
      {isProcessing && <SubmissionOverlay isSubmitting={true} text="Processing..." />}
      {confirmConfig && (
        <ConfirmDialog
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          description={confirmConfig.description}
          variant={confirmConfig.variant}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
      {promptConfig && (
        <PromptDialog
          isOpen={promptConfig.isOpen}
          title={promptConfig.title}
          description={promptConfig.description}
          placeholder={promptConfig.placeholder}
          onConfirm={promptConfig.onConfirm}
          onCancel={() => setPromptConfig(null)}
        />
      )}
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight text-brass">{t('expenses.queueTitle')}</h2>
        <p className="text-textSecondary mt-1">{t('expenses.queueDesc', { year: activeYear?.name || activeYear?.year || new Date().getFullYear() })}</p>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('expenses.date')}</TableHead>
              <TableHead>{t('expenses.description')}</TableHead>
              <TableHead>{t('expenses.paidBy')}</TableHead>
              <TableHead>Fund Source</TableHead>
              <TableHead className="text-right">{t('expenses.amount')}</TableHead>
              <TableHead className="text-right">{t('expenses.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t('expenses.emptyQueue')}</TableCell></TableRow>}
            {expenses.map((e) => (
              <TableRow key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedExpense(e)}>
                <TableCell>{new Date(e.expense_date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{e.description}</TableCell>
                <TableCell>{e.committee_members?.name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-sm text-xs font-semibold ${e.fund_source === 'personal' ? 'bg-kumkum/10 text-kumkum' : 'bg-brass/10 text-brass'}`}>
                    {e.fund_source === 'personal' ? 'Personal Fund' : 'Committee Fund'}
                  </span>
                </TableCell>
                <TableCell className="text-right font-bold">₹{e.amount}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); setSelectedExpense(e); }}>
                    <Eye className="h-4 w-4 text-brass" />
                  </Button>
                  
                  {e.status === 'pending' && (
                    <>
                      <Button variant="ghost" size="sm" onClick={(ev) => handleApprove(ev, e.id)} disabled={isLocked} title="Approve">
                        <CheckCircle className="h-4 w-4 text-brass" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(ev) => handleReject(ev, e.id)} disabled={isLocked} title="Reject">
                        <XCircle className="h-4 w-4 text-kumkum" />
                      </Button>
                    </>
                  )}

                  {e.status === 'approved' && e.fund_source === 'personal' && (
                    <Button variant="outline" size="sm" onClick={(ev) => handleReimburse(ev, e.id)} disabled={isLocked} className="border-brass text-brass hover:bg-brass/10">
                      Reimburse
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ExpenseDetailDrawer expense={selectedExpense} isOpen={!!selectedExpense} onClose={() => setSelectedExpense(null)} />

      <SubmissionOverlay isSubmitting={isProcessing} />
      <ConfirmDialog
        isOpen={confirmConfig?.isOpen || false}
        title={confirmConfig?.title || ''}
        description={confirmConfig?.description || ''}
        variant={confirmConfig?.variant}
        onCancel={() => setConfirmConfig(prev => prev ? { ...prev, isOpen: false } : null)}
        onConfirm={confirmConfig?.onConfirm || (() => {})}
      />
      <PromptDialog
        isOpen={promptConfig?.isOpen || false}
        title={promptConfig?.title || ''}
        description={promptConfig?.description || ''}
        placeholder={promptConfig?.placeholder}
        onCancel={() => setPromptConfig(prev => prev ? { ...prev, isOpen: false } : null)}
        onConfirm={promptConfig?.onConfirm || (() => {})}
      />
    </div>
  );
};
