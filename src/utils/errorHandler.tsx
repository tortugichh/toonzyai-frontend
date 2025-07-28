import React from 'react';

export class APIError extends Error {
  status: number;
  code: string;
  
  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

export async function handleAPIRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  try {
    return await requestFn();
  } catch (error: any) {
    if (error.status === 401) {
      // Токен истек или недействителен
      window.location.href = '/login';
      throw error;
    }
    
    if (error.status === 403) {
      throw new APIError('Доступ запрещен', 403, 'FORBIDDEN');
    }
    
    if (error.status === 422) {
      throw new APIError('Неверные данные', 422, 'VALIDATION_ERROR');
    }
    
    if (error.status >= 500) {
      throw new APIError('Ошибка сервера', error.status, 'SERVER_ERROR');
    }
    
    throw error;
  }
}

// Функция для получения понятного сообщения об ошибке
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'detail' in error) {
    return String((error as any).detail);
  }
  
  return 'Произошла неожиданная ошибка';
}

// Типы для обработки ошибок
export interface ErrorDisplayProps {
  error: unknown;
  retry?: () => void;
  fallback?: React.ComponentType;
}

// Компонент для отображения ошибок
export function ErrorDisplay({ error, retry }: { error: unknown; retry?: () => void }) {
  const message = getErrorMessage(error);
  
  return (
    <div className="error-display p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
                          <div className="text-red-500 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            An error occurred
          </h3>
          <p className="mt-1 text-sm text-red-700">
            {message}
          </p>
          {retry && (
            <div className="mt-3">
              <button
                onClick={retry}
                className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Хук для обработки ошибок в компонентах
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);
    
    // Можно добавить отправку ошибок в сервис аналитики
    // sendErrorToAnalytics(error, context);
  };
  
  return { handleError };
} 