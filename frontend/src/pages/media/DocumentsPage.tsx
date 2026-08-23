import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFestivalYear } from '../../context/FestivalYearContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, CheckCircle } from 'lucide-react';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useGroup } from '../../context/GroupContext';
import { SubmissionOverlay } from '../../components/shared/SubmissionOverlay';
import { toast } from 'sonner';

export const DocumentsPage: React.FC = () => {
  const { activeYear, isLocked } = useFestivalYear();
  const { activeGroupId, activeGroupRole } = useGroup();
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<any[]>([]);
  const [file, setFile] = useState<File|null>(null);
  const [category, setCategory] = useState('other');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const [editDoc, setEditDoc] = useState<any>(null);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  const fetchDocs = async () => {
    if (!activeYear) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`http://localhost:3001/api/media/documents?yearId=${activeYear.id}`, { 
      headers: { 
        'Authorization': `Bearer ${session?.access_token}`,
        'X-Group-Id': activeGroupId || ''
      } 
    });
    if (res.ok) setDocuments(await res.json());
  };

  useEffect(() => { fetchDocs(); }, [activeYear]);

  const handleUpload = async () => {
    if (!file || !activeYear) return;
    setIsSubmitting(true);
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === undefined) return 0;
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      const { data, error } = await supabase.storage.from('documents').upload(`${activeYear.id}/${Math.random()}_${file.name}`, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      await new Promise(r => setTimeout(r, 400));
      setUploadProgress(undefined);
      if (!error && data) {
        const url = supabase.storage.from('documents').getPublicUrl(data.path).data.publicUrl;
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`http://localhost:3001/api/media/documents`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${session?.access_token}`,
            'X-Group-Id': activeGroupId || ''
          },
          body: JSON.stringify({ festival_year_id: activeYear.id, category, title: title || file.name, file_url: url })
        });
        if (res.ok) {
          toast.success(t('media.documentUploaded') || 'Document uploaded successfully');
          setTitle('');
          setFile(null);
          fetchDocs();
        } else {
          toast.error('Failed to record document upload');
        }
      } else {
        toast.error('Failed to upload file to storage');
      }
    } catch (e) {
      toast.error('Failed to upload document');
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(undefined);
      setIsSubmitting(false);
    }
  };


  const handleEditDocSubmit = async () => {
    if (!editDoc) return;
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3001/api/media/documents/${editDoc.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        },
        body: JSON.stringify({ festival_year_id: activeYear?.id, category, title })
      });
      if (res.ok) {
        toast.success('Document updated successfully');
        setEditDoc(null);
        setTitle('');
        setCategory('other');
        fetchDocs();
      } else {
        toast.error('Failed to update document');
      }
    } catch (e) {
      toast.error('Failed to update document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3001/api/media/documents/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        }
      });
      if (res.ok) {
        toast.success('Document deleted successfully');
        fetchDocs();
      } else {
        toast.error('Failed to delete document');
      }
    } catch (e) {
      toast.error('Failed to delete document');
    } finally {
      setIsSubmitting(false);
      setConfirmDeleteDocId(null);
    }
  };

  if (!activeYear) return <div className="p-8">{t('media.noActiveYear')}</div>;

  return (
    <div className="space-y-6">
      <SubmissionOverlay isSubmitting={isSubmitting} progress={uploadProgress} text={uploadProgress !== undefined ? "Uploading Document..." : "Submitting..."} />
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('media.docsTitle')}</h2>
          <p className="text-muted-foreground">{t('media.docsDesc', { year: activeYear?.name || activeYear?.year || new Date().getFullYear() })}</p>
        </div>
        <Dialog>
          <DialogTrigger asChild><Button disabled={isLocked || activeGroupRole === 'viewer'}>{t('media.uploadDoc')}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('media.uploadDoc')}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder={t('media.titlePlaceholder')} value={title} onChange={e => setTitle(e.target.value)} />
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="bill">{t('media.bill')}</option>
                <option value="invoice">{t('media.invoice')}</option>
                <option value="permission_letter">{t('media.permissionLetter')}</option>
                <option value="certificate">{t('media.certificate')}</option>
                <option value="other">{t('media.other')}</option>
              </select>
              <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
              <Button onClick={handleUpload}>{t('media.upload')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow><TableHead>{t('media.date')}</TableHead><TableHead>{t('media.title')}</TableHead><TableHead>{t('media.category')}</TableHead><TableHead>{t('media.action')}</TableHead><TableHead></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {documents.map(d => (
              <TableRow key={d.id}>
                <TableCell>{new Date(d.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{d.title}</TableCell>
                <TableCell className="uppercase text-xs">{t(`media.${d.category.replace('_', 'Letter').replace('permissionLetter', 'permissionLetter')}`)}</TableCell>
                <TableCell><Button variant="link" onClick={() => window.open(d.file_url + '?download=', '_blank')}>{t('media.downloadView')}</Button></TableCell>
                <TableCell>
                  {activeGroupRole === 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setTimeout(() => { setEditDoc(d); setTitle(d.title); setCategory(d.category); }, 10); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setTimeout(() => setConfirmDeleteDocId(d.id), 10); }} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editDoc} onOpenChange={(open) => { if (!open) { setEditDoc(null); setTitle(''); setCategory('other'); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder={t('media.titlePlaceholder')} value={title} onChange={e => setTitle(e.target.value)} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="bill">{t('media.bill')}</option>
              <option value="invoice">{t('media.invoice')}</option>
              <option value="permission_letter">{t('media.permissionLetter')}</option>
              <option value="certificate">{t('media.certificate')}</option>
              <option value="other">{t('media.other')}</option>
            </select>
            <Button onClick={handleEditDocSubmit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!successData} onOpenChange={(open) => !open && setSuccessData(null)}>
        <DialogContent className="max-w-sm text-center p-8 space-y-6 bg-ground border-white/10 shadow-2xl">
          <div className="mx-auto w-20 h-20 bg-positive/10 text-positive rounded-full flex items-center justify-center mb-4 ring-8 ring-positive/5">
             <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">Uploaded!</h2>
          <div className="bg-surface p-5 rounded-lg border border-white/5 space-y-3 shadow-inner">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Document</div>
              <div className="text-lg font-medium text-foreground">{successData?.title}</div>
            </div>
          </div>
          <Button className="w-full h-12 text-lg font-semibold" size="lg" onClick={() => setSuccessData(null)}>Continue</Button>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!confirmDeleteDocId}
        title="Delete Document"
        description="Are you sure you want to delete this document?"
        variant="danger"
        onConfirm={() => confirmDeleteDocId && handleDeleteDoc(confirmDeleteDocId)}
        onCancel={() => setConfirmDeleteDocId(null)}
      />
    </div>
  );
};
