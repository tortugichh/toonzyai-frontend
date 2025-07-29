import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/services/api';
import { categorizeError } from './errorHandler';

interface ErrorInfo {
  type: string;
  message: string;
  userFriendly: string;
  icon?: string;
  duration?: number;
}

export const toastError = (error: unknown | ErrorInfo) => {
  // Handle structured error info
  if (typeof error === 'object' && error !== null && 'userFriendly' in error) {
    const errorInfo = error as ErrorInfo;
    toast.error(errorInfo.userFriendly, {
      duration: errorInfo.duration || 5000,
      icon: errorInfo.icon,
      style: {
        background: '#FEE2E2',
        color: '#991B1B',
        border: '1px solid #FCA5A5',
      },
    });
    return;
  }

  // Handle regular errors
  const errorInfo = categorizeError(error);
  toast.error(errorInfo.userFriendly, {
    duration: errorInfo.duration || 5000,
    icon: errorInfo.icon,
    style: {
      background: '#FEE2E2',
      color: '#991B1B',
      border: '1px solid #FCA5A5',
    },
  });
};

export const toastSuccess = (msg: string) => {
  toast.success(msg, {
    duration: 4000,
    style: {
      background: '#D1FAE5',
      color: '#065F46',
      border: '1px solid #A7F3D0',
    },
  });
};

export const toastWarning = (msg: string) => {
  toast(msg, {
    duration: 4000,
    icon: '⚠️',
    style: {
      background: '#FEF3C7',
      color: '#92400E',
      border: '1px solid #FDE68A',
    },
  });
};

export const toastInfo = (msg: string) => {
  toast(msg, {
    duration: 4000,
    icon: 'ℹ️',
    style: {
      background: '#DBEAFE',
      color: '#1E40AF',
      border: '1px solid #BFDBFE',
    },
  });
};

// Enhanced error handling with automatic categorization
export const handleErrorWithToast = (error: unknown) => {
  const errorInfo = categorizeError(error);
  toastError(error);
  return errorInfo;
};

// Specific error handlers for different contexts
export const handleAuthErrorWithToast = (error: unknown) => {
  const errorInfo = categorizeError(error);
  toastError(error);
  return errorInfo;
};

export const handleGenerationErrorWithToast = (error: unknown) => {
  const errorInfo = categorizeError(error);
  toastError(error);
  return errorInfo;
};

export const handleValidationErrorWithToast = (error: unknown) => {
  const errorInfo = categorizeError(error);
  toastError(error);
  return errorInfo;
}; 