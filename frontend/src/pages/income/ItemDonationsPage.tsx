import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFestivalYear } from '../../context/FestivalYearContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Plus, CheckCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SubmissionOverlay } from '../../components/shared/SubmissionOverlay';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { useGroup } from '../../context/GroupContext';

export const ItemDonationsPage: React.FC = () => {
  const { activeYear, isLocked } = useFestivalYear();
  const { activeGroupId, activeGroupRole } = useGroup();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, description: string, variant?: 'danger' | 'default', onConfirm: () => void} | null>(null);
  
  // Options
  const [incomeCategories, setIncomeCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  const [formData, setFormData] = useState({ 
    donor_name: '', 
    item_name: '', 
    quantity: '', 
    unit_name: '', 
    estimated_value: '',
    category_name: '', 
    donation_date: new Date().toISOString().split('T')[0], 
    notes: '' 
  });

  const fetchData = async () => {
    if (!activeYear) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 
        'Authorization': `Bearer ${session?.access_token}`,
        'X-Group-Id': activeGroupId || ''
      };
      
      const [donRes, catRes, unitRes] = await Promise.all([
        fetch(`/api/income/item_donations?yearId=${activeYear.id}`, { headers }),
        fetch(`/api/master-data/income_categories?yearId=${activeYear.id}`, { headers }),
        fetch(`/api/master-data/units?yearId=${activeYear.id}`, { headers })
      ]);
      
      setDonations(await donRes.json());
      setIncomeCategories((await catRes.json()).filter((c: any) => c.type === 'item'));
      setUnits(await unitRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeYear || isLocked) return;
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = editingId 
        ? `/api/income/item_donations/${editingId}`
        : `/api/income/item_donations`;
        
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        },
        body: JSON.stringify({
          donor_name: formData.donor_name,
          item_name: formData.item_name,
          category_name: formData.category_name,
          donation_date: formData.donation_date,
          notes: formData.notes,
          festival_year_id: activeYear.id,
          quantity: Number(formData.quantity),
          unit_name: formData.unit_name,
          estimated_value: formData.estimated_value ? Number(formData.estimated_value) : undefined
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (!editingId) {
          setSuccessData({
            receipt_number: data.receipt_number,
            item_name: formData.item_name,
            donor_name: formData.donor_name
          });
        } else {
          toast.success(t('income.successRecorded', { receipt: data.receipt_number }) || 'Updated successfully');
        }
        setIsDialogOpen(false);
        setEditingId(null);
        setFormData({ donor_name: '', item_name: '', quantity: '', unit_name: '', estimated_value: '', category_name: '', donation_date: new Date().toISOString().split('T')[0], notes: '' });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(t('income.error', { error: err.error }));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('income.error', { error: 'Failed to submit' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (donation: any) => {
    setEditingId(donation.id);
    setFormData({
      donor_name: donation.donors?.name || '',
      item_name: donation.item_name || '',
      quantity: donation.quantity?.toString() || '',
      unit_name: donation.units?.abbreviation || donation.units?.name || '',
      estimated_value: donation.estimated_value?.toString() || '',
      category_name: donation.income_categories?.name || '',
      donation_date: donation.donation_date || new Date().toISOString().split('T')[0],
      notes: donation.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Donation',
      description: 'Are you sure you want to delete this donation?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(`/api/income/item_donations/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'X-Group-Id': activeGroupId || ''
            }
          });
          
          if (res.ok) {
            toast.success('Donation deleted successfully');
            fetchData();
          } else {
            const err = await res.json();
            toast.error(err.error || 'Failed to delete donation');
          }
        } catch (e) {
          console.error(e);
          toast.error('Failed to delete donation');
        }
      }
    });
  };

  if (loading) return <div className="p-8 text-primary flex items-center justify-center h-64">{t('income.loading')}</div>;

  return (
    <div className="space-y-6">
      {isSubmitting && <SubmissionOverlay isSubmitting={true} text="Saving Item Donation..." />}
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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">{t('income.itemTitle')}</h2>
          <p className="text-muted-foreground">{t('income.itemDesc', { year: activeYear?.name || activeYear?.year || new Date().getFullYear() })}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setFormData({ donor_name: '', item_name: '', quantity: '', unit_name: '', estimated_value: '', category_name: '', donation_date: new Date().toISOString().split('T')[0], notes: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button disabled={isLocked || activeGroupRole === 'viewer'}><Plus className="mr-2 h-4 w-4" /> {t('income.addItemDonation')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{t('income.recordItem')}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('income.donor')}</Label>
                <Input type="text" required placeholder="Enter donor name..." value={formData.donor_name} onChange={e => setFormData({...formData, donor_name: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <Label>{t('income.itemName')}</Label>
                <Input required value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} placeholder={t('income.itemNamePlaceholder')} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>{t('income.quantity')}</Label><Input type="number" step="0.01" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} /></div>
                <div className="space-y-2">
                  <Label>{t('income.unit')}</Label>
                  {!isCustomUnit ? (
                    <select 
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                      value={formData.unit_name} 
                      onChange={e => {
                        if (e.target.value === 'ADD_NEW') {
                          setIsCustomUnit(true);
                          setFormData({...formData, unit_name: ''});
                        } else {
                          setFormData({...formData, unit_name: e.target.value});
                        }
                      }}
                    >
                      <option value="">{t('income.noUnit')}</option>
                      {Array.from(new Set(['kg', 'liters', 'boxes', 'pieces', 'grams', ...units.map(u => u.name)])).map(name => (
                        <option key={name as string} value={name as string}>{name as string}</option>
                      ))}
                      <option value="ADD_NEW">+ Add New Unit...</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <Input 
                        type="text" 
                        required 
                        autoFocus
                        placeholder="Type new unit..." 
                        value={formData.unit_name} 
                        onChange={e => setFormData({...formData, unit_name: e.target.value})} 
                      />
                      <Button type="button" variant="default" onClick={() => {
                        if (formData.unit_name.trim()) {
                          if (!units.find(u => u.name === formData.unit_name)) {
                            setUnits([...units, { id: 'temp', name: formData.unit_name }]);
                          }
                          setIsCustomUnit(false);
                        }
                      }}>Done</Button>
                      <Button type="button" variant="outline" onClick={() => {
                        setIsCustomUnit(false);
                        setFormData({...formData, unit_name: ''});
                      }}>Cancel</Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2"><Label>{t('income.estValue')}</Label><Input type="number" step="0.01" value={formData.estimated_value} onChange={e => setFormData({...formData, estimated_value: e.target.value})} /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t('income.date')}</Label><Input type="date" required max={new Date().toISOString().split('T')[0]} value={formData.donation_date} onChange={e => setFormData({...formData, donation_date: e.target.value})} /></div>
                <div className="space-y-2">
                  <Label>{t('income.category')}</Label>
                  {!isCustomCategory ? (
                    <select 
                      required 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                      value={formData.category_name} 
                      onChange={e => {
                        if (e.target.value === 'ADD_NEW') {
                          setIsCustomCategory(true);
                          setFormData({...formData, category_name: ''});
                        } else {
                          setFormData({...formData, category_name: e.target.value});
                        }
                      }}
                    >
                      <option value="" disabled>{t('income.selectCategory') || 'Select Category...'}</option>
                      {Array.from(new Set(['Annadhanam', 'Pooja Items', 'Decorations', 'Prasadam', 'Event Equipment', ...incomeCategories.map(c => c.name)])).map(name => (
                        <option key={name as string} value={name as string}>{name as string}</option>
                      ))}
                      <option value="ADD_NEW">+ Add New Category...</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <Input 
                        type="text" 
                        required 
                        autoFocus
                        placeholder="Type new category..." 
                        value={formData.category_name} 
                        onChange={e => setFormData({...formData, category_name: e.target.value})} 
                      />
                      <Button type="button" variant="default" onClick={() => {
                        if (formData.category_name.trim()) {
                          if (!incomeCategories.find(c => c.name === formData.category_name)) {
                            setIncomeCategories([...incomeCategories, { id: 'temp', name: formData.category_name }]);
                          }
                          setIsCustomCategory(false);
                        }
                      }}>Done</Button>
                      <Button type="button" variant="outline" onClick={() => {
                        setIsCustomCategory(false);
                        setFormData({...formData, category_name: ''});
                      }}>Cancel</Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2"><Label>{t('income.notes')}</Label><Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
              
              <div className="bg-muted/50 p-3 rounded-md border text-sm text-muted-foreground flex items-center justify-between">
                <span>Recorded By:</span>
                <span className="font-medium text-foreground">{user?.email}</span>
              </div>
              
              <Button type="submit" className="w-full">{t('income.submitItem')}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (<div className="flex justify-center p-8 text-primary">{t('income.loading')}</div>) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('income.receipt')}</TableHead>
                <TableHead>Date / Time Logged</TableHead>
                <TableHead>{t('income.donor')}</TableHead>
                <TableHead>{t('income.item')}</TableHead>
                <TableHead>{t('income.qty')}</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead className="text-right">{t('income.estValue')}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('income.noItemFound')}</TableCell></TableRow>}
              {donations.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.receipt_number}</TableCell>
                  <TableCell className="whitespace-nowrap">{new Date(d.created_at).toLocaleString()}</TableCell>
                  <TableCell>{d.donors?.name}</TableCell>
                  <TableCell>{d.item_name}</TableCell>
                  <TableCell>{d.quantity} {d.units?.abbreviation}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{d.users?.email}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {d.estimated_value ? `₹${d.estimated_value}` : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTimeout(() => handleEdit(d), 10)} disabled={isLocked || activeGroupRole !== 'owner'}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTimeout(() => handleDelete(d.id), 10)} disabled={isLocked || activeGroupRole !== 'owner'} className="text-red-500">
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
      )}

      {/* Success Modal */}
      <Dialog open={!!successData} onOpenChange={(open) => !open && setSuccessData(null)}>
        <DialogContent className="max-w-sm text-center p-8 space-y-6 bg-ground border-white/10 shadow-2xl">
          <div className="mx-auto w-20 h-20 bg-positive/10 text-positive rounded-full flex items-center justify-center mb-4 ring-8 ring-positive/5">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">Recorded!</h2>
          <div className="bg-surface p-5 rounded-lg border border-white/5 space-y-3 shadow-inner">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receipt Number</div>
              <div className="font-mono text-lg text-brass font-bold">{successData?.receipt_number}</div>
            </div>
            <div className="h-px bg-white/5 w-full my-2"></div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Donor</div>
              <div className="text-lg font-medium text-foreground">{successData?.donor_name}</div>
            </div>
            <div className="h-px bg-white/5 w-full my-2"></div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item</div>
              <div className="text-2xl font-display font-bold text-positive drop-shadow-sm">{successData?.item_name}</div>
            </div>
          </div>
          <Button className="w-full h-12 text-lg font-semibold" size="lg" onClick={() => setSuccessData(null)}>Close</Button>
        </DialogContent>
      </Dialog>

      <SubmissionOverlay isSubmitting={isSubmitting} text={editingId ? 'Updating...' : 'Submitting...'} />
      <ConfirmDialog
        isOpen={confirmConfig?.isOpen || false}
        title={confirmConfig?.title || ''}
        description={confirmConfig?.description || ''}
        variant={confirmConfig?.variant}
        processingText={confirmConfig?.variant === 'danger' ? 'Deleting...' : 'Processing...'}
        onCancel={() => setConfirmConfig(prev => prev ? { ...prev, isOpen: false } : null)}
        onConfirm={confirmConfig?.onConfirm || (() => {})}
      />
    </div>
  );
};
