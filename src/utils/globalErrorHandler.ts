import { secureLogger, sanitizeApiError } from './secureLogging';
import { IS_PRODUCTION } from '@/constants';

// Глобальный обработчик необработанных ошибок
export const initializeGlobalErrorHandler = () => {
  // Обработка необработанных промисов
  window.addEventListener('unhandledrejection', (event) => {
    const sanitizedError = sanitizeApiError(event.reason);
    secureLogger.error('Unhandled promise rejection:', sanitizedError);
    
    // В продакшене не показываем alert с ошибкой
    if (!IS_PRODUCTION) {
      console.warn('Unhandled promise rejection:', event.reason);
    }
    
    // Не предотвращаем стандартное поведение, но логируем безопасно
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
  });

  // Переопределяем console методы в продакшене
  if (IS_PRODUCTION) {
    const originalConsole = { ...console };
    
    // Переопределяем console.error
    console.error = (...args) => {
      const sanitizedArgs = args.map(arg => sanitizeApiError(arg));
      originalConsole.error(...sanitizedArgs);
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
  };
}; 