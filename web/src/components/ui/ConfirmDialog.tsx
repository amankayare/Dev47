import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[2.5rem] border-cornflower-500/20 bg-white/95 dark:bg-black/90 backdrop-blur-xl shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-black text-cornflower-950 dark:text-cornflower-50 uppercase tracking-tight">System Confirmation</AlertDialogTitle>
          <AlertDialogDescription className="text-cornflower-700/60 dark:text-cornflower-300/60 font-medium text-base">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 gap-3">
          <AlertDialogCancel disabled={isLoading} className="rounded-full border-2 border-cornflower-100 dark:border-cornflower-500/20 text-cornflower-600 dark:text-cornflower-400 font-bold uppercase tracking-widest text-[10px] h-12 px-8">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={`rounded-full font-black uppercase tracking-widest text-[10px] h-12 px-8 transition-all duration-300 transform hover:scale-105 border ${
              variant === 'destructive'
                ? 'bg-red-600 text-white hover:bg-red-700 border-red-500/50 shadow-lg shadow-red-500/20'
                : 'bg-cornflower-600 text-white hover:bg-cornflower-700 border-cornflower-500/50 shadow-lg shadow-cornflower-600/20'
            }`}
          >
            {isLoading ? 'EXECUTING...' : `CONFIRM_${confirmText.toUpperCase()}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
