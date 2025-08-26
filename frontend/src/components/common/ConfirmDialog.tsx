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
} from '@/components/ui/alert-dialog';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  variant = 'default',
  loading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <XCircle className="h-6 w-6 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-emerald-600" />;
      default:
        return <Info className="h-6 w-6 text-teal-600" />;
    }
  };

  const getButtonClassName = () => {
    switch (variant) {
      case 'destructive':
        return cn(buttonVariants({ variant: 'destructive' }), 'bg-rose-600 hover:bg-rose-700');
      case 'warning':
        return cn(buttonVariants({ variant: 'default' }), 'bg-amber-500 hover:bg-amber-600 text-white');
      case 'success':
        return cn(buttonVariants({ variant: 'default' }), 'bg-emerald-600 hover:bg-emerald-700 text-white');
      default:
        return cn(buttonVariants({ variant: 'default' }), 'bg-teal-600 hover:bg-teal-700 text-white');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/80">
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            {getIcon()}
            <AlertDialogTitle className="text-slate-800">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-slate-600">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="bg-slate-100 text-slate-700 hover:bg-slate-200">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={getButtonClassName()}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;