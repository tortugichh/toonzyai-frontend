import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
  children?: ReactNode;
}

export default function Modal({
  open,
  title,
  description,
  confirmText = 'OK',
  cancelText = 'Отмена',
  onConfirm,
  onClose,
  children,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* modal */}
      <div className="relative bg-white rounded-xl shadow-lg max-w-sm w-full p-6 z-50 animate-scale-in">
        {title && <h2 className="text-xl font-bold mb-2">{title}</h2>}
        {description && <p className="text-gray-700 mb-4">{description}</p>}
        {children}
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition"
            onClick={onClose}
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button
              className="px-4 py-2 rounded-md text-white bg-gradient-to-r from-[#FFA657] via-[#FF8800] to-[#CC6E00] hover:opacity-90 transition"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes scale-in {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.15s ease-out; }
      `}</style>
    </div>,
    document.body
  );
} 