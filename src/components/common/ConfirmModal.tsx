import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'destructive',
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              {cancelText}
            </Button>
            <Button variant={confirmVariant} onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Deleting...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 