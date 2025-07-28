import { IS_PRODUCTION } from '@/constants';

// Store original console methods to avoid recursion
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn
};

// Функция для маскировки чувствительных данных в URL
const maskSensitiveUrl = (text: string): string => {
  // Always mask URLs to prevent them from appearing in console logs
  return text
    .replace(/https?:\/\/[^\/\s]+\/api\/v1/g, '[BACKEND_API]')
    .replace(/https?:\/\/api\.toonzyai\.me/g, '[BACKEND_API]')
    .replace(/http:\/\/localhost:\d+/g, '[LOCALHOST]')
    .replace(/http:\/\/127\.0\.0\.1:\d+/g, '[LOCALHOST]')
    .replace(/wss?:\/\/[^\/\s]+/g, '[BACKEND_WS]')
    .replace(/wss?:\/\/api\.toonzyai\.me/g, '[BACKEND_WS]')
    .replace(/"url":\s*"https?:\/\/[^"]+"/g, '"url": "[MASKED_URL]"')
    .replace(/url:\s*https?:\/\/[^\s,}]+/g, 'url: [MASKED_URL]');
};

// Безопасный logger
export const secureLogger = {
  log: (...args: any[]) => {
    // Always mask sensitive data to prevent URLs from appearing in console
    const maskedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return maskSensitiveUrl(arg);
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          const str = JSON.stringify(arg);
          return JSON.parse(maskSensitiveUrl(str));
        } catch {
          return '[OBJECT]';
        }
      }
      return arg;
    });
    originalConsole.log(...maskedArgs);
  },

  error: (...args: any[]) => {
    // Always mask sensitive data to prevent URLs from appearing in console
    const maskedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return maskSensitiveUrl(arg);
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          const str = JSON.stringify(arg);
          return JSON.parse(maskSensitiveUrl(str));
        } catch {
          return '[ERROR_OBJECT]';
        }
      }
      return arg;
    });
    originalConsole.error(...maskedArgs);
  },

  warn: (...args: any[]) => {
    // Always mask sensitive data to prevent URLs from appearing in console
    const maskedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return maskSensitiveUrl(arg);
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          const str = JSON.stringify(arg);
          return JSON.parse(maskSensitiveUrl(str));
        } catch {
          return '[WARNING_OBJECT]';
        }
      }
      return arg;
    });
    originalConsole.warn(...maskedArgs);
  }
};

// Безопасная обработка ошибок API 
export const sanitizeApiError = (error: any): any => {
  // Always sanitize errors to prevent URLs from appearing in console

  if (error && typeof error === 'object') {
    const sanitized = { ...error };
    
    // Маскируем URL в сообщении об ошибке
    if (sanitized.message && typeof sanitized.message === 'string') {
      sanitized.message = maskSensitiveUrl(sanitized.message);
    }
    
    // Маскируем URL в стеке ошибки
    if (sanitized.stack && typeof sanitized.stack === 'string') {
      sanitized.stack = maskSensitiveUrl(sanitized.stack);
    }
    
    // Маскируем URL в деталях ошибки
    if (sanitized.details && typeof sanitized.details === 'string') {
      sanitized.details = maskSensitiveUrl(sanitized.details);
    }
    
    // Убираем возможные ссылки на config или request
    delete sanitized.config;
    delete sanitized.request;
    delete sanitized.response?.config;
    delete sanitized.response?.request;
    
    return sanitized;
  }
  
  return error;
};

// Экспортируем для обратной совместимости
export { secureLogger as logger }; 