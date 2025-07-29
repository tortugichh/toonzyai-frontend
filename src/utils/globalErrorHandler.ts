import { secureLogger, sanitizeApiError } from './secureLogging';
import { toastError } from './toast';
import { IS_PRODUCTION } from '@/constants';

// Глобальный обработчик необработанных ошибок
export const initializeGlobalErrorHandler = () => {
  // Обработка необработанных промисов
  window.addEventListener('unhandledrejection', (event) => {
    const sanitizedError = sanitizeApiError(event.reason);
    secureLogger.error('Unhandled promise rejection:', sanitizedError);
    
    // Show toast notification for unhandled promise rejections
    toastError(event.reason);
    
    // Prevent default behavior to avoid console errors
    event.preventDefault();
    
    // В продакшене не показываем alert с ошибкой
    if (!IS_PRODUCTION) {
      console.warn('Unhandled promise rejection:', event.reason);
    }
  });

  // Обработка JavaScript ошибок
  window.addEventListener('error', (event) => {
    const sanitizedError = {
      message: event.message,
      filename: IS_PRODUCTION ? '[MASKED_FILE]' : event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: sanitizeApiError(event.error)
    };
    
    secureLogger.error('JavaScript error:', sanitizedError);
    
    // Show toast notification for JavaScript errors
    toastError(new Error(event.message));
    
    // Prevent default behavior
    event.preventDefault();
  });

  // Переопределяем console методы в продакшене
  if (IS_PRODUCTION) {
    const originalConsole = { ...console };
    
    // Переопределяем console.error
    console.error = (...args) => {
      const sanitizedArgs = args.map(arg => sanitizeApiError(arg));
      originalConsole.error(...sanitizedArgs);
      
      // Show toast for console.error calls
      const errorMessage = args.map(arg => 
        typeof arg === 'string' ? arg : 
        arg instanceof Error ? arg.message : 
        JSON.stringify(arg)
      ).join(' ');
      
      if (errorMessage && !errorMessage.includes('[MASKED]')) {
        toastError(new Error(errorMessage));
      }
    };
    
    // Переопределяем console.warn
    console.warn = (...args) => {
      const sanitizedArgs = args.map(arg => sanitizeApiError(arg));
      originalConsole.warn(...sanitizedArgs);
    };
    
    // В продакшене подавляем console.log (или можем маскировать)
    console.log = (...args) => {
      // Можем полностью подавить или маскировать
      const sanitizedArgs = args.map(arg => sanitizeApiError(arg));
      originalConsole.log(...sanitizedArgs);
    };
  }
};

// Функция для перехвата ошибок из React Query
export const createSecureOnError = () => {
  return (error: unknown) => {
    const sanitizedError = sanitizeApiError(error);
    secureLogger.error('React Query error:', sanitizedError);
    
    // Show toast for React Query errors
    toastError(error);
  };
};

// Enhanced error handler for async operations
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      const sanitizedError = sanitizeApiError(error);
      secureLogger.error('Function error:', sanitizedError);
      toastError(error);
      return undefined;
    }
  };
};

// Error handler for synchronous operations
export const withSyncErrorHandling = <T extends any[], R>(
  fn: (...args: T) => R
) => {
  return (...args: T): R | undefined => {
    try {
      return fn(...args);
    } catch (error) {
      const sanitizedError = sanitizeApiError(error);
      secureLogger.error('Sync function error:', sanitizedError);
      toastError(error);
      return undefined;
    }
  };
}; 