import { IS_PRODUCTION } from '@/constants';

// Функция для маскировки чувствительных данных в URL
const maskSensitiveUrl = (text: string): string => {
  if (!IS_PRODUCTION) {
    return text; // В режиме разработки показываем всё
  }

  // Заменяем полные URL бэкенда на маскированные версии
  return text
    .replace(/https?:\/\/[^\/\s]+\/api\/v1/g, '[BACKEND_API]')
    .replace(/https?:\/\/api\.toonzyai\.me/g, '[BACKEND_API]')
    .replace(/wss?:\/\/[^\/\s]+/g, '[BACKEND_WS]')
    .replace(/wss?:\/\/api\.toonzyai\.me/g, '[BACKEND_WS]')
    .replace(/"url":\s*"https?:\/\/[^"]+"/g, '"url": "[MASKED_URL]"')
    .replace(/url:\s*https?:\/\/[^\s,}]+/g, 'url: [MASKED_URL]');
};

// Безопасный logger
export const secureLogger = {
  log: (...args: any[]) => {
    if (IS_PRODUCTION) {
      // В продакшене маскируем чувствительные данные
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
      console.log(...maskedArgs);
    } else {
      // В разработке показываем всё как есть
      console.log(...args);
    }
  },

  error: (...args: any[]) => {
    if (IS_PRODUCTION) {
      // В продакшене маскируем чувствительные данные
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
      console.error(...maskedArgs);
    } else {
      // В разработке показываем всё как есть
      console.error(...args);
    }
  },

  warn: (...args: any[]) => {
    if (IS_PRODUCTION) {
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
      console.warn(...maskedArgs);
    } else {
      console.warn(...args);
    }
  }
};

// Безопасная обработка ошибок API 
export const sanitizeApiError = (error: any): any => {
  if (!IS_PRODUCTION) {
    return error; // В разработке возвращаем как есть
  }

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