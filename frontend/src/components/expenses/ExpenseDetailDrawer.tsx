import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useGroup } from '../../context/GroupContext';

interface ExpenseDetailDrawerProps {
  expense: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseDetailDrawer: React.FC<ExpenseDetailDrawerProps> = ({ expense, isOpen, onClose }) => {
  const { t } = useTranslation();
  const { activeGroupId } = useGroup();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!expense) return;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3001/api/expenses/${expense.id}/history`, {
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        }
      });
      if (res.ok) setHistory(await res.json());
    };
    if (isOpen) fetchHistory();
  }, [expense, isOpen]);

  if (!expense) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl h-[80vh] flex flex-col p-0 gap-0 bg-surface border-brass/20 text-textPrimary">
        <DialogHeader className="p-6 border-b border-brass/10 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-display text-brass">{expense.description}</DialogTitle>
              <div className="text-textSecondary mt-1">₹{expense.amount} • {expense.expense_categories?.name}</div>
            </div>
            <span className={`px-3 py-1 rounded-sm text-xs font-semibold border ${
              expense.status === 'pending' ? 'bg-turmeric/10 text-turmeric border-turmeric/30' :
              expense.status === 'approved' ? 'bg-brass/10 text-brass border-brass/30' :
              expense.status === 'rejected' ? 'bg-kumkum/10 text-kumkum border-kumkum/30' :
              'bg-[#1A3330] text-[#71B5A9] border-brass/30' // reimbursed
            }`}>
              {t(`expenses.${expense.status}`).toUpperCase()}
            </span>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold">{t('expenses.paidByLabel')}</span> {expense.committee_members?.name}</div>
              <div><span className="font-semibold">{t('expenses.dateLabel')}</span> {new Date(expense.expense_date).toLocaleDateString()}</div>
              <div><span className="font-semibold">{t('expenses.vendorLabel')}</span> {expense.vendors?.name || t('expenses.na')}</div>
              <div><span className="font-semibold">{t('expenses.methodLabel')}</span> {expense.payment_methods?.name}</div>
            </div>

            {expense.receipt_image_url && (
              <div className="border rounded-md overflow-hidden mt-4">
                <div className="bg-muted p-2 text-xs font-semibold uppercase tracking-wider text-center">{t('expenses.receiptImage')}</div>
                <img src={expense.receipt_image_url} alt={t('expenses.receiptImage')} className="w-full h-auto object-contain max-h-64" />
              </div>
            )}

            <div>
              <h3 className="text-lg font-display font-bold text-brass mb-4">{t('expenses.statusTimeline')}</h3>
              <div className="space-y-4 border-l-2 border-brass/20 pl-4 ml-2">
                {history.map((h, i) => (
                  <div key={h.id} className="relative">
                    <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-brass ring-4 ring-surface" />
                    <div className="text-sm font-medium text-textPrimary">
                      {h.from_status ? `${t(`expenses.${h.from_status}`).toUpperCase()} ➔ ` : `${t('expenses.created')} ➔ `}
                      {t(`expenses.${h.to_status}`).toUpperCase()}
                    </div>
                    <div className="text-xs text-textSecondary">{t('expenses.by')} {h.users?.name} {t('expenses.on')} {new Date(h.created_at).toLocaleString()}</div>
                    {h.comment && <div className="text-sm mt-1 bg-ground/50 p-2 rounded-md italic border border-brass/10">{h.comment}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
