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
      <AlertDialogContent className="rounded-[2.5rem] border-indigo-500/20 bg-white/95 dark:bg-black/90 backdrop-blur-xl shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-black text-indigo-950 dark:text-indigo-50 uppercase tracking-tight">System Confirmation</AlertDialogTitle>
          <AlertDialogDescription className="text-indigo-700/60 dark:text-indigo-300/60 font-medium text-base">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 gap-3">
          <AlertDialogCancel disabled={isLoading} className="rounded-full border-2 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-[10px] h-12 px-8">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={`rounded-full font-black uppercase tracking-widest text-[10px] h-12 px-8 transition-all duration-300 transform hover:scale-105 ${
              variant === 'destructive'
                ? 'bg-indigo-950 text-white hover:bg-black shadow-lg shadow-indigo-950/20'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
            }`}
          >
            {isLoading ? 'EXECUTING...' : `CONFIRM_${confirmText.toUpperCase()}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
