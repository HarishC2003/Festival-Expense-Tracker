import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useFestivalYear } from '../../context/FestivalYearContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BalanceScale } from '../../components/dashboard/BalanceScale';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, Receipt, Users, UserCheck, ImageIcon } from 'lucide-react';
import { PageLoader } from '../../components/states/PageLoader';
import { ErrorState } from '../../components/states/ErrorState';
import { useGroup } from '../../context/GroupContext';

export const DashboardPage: React.FC = () => {
  const { activeYear } = useFestivalYear();
  const { activeGroupId } = useGroup();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = async () => {
    if (!activeYear) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/dashboard/summary?yearId=${activeYear.id}`, {
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        }
      });
      if (res.ok) {
        setData(await res.json());
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (e: any) {
      console.error(e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [activeYear]);

  if (loading) return <PageLoader message="Loading dashboard..." className="h-[80vh]" />;
  if (error) return <ErrorState onRetry={fetchSummary} className="h-[80vh]" />;
  if (activeYear && !data) return null;

  const summary = data?.summary || { totalCash: 0, totalExpense: 0, balance: 0, totalItemValue: 0, pendingExpense: 0, committeeCount: 0, donorCount: 0, photoCount: 0 };
  const charts = data?.charts || { collectionTrend: [] };
  const recentTransactions = data?.recentTransactions || [];
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight text-[#F1F5F9]">{t('dashboard.overview')}</h2>
          <p className="text-[#94A3B8] mt-1">{t('dashboard.overviewDesc', { year: activeYear?.name || activeYear?.year || new Date().getFullYear() })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="border-green-500/20 text-green-400 hover:bg-green-500/10" onClick={() => navigate('/income/cash')}>
            + Add Income
          </Button>
          <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10" onClick={() => navigate('/expenses/new')}>
            - Add Expense
          </Button>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5 mt-6">
        
        {/* Balance Scale: 2x2 on large screens */}
        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2 lg:row-span-2">
          <BalanceScale totalIncome={summary.totalCash} totalExpense={summary.totalExpense} />
        </motion.div>

        {/* Small Stat Cells: 1x1 each */}
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
          <Card className="h-full hover:-translate-y-1 hover:border-brass/40 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brass/10 flex items-center justify-center text-brass">
                  <Package size={16} />
                </div>
                <CardTitle className="text-sm font-medium">{t('dashboard.totalItemValue')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent><div className="text-2xl lg:text-3xl font-display font-bold tabular-nums text-textPrimary">₹{summary.totalItemValue.toLocaleString()}</div></CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
          <Card className="h-full border-t-2 border-t-kumkum bg-surface hover:-translate-y-1 hover:border-kumkum/60 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-kumkum/10 flex items-center justify-center text-kumkum">
                  <Receipt size={16} />
                </div>
                <CardTitle className="text-sm font-medium text-kumkum">{t('dashboard.pendingExpenses')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent><div className="text-2xl lg:text-3xl font-display font-bold tabular-nums text-kumkum">₹{summary.pendingExpense.toLocaleString()}</div></CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
          <Card className="h-full hover:-translate-y-1 hover:border-brass/40 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brass/10 flex items-center justify-center text-brass">
                  <UserCheck size={16} />
                </div>
                <CardTitle className="text-sm font-medium">Group Members</CardTitle>
              </div>
            </CardHeader>
            <CardContent><div className="text-2xl lg:text-3xl font-display font-bold tabular-nums text-textPrimary">{summary.committeeCount}</div></CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-1">
          <Card className="h-full hover:-translate-y-1 hover:border-brass/40 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brass/10 flex items-center justify-center text-brass">
                  <ImageIcon size={16} />
                </div>
                <CardTitle className="text-sm font-medium">{t('dashboard.galleryPhotos')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent><div className="text-2xl lg:text-3xl font-display font-bold tabular-nums text-textPrimary">{summary.photoCount}</div></CardContent>
          </Card>
        </motion.div>

        {/* Daily Trend Chart: spans 4 cols to fill the rest of the second row */}
        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-4 lg:row-span-1">
          <Card className="h-full hover:border-brass/40 transition-colors duration-300">
            <CardHeader className="pb-6">
              <CardTitle className="text-brass">{t('dashboard.dailyTrend')}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="h-[200px] lg:h-[220px]">
                {charts.collectionTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.collectionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(176, 141, 63, 0.1)" vertical={false} />
                      <XAxis dataKey="date" stroke="#9C9384" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9C9384" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1E1B18', borderColor: 'rgba(176, 141, 63, 0.3)', color: '#F1F5F9', borderRadius: '4px' }} 
                        itemStyle={{ color: '#D9A441' }} 
                      />
                      <Area type="monotone" dataKey="income" name="Income" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 6, fill: '#22c55e', stroke: '#16130F', strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="expense" name="Expense" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" activeDot={{ r: 6, fill: '#ef4444', stroke: '#16130F', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-textSecondary">{t('dashboard.noData')}</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions: full width */}
        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-6">
          <Card className="h-full hover:border-brass/40 transition-colors duration-300">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-brass">{t('dashboard.recentTransactions')}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')} className="text-xs text-brass hover:text-brass/80 hover:bg-brass/10">
                {t('dashboard.viewAll')}
              </Button>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0 h-[250px] overflow-y-auto">
              {recentTransactions.length === 0 ? (
                <div className="flex h-full items-center justify-center text-textSecondary text-sm border border-dashed border-brass/20 rounded-md">
                  {t('dashboard.noData')}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((tx: any) => (
                    <div key={tx.id} className="flex justify-between items-center p-3 rounded bg-ground border border-brass/10 hover:border-brass/30 transition-colors">
                      <div>
                        <p className="font-semibold text-textPrimary text-sm">{tx.description}</p>
                        <p className="text-xs text-textSecondary mt-0.5">
                          {tx.person} &bull; {new Date(tx.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`font-bold tabular-nums text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-kumkum'}`}>
                        {tx.type === 'income' ? '+' : '-'}₹{tx.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};
