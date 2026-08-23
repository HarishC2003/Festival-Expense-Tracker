import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../components/ui/command';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { useGroup } from '../../context/GroupContext';

interface DonorAutocompleteProps {
  value: string;
  onChange: (donorId: string) => void;
  disabled?: boolean;
}

export const DonorAutocomplete: React.FC<DonorAutocompleteProps> = ({ value, onChange, disabled }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [donors, setDonors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  // New Donor Modal State
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newDonor, setNewDonor] = useState({ name: '', phone: '', address: '' });

  const { activeGroupId } = useGroup();

  useEffect(() => {
    const fetchDonors = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3001/api/income/donors/search?q=${search}`, {
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Group-Id': activeGroupId || ''
        }
      });
      if (res.ok) {
        setDonors(await res.json());
      }
    };
    
    // Simple debounce
    const t = setTimeout(fetchDonors, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Make sure selected donor name is shown
  const selectedDonor = donors.find(d => d.id === value) || { name: t('shared.selectDonor') };

  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`http://localhost:3001/api/income/donors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'X-Group-Id': activeGroupId || ''
      },
      body: JSON.stringify(newDonor)
    });
    if (res.ok) {
      const data = await res.json();
      setDonors(prev => [data, ...prev]);
      onChange(data.id);
      setIsNewOpen(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {value && donors.some(d => d.id === value) ? selectedDonor.name : t('shared.selectDonor')}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder={t('shared.searchDonor')} 
              value={search} 
              onValueChange={setSearch} 
            />
            <CommandList>
              <CommandEmpty>
                <div className="p-4 text-center text-sm">
                  {t('shared.noDonorsFound')}
                  <Button variant="link" className="mt-2 w-full" onClick={() => setIsNewOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> {t('shared.addNewDonor')}
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {donors.map((donor) => (
                  <CommandItem
                    key={donor.id}
                    value={donor.id}
                    onSelect={() => {
                      onChange(donor.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === donor.id ? "opacity-100" : "opacity-0")} />
                    <div>
                      <div>{donor.name}</div>
                      <div className="text-xs text-muted-foreground">{donor.phone} • {donor.address}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('shared.addNewDonorTitle')}</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateDonor} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('shared.name')}</Label>
              <Input required value={newDonor.name} onChange={e => setNewDonor({...newDonor, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{t('shared.phone')}</Label>
              <Input value={newDonor.phone} onChange={e => setNewDonor({...newDonor, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{t('shared.address')}</Label>
              <Input value={newDonor.address} onChange={e => setNewDonor({...newDonor, address: e.target.value})} />
            </div>
            <Button type="submit" className="w-full">{t('shared.createDonor')}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
