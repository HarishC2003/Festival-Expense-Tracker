import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFestivalYear } from '../../context/FestivalYearContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent } from '../../components/ui/dialog';
import { CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { toast } from 'sonner';
import { SubmissionOverlay } from '../../components/shared/SubmissionOverlay';

export const ExpenseSubmissionPage: React.FC = () => {
  const { activeYear, isLocked } = useFestivalYear();
  const { activeGroupId, activeGroupRole } = useGroup();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomVendor, setIsCustomVendor] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    category_name: '',
    amount: '',
    paid_by: '',
    vendor_name: '',
    fund_source: 'committee',
    bill_available: false,
    payment_method_name: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!activeYear || !activeGroupId) return;
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 
        'Authorization': `Bearer ${session?.access_token}`,
        'X-Group-Id': activeGroupId || ''
      };
      
      const [catRes, memRes, venRes, payRes] = await Promise.all([
        fetch(`/api/master-data/expense_categories?yearId=${activeYear.id}`, { headers }),
        fetch(`/api/master-data/committee_members?yearId=${activeYear.id}`, { headers }),
        fetch(`/api/master-data/vendors?yearId=${activeYear.id}`, { headers }),
        fetch(`/api/master-data/payment_methods?yearId=${activeYear.id}`, { headers })
      ]);
      
      const cats = await catRes.json();
      const mems = await memRes.json();
      const vens = await venRes.json();
      const pays = await payRes.json();
      
      setCategories(cats);
      setMembers(mems);
      setVendors(vens);
      setPaymentMethods(pays);

      let defaultMember = mems.find((m: any) => m.user_id === user?.id || m.email === user?.email);
      
      if (!defaultMember && user?.email) {
        const newMemRes = await fetch(`/api/master-data/committee_members`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            festival_year_id: activeYear.id,
            name: user.email.split('@')[0],
            email: user.email,
            role_title: 'Member'
          })
        });
        if (newMemRes.ok) {
          const newMem = await newMemRes.json();
          mems.push(newMem);
          setMembers([...mems]);
          defaultMember = newMem;
        }
      }

      if (id) {
        try {
          const expRes = await fetch(`/api/expenses?yearId=${activeYear.id}`, { headers });
          if (expRes.ok) {
            const allExp = await expRes.json();
            const exp = allExp.find((e: any) => e.id === id);
            if (exp) {
              setFormData({
                category_name: exp.expense_categories?.name || '',
                amount: exp.amount?.toString() || '',
                paid_by: exp.paid_by || '',
                vendor_name: exp.vendors?.name || '',
                fund_source: exp.fund_source || 'committee',
                bill_available: exp.bill_available || false,
                payment_method_name: exp.payment_methods?.name || '',
                expense_date: exp.expense_date || new Date().toISOString().split('T')[0],
                description: exp.description || ''
              });
              if (exp.expense_categories?.name && !cats.some((c:any) => c.name === exp.expense_categories.name)) setIsCustomCategory(true);
              if (exp.vendors?.name && !vens.some((v:any) => v.name === exp.vendors.name)) setIsCustomVendor(true);
            }
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        if (defaultMember) {
          setFormData(prev => ({ ...prev, paid_by: defaultMember.id }));
        } else if (mems.length > 0) {
          setFormData(prev => ({ ...prev, paid_by: mems[0].id }));
        }
      }
    };
    fetchData();
  }, [activeYear, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeYear || isLocked) return;
    setIsSubmitting(true);

    if (formData.bill_available && !receiptFile) {
      toast.error(t('expenses.uploadAlert') || 'Please upload the bill');
      setIsSubmitting(false);
      return;
    }

    if (formData.bill_available && receiptFile) {
      const maxSize = 2 * 1024 * 1024; // 2 MB
      if (receiptFile.size > maxSize) {
        toast.error('File size must be below 2 MB');
        setIsSubmitting(false);
        return;
      }
    }

    let receipt_image_url = null;
    if (receiptFile) {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('receipts').upload(`${activeYear.id}/${fileName}`, receiptFile);
      if (!error && data) {
        receipt_image_url = supabase.storage.from('receipts').getPublicUrl(data.path).data.publicUrl;
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = id 
        ? `/api/expenses/${id}` 
        : `/api/expenses`;
      
      const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        },
        body: JSON.stringify({ 
          ...formData, 
          amount: Number(formData.amount),
          festival_year_id: activeYear.id, 
          ...(receipt_image_url ? { receipt_image_url } : {})
        })
      });
      if (res.ok) {
        setSuccessData({
          amount: formData.amount,
          description: formData.description || 'Expense',
          paid_by_name: members.find(m => m.id === formData.paid_by)?.name || formData.paid_by
        });
      } else {
        const errData = await res.json();
        toast.error(errData.error || t('expenses.failedSubmit'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('expenses.failedSubmit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SubmissionOverlay isSubmitting={isSubmitting} text={id ? "Updating Expense..." : "Adding Expense..."} />
      <div>
        <h2 className="text-3xl font-display font-bold text-brass tracking-tight">
          {id ? 'Edit Expense' : t('expenses.submitTitle')}
        </h2>
        <p className="text-muted-foreground">{t('expenses.submitDesc', { year: activeYear?.name || activeYear?.year || new Date().getFullYear() })}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('expenses.category')}</Label>
            {!isCustomCategory ? (
              <select 
                required 
                className="flex h-12 w-full border-b border-brass/30 bg-transparent px-4 py-2 text-base text-textPrimary focus-visible:outline-none focus-visible:border-brass transition-colors" 
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
                <option value="" disabled>{t('expenses.selectCategory')}</option>
                {Array.from(new Set(['Stage Decoration', 'Pooja Items', 'Audio & Lighting', 'Food (Annadhanam)', 'Printing & Banners', 'Transport', ...categories.map(c => c.name)])).map(name => (
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
                    if (!categories.find(c => c.name === formData.category_name)) {
                      setCategories([...categories, { id: 'temp', name: formData.category_name }]);
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
          <div className="space-y-2">
            <Label>{t('expenses.amount')} (₹)</Label>
            <Input type="text" required value={formData.amount ? Number(formData.amount).toLocaleString('en-IN') : ''} onChange={e => {
              const rawValue = e.target.value.replace(/,/g, '');
              if (!isNaN(Number(rawValue)) && rawValue !== ' ') {
                setFormData({...formData, amount: rawValue});
              }
            }} className="font-display font-bold text-3xl tabular-nums h-16 text-foreground drop-shadow-sm placeholder:text-muted-foreground/50" placeholder="0.00" />
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 z-20">
            <Label>Paid By</Label>
            <select 
              required
              className="flex h-12 w-full border-b border-brass/30 bg-transparent px-4 py-2 text-base text-textPrimary focus-visible:outline-none focus-visible:border-brass transition-colors"
              value={formData.paid_by}
              onChange={e => setFormData({...formData, paid_by: e.target.value})}
            >
              {members.map((m: any) => (
                <option key={m.id} value={m.id} className="bg-surface text-textPrimary">{m.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 z-20">
            <Label>Fund Source</Label>
            <select 
              required
              className="flex h-12 w-full border-b border-brass/30 bg-transparent px-4 py-2 text-base text-textPrimary focus-visible:outline-none focus-visible:border-brass transition-colors"
              value={formData.fund_source}
              onChange={e => setFormData({...formData, fund_source: e.target.value})}
            >
              <option value="committee" className="bg-surface text-textPrimary">Committee Fund</option>
              <option value="personal" className="bg-surface text-textPrimary">Personal Fund (Requires Reimbursement)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 z-20">
          <Label className="flex justify-between">
            <span>Vendor</span>
            <span className="text-xs text-brass cursor-pointer hover:underline" onClick={() => setIsCustomVendor(!isCustomVendor)}>
              {isCustomVendor ? 'Select Existing' : '+ Add New Vendor'}
            </span>
          </Label>
          {!isCustomVendor ? (
            <select 
              required
              className="flex h-12 w-full border-b border-brass/30 bg-transparent px-4 py-2 text-base text-textPrimary focus-visible:outline-none focus-visible:border-brass transition-colors"
              value={formData.vendor_name}
              onChange={e => {
                if (e.target.value === 'new') setIsCustomVendor(true);
                else setFormData({...formData, vendor_name: e.target.value});
              }}
            >
              <option value="" disabled className="bg-surface text-muted-foreground">Select Vendor...</option>
              {vendors.map((v: any) => (
                <option key={v.id} value={v.name} className="bg-surface text-textPrimary">{v.name}</option>
              ))}
              <option value="new" className="bg-surface text-brass font-medium">+ Add New Vendor</option>
            </select>
          ) : (
            <Input 
              type="text" 
              required
              placeholder="Enter vendor name..." 
              value={formData.vendor_name}
              onChange={e => setFormData({...formData, vendor_name: e.target.value})}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('expenses.paymentMethod')}</Label>
            <select required className="flex h-12 w-full border-b border-brass/30 bg-transparent px-4 py-2 text-base text-textPrimary focus-visible:outline-none focus-visible:border-brass transition-colors" value={formData.payment_method_name} onChange={e => setFormData({...formData, payment_method_name: e.target.value})}>
              <option value="" disabled>{t('expenses.selectMethod')}</option>
              <option value="Cash In Hand">Cash In Hand</option>
              <option value="Online (UPI/Bank)">Online (UPI/Bank)</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>{t('expenses.expenseDate')}</Label>
            <Input type="date" required max={new Date().toISOString().split('T')[0]} value={formData.expense_date} onChange={e => setFormData({...formData, expense_date: e.target.value})} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('expenses.description')} (Optional)</Label>
          <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>

        <div className="flex items-center space-x-2 border p-4 rounded-md">
          <Switch id="bill" checked={formData.bill_available} onCheckedChange={(v) => setFormData({...formData, bill_available: v})} />
          <Label htmlFor="bill">{t('expenses.billAvailable')}</Label>
        </div>

        {formData.bill_available && (
          <div className="space-y-2">
            <Label>{t('expenses.uploadReceipt')}</Label>
            <Input type="file" accept="image/*" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
          </div>
        )}

        <div className="bg-muted/50 p-3 rounded-md border text-sm text-muted-foreground flex items-center justify-between">
          <span>Recorded By:</span>
          <span className="font-medium text-foreground">{user?.email}</span>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || isLocked || activeGroupRole === 'viewer' || (id ? activeGroupRole !== 'owner' : false)}>
          {isSubmitting ? (id ? 'Updating...' : 'Submitting...') : (id ? 'Update Expense' : t('expenses.submitButton'))}
        </Button>
      </form>

      {/* Success Modal */}
      <SubmissionOverlay isSubmitting={isSubmitting} text={id ? 'Updating...' : 'Submitting...'} />
      <Dialog open={!!successData} onOpenChange={(open) => {
        if (!open) {
          setSuccessData(null);
          setTimeout(() => navigate('/expenses'), 300);
        }
      }}>
        <DialogContent className="max-w-sm text-center p-8 space-y-6 bg-ground border-white/10 shadow-2xl">
          <div className="mx-auto w-20 h-20 bg-positive/10 text-positive rounded-full flex items-center justify-center mb-4 ring-8 ring-positive/5">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">{id ? 'Updated!' : 'Recorded!'}</h2>
          <div className="bg-surface p-5 rounded-lg border border-white/5 space-y-3 shadow-inner">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</div>
              <div className="text-lg font-medium text-foreground">{successData?.description}</div>
            </div>
            <div className="h-px bg-white/5 w-full my-2"></div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid By</div>
              <div className="font-medium text-foreground">{successData?.paid_by_name}</div>
            </div>
            <div className="h-px bg-white/5 w-full my-2"></div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</div>
              <div className="text-4xl font-display font-bold text-kumkum drop-shadow-sm">₹{successData?.amount}</div>
            </div>
          </div>
          <Button className="w-full h-12 text-lg font-semibold" size="lg" onClick={() => {
            setSuccessData(null);
            setTimeout(() => navigate('/expenses'), 300);
          }}>Continue</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
