import { toast as sonnerToast } from 'sonner';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
}

export const useToast = () => {
  const toast = ({ title, description, variant = 'default', duration }: ToastProps) => {
    const message = title || description || '';
    const desc = title && description ? description : undefined;

    switch (variant) {
      case 'destructive':
        return sonnerToast.error(message, {
          description: desc,
          duration,
        });
      case 'success':
        return sonnerToast.success(message, {
          description: desc,
          duration,
        });
      case 'warning':
        return sonnerToast.warning(message, {
          description: desc,
          duration,
        });
      default:
        return sonnerToast(message, {
          description: desc,
          duration,
        });
    }
  };

  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
};

// Export individual toast functions for convenience
export const toast = {
  success: (message: string, options?: { description?: string; duration?: number }) =>
    sonnerToast.success(message, options),
  error: (message: string, options?: { description?: string; duration?: number }) =>
    sonnerToast.error(message, options),
  warning: (message: string, options?: { description?: string; duration?: number }) =>
    sonnerToast.warning(message, options),
  info: (message: string, options?: { description?: string; duration?: number }) =>
    sonnerToast.info(message, options),
  loading: (message: string, options?: { description?: string }) =>
    sonnerToast.loading(message, options),
  dismiss: sonnerToast.dismiss,
};

export default useToast;