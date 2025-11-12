import toast from 'react-hot-toast';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  return {
    toast: ({ title, description, variant }: ToastProps) => {
      const message = title && description ? `${title}: ${description}` : title || description || '';
      
      if (variant === 'destructive') {
        toast.error(message);
      } else {
        toast.success(message);
      }
    },
  };
}

