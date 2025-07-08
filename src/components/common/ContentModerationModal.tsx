import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ContentModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reasons: string[];
  suggestedFix: string;
  onRetry: () => void;
}

export function ContentModerationModal({
  isOpen,
  onClose,
  reasons,
  suggestedFix,
  onRetry
}: ContentModerationModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-opacity-5 flex items-center justify-center z-50 p-4 transition-all duration-300 ${
      isOpen ? 'opacity-100' : 'opacity-0'
    }`}>
      <Card className={`bg-white p-6 max-w-md w-full mx-4 shadow-xl border-0 rounded-xl transform transition-all duration-300 ${
        isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Header with animated icon */}
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
            <svg 
              className="w-8 h-8 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            🚫 Контент заблокирован
          </h3>
          <p className="text-gray-600 text-sm">
            Описание не соответствует нашим правилам безопасности
          </p>
        </div>
        
        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-4 text-sm leading-relaxed">
            Наша система безопасности обнаружила в вашем описании элементы, которые противоречат нашим правилам.
          </p>
          
          {reasons.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <span className="text-sm mr-2">⚠️</span>
                <p className="font-medium text-red-900 text-sm">Обнаруженные нарушения:</p>
              </div>
              <ul className="space-y-1">
                {reasons.map((reason, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2 mt-0.5 text-xs">•</span>
                    <span className="text-red-800 text-xs">
                      {typeof reason === 'string' ? reason : 
                       typeof reason === 'object' ? JSON.stringify(reason) : 
                       String(reason)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {suggestedFix && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <span className="text-sm mr-2">💡</span>
                <p className="font-medium text-blue-900 text-sm">Как исправить:</p>
              </div>
              <p className="text-blue-800 text-xs leading-relaxed">
                {typeof suggestedFix === 'string' ? suggestedFix : 
                 typeof suggestedFix === 'object' ? JSON.stringify(suggestedFix) : 
                 String(suggestedFix)}
              </p>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onRetry}
            className="flex-1 bg-gradient-to-r from-[#FFD27F] via-[#FF9A2B] to-[#C65A00] hover:opacity-90 text-white py-2 px-4 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <span className="mr-1">🔄</span>
            Попробовать снова
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 py-2 px-4 text-sm font-medium border-gray-300 hover:bg-gray-50 transition-colors duration-200"
          >
            <span className="mr-1">❌</span>
            Отмена
          </Button>
        </div>
      </Card>
    </div>
  );
} 