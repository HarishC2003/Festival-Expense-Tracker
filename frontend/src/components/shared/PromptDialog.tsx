import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2 } from 'lucide-react';

interface PromptDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => Promise<void> | void;
  onCancel: () => void;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({
  isOpen,
  title,
  description,
  placeholder = 'Enter value...',
  confirmText = 'Submit',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}) => {
  const [value, setValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) setValue('');
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      try {
        setIsProcessing(true);
        await onConfirm(value.trim());
      } finally {
        setIsProcessing(false);
        onCancel();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onCancel()}>
      <DialogContent className="max-w-md p-8 bg-ground border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Input 
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full"
            />
          </div>
          <div className="flex gap-4 w-full">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isProcessing}>
              {cancelText}
            </Button>
            <Button type="submit" variant="default" className="flex-1" disabled={!value.trim() || isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isProcessing ? 'Processing...' : confirmText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
