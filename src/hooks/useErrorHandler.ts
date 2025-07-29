import { useCallback } from 'react';
import { toastError, handleErrorWithToast } from '@/utils/toast';
import { withErrorHandling, withSyncErrorHandling } from '@/utils/globalErrorHandler';
import { APIError } from '@/services/api';

export const useErrorHandler = () => {
  const handleError = useCallback((error: unknown) => {
    return handleErrorWithToast(error);
  }, []);

  const handleAsyncError = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => {
    return withErrorHandling(fn);
  }, []);

  const handleSyncError = useCallback(<T extends any[], R>(
    fn: (...args: T) => R
  ) => {
    return withSyncErrorHandling(fn);
  }, []);

  const tryCatch = useCallback(async <T>(
    promise: Promise<T>
  ): Promise<T | undefined> => {
    try {
      return await promise;
    } catch (error) {
      toastError(error);
      return undefined;
    }
  }, []);

  const tryCatchSync = useCallback(<T>(
    fn: () => T
  ): T | undefined => {
    try {
      return fn();
    } catch (error) {
      toastError(error);
      return undefined;
    }
  }, []);

  return {
    handleError,
    handleAsyncError,
    handleSyncError,
    tryCatch,
    tryCatchSync,
  };
};

// Specific error handlers for different contexts
export const useAuthErrorHandler = () => {
  const { handleError } = useErrorHandler();
  
  const handleAuthError = useCallback((error: unknown) => {
    // Enhanced auth error handling with more specific messages
    if (error instanceof APIError) {
      const details = error.details;
      const originalMessage = typeof details === 'string' ? details : details?.detail || '';
      const messageLower = originalMessage.toLowerCase();
      
      // Check for specific auth error patterns
      if (messageLower.includes('invalid credentials') || 
          messageLower.includes('incorrect password') ||
          messageLower.includes('wrong password')) {
        toastError({
          type: 'AUTHENTICATION',
          message: originalMessage,
          userFriendly: 'Incorrect password. Please check your password and try again.',
          icon: '🔒',
          duration: 4000
        });
        return;
      }
      
      if (messageLower.includes('invalid username') ||
          messageLower.includes('user not found') ||
          messageLower.includes('no user found')) {
        toastError({
          type: 'AUTHENTICATION',
          message: originalMessage,
          userFriendly: 'Username/email not found. Please check your login information or create a new account.',
          icon: '👤',
          duration: 4000
        });
        return;
      }
      
      if (messageLower.includes('email not verified') ||
          messageLower.includes('verify your email')) {
        toastError({
          type: 'EMAIL_VERIFICATION',
          message: originalMessage,
          userFriendly: 'Please verify your email before logging in. Check your inbox or request a new verification email.',
          icon: '📧',
          duration: 6000
        });
        return;
      }
      
      if (messageLower.includes('account locked') ||
          messageLower.includes('account suspended')) {
        toastError({
          type: 'AUTHORIZATION',
          message: originalMessage,
          userFriendly: 'Your account has been temporarily suspended. Please contact support for assistance.',
          icon: '🚫',
          duration: 5000
        });
        return;
      }
      
      // Handle field-specific validation errors
      if (typeof details === 'object' && details.field_errors) {
        const fieldErrors = details.field_errors;
        const authFields = ['username', 'email', 'password', 'login'];
        const hasAuthFieldError = fieldErrors.some((fe: any) => 
          authFields.some(authField => fe.field.toLowerCase().includes(authField))
        );
        
        if (hasAuthFieldError) {
          const fieldMessages = fieldErrors
            .filter((fe: any) => authFields.some(authField => fe.field.toLowerCase().includes(authField)))
            .map((fe: any) => fe.message)
            .join(', ');
          
          toastError({
            type: 'VALIDATION',
            message: fieldMessages,
            userFriendly: 'Please check your login information and try again.',
            icon: '✏️',
            duration: 4000
          });
          return;
        }
      }
      
      // Handle HTTP status codes
      switch (error.status) {
        case 401:
          if (messageLower.includes('invalid') || 
              messageLower.includes('incorrect') ||
              messageLower.includes('wrong') ||
              messageLower.includes('not found')) {
            toastError({
              type: 'AUTHENTICATION',
              message: originalMessage,
              userFriendly: 'Invalid username/email or password. Please check your credentials and try again.',
              icon: '🔒',
              duration: 4000
            });
          } else {
            toastError({
              type: 'AUTHENTICATION',
              message: originalMessage,
              userFriendly: 'Your session has expired. Please log in again.',
              icon: '🔐',
              duration: 4000
            });
          }
          return;
          
        case 403:
          toastError({
            type: 'AUTHORIZATION',
            message: originalMessage,
            userFriendly: 'You do not have permission to perform this action.',
            icon: '🚫',
            duration: 4000
          });
          return;
          
        case 404:
          if (messageLower.includes('user') || messageLower.includes('account')) {
            toastError({
              type: 'NOT_FOUND',
              message: originalMessage,
              userFriendly: 'Account not found. Please check your username/email or create a new account.',
              icon: '👤',
              duration: 5000
            });
          } else {
            toastError({
              type: 'NOT_FOUND',
              message: originalMessage,
              userFriendly: 'Resource not found. It may have been deleted.',
              icon: '🔍',
              duration: 4000
            });
          }
          return;
      }
    }
    
    // Fallback to general error handling
    handleError(error);
  }, [handleError]);

  return { handleAuthError };
};

export const useGenerationErrorHandler = () => {
  const { handleError } = useErrorHandler();
  
  const handleGenerationError = useCallback((error: unknown) => {
    // Special handling for generation errors
    const errorInfo = handleError(error);
    return errorInfo;
  }, [handleError]);

  return { handleGenerationError };
};

export const useValidationErrorHandler = () => {
  const { handleError } = useErrorHandler();
  
  const handleValidationError = useCallback((error: unknown) => {
    // Special handling for validation errors
    const errorInfo = handleError(error);
    return errorInfo;
  }, [handleError]);

  return { handleValidationError };
}; 