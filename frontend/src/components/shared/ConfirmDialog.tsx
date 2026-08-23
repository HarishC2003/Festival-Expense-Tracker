import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  processingText?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  processingText = 'Processing...',
  variant = 'default',
  onConfirm,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirm();
    } finally {
      setIsProcessing(false);
      onCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onCancel()}>
      <DialogContent className="max-w-md text-center p-8 space-y-6 bg-ground border-white/10 shadow-2xl">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2 ring-8 ${
          variant === 'danger' ? 'bg-red-500/10 text-red-500 ring-red-500/5' : 'bg-primary/10 text-primary ring-primary/5'
        }`}>
          {variant === 'danger' ? <AlertTriangle className="w-8 h-8" /> : <Info className="w-8 h-8" />}
        </div>
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-foreground tracking-tight text-center">{title}</DialogTitle>
          <div className="text-center text-muted-foreground text-base mt-2">
            {description}
          </div>
        </DialogHeader>
        <div className="flex gap-4 w-full mt-6">
          <Button variant="outline" className="flex-1 h-12" onClick={onCancel} disabled={isProcessing}>
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'danger' ? 'destructive' : 'default'} 
            className="flex-1 h-12" 
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isProcessing ? processingText : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
