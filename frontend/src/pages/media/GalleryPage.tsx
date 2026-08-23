import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFestivalYear } from '../../context/FestivalYearContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useGroup } from '../../context/GroupContext';
import { SubmissionOverlay } from '../../components/shared/SubmissionOverlay';
import { toast } from 'sonner';
import { Trash2, Download, MoreVertical, Edit, CheckCircle, CheckSquare, Square, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';

export const GalleryPage: React.FC = () => {
  const { activeYear, isLocked } = useFestivalYear();
  const { activeGroupId, activeGroupRole } = useGroup();
  const { t } = useTranslation();
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteAlbumId, setConfirmDeleteAlbumId] = useState<string | null>(null);
  const [editAlbum, setEditAlbum] = useState<any>(null);

  const fetchAlbums = async () => {
    if (!activeYear) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`http://localhost:3001/api/media/albums?yearId=${activeYear.id}`, { 
      headers: { 
        'Authorization': `Bearer ${session?.access_token}`,
        'X-Group-Id': activeGroupId || ''
      } 
    });
    if (res.ok) setAlbums(await res.json());
  };

  const fetchItems = async (albumId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`http://localhost:3001/api/media/gallery?albumId=${albumId}`, { 
      headers: { 
        'Authorization': `Bearer ${session?.access_token}`,
        'X-Group-Id': activeGroupId || ''
      } 
    });
    if (res.ok) setItems(await res.json());
  };

  useEffect(() => { fetchAlbums(); }, [activeYear]);
  useEffect(() => { if (selectedAlbum) { fetchItems(selectedAlbum.id); setIsSelectionMode(false); setSelectedImageIds([]); } }, [selectedAlbum]);

  const [newAlbumName, setNewAlbumName] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);

  const handleCreateAlbum = async () => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3001/api/media/albums`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        },
        body: JSON.stringify({ festival_year_id: activeYear?.id, name: newAlbumName })
      });
      if (res.ok) {
        toast.success(t('media.albumCreated') || 'Album created successfully');
        setNewAlbumName('');
        fetchAlbums();
      } else {
        toast.error('Failed to create album');
      }
    } catch (e) {
      toast.error('Failed to create album');
    } finally {
      setUploadProgress(undefined);
      setIsSubmitting(false);
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0 || !selectedAlbum) return;
    setIsSubmitting(true);
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === undefined) return 0;
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);

    let successCount = 0;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      for (const file of uploadFiles) {
        const { data, error } = await supabase.storage.from('gallery').upload(`${activeYear?.id}/${selectedAlbum.id}/${Math.random()}_${file.name}`, file);
        if (!error && data) {
          const url = supabase.storage.from('gallery').getPublicUrl(data.path).data.publicUrl;
          const res = await fetch(`http://localhost:3001/api/media/gallery`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': `Bearer ${session?.access_token}`,
              'X-Group-Id': activeGroupId || ''
            },
            body: JSON.stringify({ festival_year_id: activeYear?.id, album_id: selectedAlbum.id, type: 'photo', file_url: url })
          });
          if (res.ok) successCount++;
        }
      }
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      await new Promise(r => setTimeout(r, 400));
      setUploadProgress(undefined);
      
      if (successCount > 0) {
        setSuccessData({ count: successCount });
        setUploadFiles([]);
        fetchItems(selectedAlbum.id);
      } else {
        toast.error('Failed to upload photos');
      }
    } catch (e) {
      toast.error('Failed to upload photos');
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(undefined);
      setIsSubmitting(false);
    }
  };

  
  const handleBulkDelete = async () => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      for (const id of selectedImageIds) {
        await fetch(`http://localhost:3001/api/media/gallery/${id}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${session?.access_token}`,
            'X-Group-Id': activeGroupId || ''
          }
        });
      }
      
      toast.success('Photos deleted successfully');
      setItems(items.filter(i => !selectedImageIds.includes(i.id)));
      setSelectedImageIds([]);
      setIsSelectionMode(false);
    } catch (e) {
      toast.error('Failed to delete some photos');
    } finally {
      setIsSubmitting(false);
      setConfirmDeleteId(null);
    }
  };

  const handleBulkDownload = () => {
    const selectedItems = items.filter(i => selectedImageIds.includes(i.id));
    selectedItems.forEach((item, index) => {
      setTimeout(() => {
        window.open(item.file_url + '?download=', '_blank');
      }, index * 200); // Stagger downloads slightly to prevent browser blocking
    });
    setSelectedImageIds([]);
    setIsSelectionMode(false);
  };

  const handleDeleteImage = async (id: string) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3001/api/media/gallery/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        }
      });
      if (res.ok) {
        toast.success('Photo deleted successfully');
        setItems(items.filter(i => i.id !== id));
        setSelectedImage(null);
      } else {
        toast.error('Failed to delete photo');
      }
    } catch (e) {
      toast.error('Failed to delete photo');
    } finally {
      setIsSubmitting(false);
      setConfirmDeleteId(null);
    }
  };


  const handleEditAlbumSubmit = async () => {
    if (!editAlbum) return;
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3001/api/media/albums/${editAlbum.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        },
        body: JSON.stringify({ name: newAlbumName, festival_year_id: activeYear?.id })
      });
      if (res.ok) {
        toast.success('Album updated successfully');
        setEditAlbum(null);
        setNewAlbumName('');
        fetchAlbums();
      } else {
        toast.error('Failed to update album');
      }
    } catch (e) {
      toast.error('Failed to update album');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3001/api/media/albums/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        }
      });
      if (res.ok) {
        toast.success('Album deleted successfully');
        fetchAlbums();
      } else {
        toast.error('Failed to delete album');
      }
    } catch (e) {
      toast.error('Failed to delete album');
    } finally {
      setIsSubmitting(false);
      setConfirmDeleteAlbumId(null);
    }
  };

  if (!activeYear) return <div className="p-8">{t('media.noActiveYear')}</div>;

  return (
    <div className="space-y-6">
      <SubmissionOverlay isSubmitting={isSubmitting} progress={uploadProgress} text={uploadProgress !== undefined ? "Uploading Photo..." : "Submitting..."} />
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('media.galleryTitle')}</h2>
          <p className="text-muted-foreground">{selectedAlbum ? selectedAlbum.name : t('media.galleryDesc', { year: activeYear?.name || activeYear?.year || new Date().getFullYear() })}</p>
        </div>
        {selectedAlbum ? (
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setSelectedAlbum(null)}>{t('media.backToAlbums')}</Button>
            <Dialog>
              {items.length > 0 && (
              <Button variant={isSelectionMode ? "secondary" : "outline"} onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedImageIds([]);
              }}>
                {isSelectionMode ? 'Cancel' : 'Select'}
              </Button>
            )}
            <DialogTrigger asChild><Button disabled={isLocked || activeGroupRole === 'viewer'}>{t('media.uploadPhoto')}</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t('media.uploadTo', { name: selectedAlbum.name })}</DialogTitle></DialogHeader>
                <Input type="file" accept="image/*" multiple onChange={e => setUploadFiles(Array.from(e.target.files || []))} />
                <Button onClick={handleUpload}>{t('media.upload')}</Button>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <Dialog>
            <DialogTrigger asChild><Button disabled={isLocked || activeGroupRole === 'viewer'}>{t('media.createAlbum')}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('media.newAlbum')}</DialogTitle></DialogHeader>
              <Input value={newAlbumName} onChange={e => setNewAlbumName(e.target.value)} placeholder={t('media.albumName')} />
              <Button onClick={handleCreateAlbum}>{t('media.create')}</Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!selectedAlbum ? (
        <div className="grid grid-cols-4 gap-4">
          {albums.map(a => (
            <Card key={a.id} className="cursor-pointer hover:bg-muted relative group" onClick={() => setSelectedAlbum(a)}>
              <CardContent className="p-6 flex items-center justify-center h-32 text-xl font-bold">{a.name}</CardContent>
              {activeGroupRole === 'owner' && (
                <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/80"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setTimeout(() => { setEditAlbum(a); setNewAlbumName(a.name); }, 10); }}><Edit className="mr-2 h-4 w-4" /> Edit Name</DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setTimeout(() => setConfirmDeleteAlbumId(a.id), 10); }} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" /> Delete Album</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {items.map(i => (
            <div key={i.id} className="border rounded-md overflow-hidden aspect-square cursor-pointer hover:opacity-80 transition-opacity relative group" onClick={() => {
              if (isSelectionMode) {
                if (selectedImageIds.includes(i.id)) {
                  setSelectedImageIds(selectedImageIds.filter(id => id !== i.id));
                } else {
                  setSelectedImageIds([...selectedImageIds, i.id]);
                }
              } else {
                setSelectedImage(i);
              }
            }}>
              <img src={i.file_url} className={`w-full h-full object-cover ${isSelectionMode && selectedImageIds.includes(i.id) ? 'scale-90 opacity-80' : ''} transition-all`} />
              {isSelectionMode && (
                <div className="absolute top-2 right-2">
                  {selectedImageIds.includes(i.id) ? (
                    <CheckSquare className="w-6 h-6 text-primary bg-background rounded-sm" />
                  ) : (
                    <Square className="w-6 h-6 text-white drop-shadow-md" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-white/10">
            <div className="relative w-full h-[80vh] flex items-center justify-center">
              <img src={selectedImage.file_url} className="max-w-full max-h-full object-contain" />
            </div>
            <div className="absolute top-4 left-4 flex gap-2">
              <Button variant="secondary" size="icon" className="rounded-full opacity-70 hover:opacity-100" onClick={() => window.open(selectedImage.file_url + '?download=', '_blank')}>
                <Download className="w-5 h-5" />
              </Button>
              <Button variant="destructive" size="icon" className="rounded-full opacity-70 hover:opacity-100" disabled={isLocked || activeGroupRole !== 'owner'} onClick={() => setConfirmDeleteId(selectedImage.id)}>
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      
      <Dialog open={!!editAlbum} onOpenChange={(open) => { if (!open) { setEditAlbum(null); setNewAlbumName(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Album</DialogTitle></DialogHeader>
          <Input value={newAlbumName} onChange={e => setNewAlbumName(e.target.value)} placeholder="Album Name" />
          <Button onClick={handleEditAlbumSubmit}>Save Changes</Button>
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
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Photos Added</div>
              <div className="text-4xl font-display font-bold text-kumkum drop-shadow-sm">{successData?.count}</div>
            </div>
          </div>
          <Button className="w-full h-12 text-lg font-semibold" size="lg" onClick={() => setSuccessData(null)}>Continue</Button>
        </DialogContent>
      </Dialog>

      
      {isSelectionMode && selectedImageIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-white/10 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-200">
          <div className="text-sm font-medium">
            {selectedImageIds.length} Selected
          </div>
          <div className="h-6 w-px bg-white/10"></div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleBulkDownload}>
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
            {activeGroupRole === 'owner' && (
              <Button variant="destructive" size="sm" onClick={() => setConfirmDeleteId('bulk')}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteAlbumId}
        title="Delete Album"
        description="Are you sure you want to delete this album? All photos inside it will also be deleted."
        variant="danger"
        onConfirm={() => { if (confirmDeleteAlbumId) handleDeleteAlbum(confirmDeleteAlbumId); }}
        onCancel={() => setConfirmDeleteAlbumId(null)}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete Photo"
        description="Are you sure you want to delete this photo?"
        variant="danger"
        onConfirm={() => {
          if (confirmDeleteId === 'bulk') handleBulkDelete();
          else if (confirmDeleteId) handleDeleteImage(confirmDeleteId);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
