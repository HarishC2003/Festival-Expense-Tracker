import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFestivalYear } from '../../context/FestivalYearContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGroup } from '../../context/GroupContext';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  description: string;
  person: string;
}

export const TransactionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { activeYear } = useFestivalYear();
  const { user } = useAuth();
  const { activeGroupId } = useGroup();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = async () => {
    if (!activeYear) return;
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      let url = `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/dashboard/transactions?yearId=${activeYear.id}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [activeYear, startDate, endDate]);

  const filteredTransactions = transactions.filter(tx => 
    tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.person.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a: any, b: any) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-brass tracking-tight">{t('transactions.title')}</h1>
          <p className="text-textSecondary mt-1">{t('transactions.desc', { year: activeYear?.year || activeYear?.name || new Date().getFullYear() })}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
              <Input
                placeholder={t('transactions.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-ground border-brass/20 focus-visible:ring-brass/30"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-ground px-3 py-1.5 rounded-md border border-brass/20">
                <Filter className="h-4 w-4 text-textSecondary" />
                <span className="text-sm text-textSecondary font-medium">{t('transactions.filterDates')}</span>
              </div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto bg-ground border-brass/20"
                placeholder="Start Date"
              />
              <span className="text-textSecondary text-sm">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto bg-ground border-brass/20"
                placeholder="End Date"
              />
              {(startDate || endDate) && (
                <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }} className="text-xs text-kumkum">
                  {t('transactions.clear')}
                </Button>
              )}
            </div>
      </div>

      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
                <TableRow className="border-brass/10 hover:bg-transparent">
                  <TableHead className="font-semibold text-brass">{t('transactions.date')}</TableHead>
                  <TableHead className="font-semibold text-brass">{t('transactions.description')}</TableHead>
                  <TableHead className="font-semibold text-brass">{t('transactions.person')}</TableHead>
                  <TableHead className="font-semibold text-brass">{t('transactions.type')}</TableHead>
                  <TableHead className="text-right font-semibold text-brass">{t('transactions.amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-textSecondary">{t('transactions.loading')}</TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-textSecondary">{t('transactions.noData')}</TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id} className="border-brass/10 hover:bg-brass/5">
                      <TableCell className="text-textSecondary">{new Date(tx.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium text-textPrimary">{tx.description}</TableCell>
                      <TableCell className="text-textSecondary">{tx.person}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tx.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {tx.type === 'income' ? t('categories.income') : t('categories.expense')}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right font-bold tabular-nums ${tx.type === 'income' ? 'text-green-600' : 'text-kumkum'}`}>
                        {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
