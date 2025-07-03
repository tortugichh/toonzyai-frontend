import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/services/api';

export const toastError = (error: unknown) => {
  toast.error(getErrorMessage(error));
};

export const toastSuccess = (msg: string) => {
  toast.success(msg);
}; 