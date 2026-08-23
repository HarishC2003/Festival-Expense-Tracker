import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useGroup } from '../../context/GroupContext';

export const DonorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { activeGroupId } = useGroup();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonor = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/income/donors/${id}/history`, {
          headers: { 
            'Authorization': `Bearer ${session?.access_token}`,
            'X-Group-Id': activeGroupId || ''
          }
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDonor();
  }, [id]);

  if (loading) return <div>{t('income.donorProfileLoading')}</div>;
  if (!data || !data.donor) return <div>{t('income.donorNotFound')}</div>;

  const totalCash = data.cash.reduce((acc: number, d: any) => acc + Number(d.amount), 0);
  const totalItemValue = data.items.reduce((acc: number, d: any) => acc + Number(d.estimated_value || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{data.donor.name}</h2>
          <p className="text-muted-foreground">{data.donor.phone} • {data.donor.address}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('income.lifetimeCash')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">₹{totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('income.lifetimeItem')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">₹{totalItemValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cash" className="w-full">
        <TabsList>
          <TabsTrigger value="cash">{t('income.cashHistory', { count: data.cash.length })}</TabsTrigger>
          <TabsTrigger value="items">{t('income.itemHistory', { count: data.items.length })}</TabsTrigger>
        </TabsList>
        <TabsContent value="cash" className="mt-4">
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('income.year')}</TableHead>
                  <TableHead>{t('income.date')}</TableHead>
                  <TableHead>{t('income.receipt')}</TableHead>
                  <TableHead>{t('income.category')}</TableHead>
                  <TableHead className="text-right">{t('income.amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cash.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t('income.noCashFound')}</TableCell></TableRow>}
                {data.cash.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.festival_years?.year}</TableCell>
                    <TableCell>{new Date(d.donation_date).toLocaleDateString()}</TableCell>
                    <TableCell>{d.receipt_number}</TableCell>
                    <TableCell>{d.income_categories?.name}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">₹{d.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="items" className="mt-4">
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('income.year')}</TableHead>
                  <TableHead>{t('income.date')}</TableHead>
                  <TableHead>{t('income.receipt')}</TableHead>
                  <TableHead>{t('income.item')}</TableHead>
                  <TableHead>{t('income.qty')}</TableHead>
                  <TableHead className="text-right">{t('income.estValue')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('income.noItemFound')}</TableCell></TableRow>}
                {data.items.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.festival_years?.year}</TableCell>
                    <TableCell>{new Date(d.donation_date).toLocaleDateString()}</TableCell>
                    <TableCell>{d.receipt_number}</TableCell>
                    <TableCell>{d.item_name}</TableCell>
                    <TableCell>{d.quantity} {d.units?.abbreviation}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{d.estimated_value ? `₹${d.estimated_value}` : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
