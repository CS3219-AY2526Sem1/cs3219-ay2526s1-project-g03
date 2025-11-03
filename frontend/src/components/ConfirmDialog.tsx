import { useEffect, useRef } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'normal' | 'warning';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'normal',
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    const handleClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;

      if (!isInDialog) {
        onClose();
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleClick);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const Icon = variant === 'warning' ? AlertTriangle : Info;
  const iconColor = variant === 'warning' ? 'text-red-500' : 'text-blue-500';
  const confirmButtonClass =
    variant === 'warning'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg shadow-xl border border-gray-200 p-0 backdrop:bg-black/50 max-w-md w-full fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <div className="bg-white rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className={`flex-shrink-0 ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-gray-600 pl-10">{message}</p>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </dialog>
  );
}
