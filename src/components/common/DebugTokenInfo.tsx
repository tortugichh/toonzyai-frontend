import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function DebugTokenInfo() {
  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDebug(true)}
        className="text-xs fixed bottom-4 left-4 z-50"
      >
        🔐 Token Debug
      </Button>
    );
  }

  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    alert('Токены очищены');
    window.location.reload();
  };

  return (
    <Card className="fixed bottom-4 left-4 z-50 p-4 bg-gray-900 text-white border border-gray-700 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-white">Token Debug</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDebug(false)}
          className="text-xs text-white border-gray-600 hover:bg-gray-800"
        >
          ✕
        </Button>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <strong className="text-green-400">Access Token:</strong>
          <div className="mt-1 p-2 bg-gray-800 rounded text-xs break-all">
            {accessToken ? 
              accessToken.substring(0, 50) + '...' : 
              'Не найден'
            }
          </div>
        </div>

        <div>
          <strong className="text-blue-400">Refresh Token:</strong>
          <div className="mt-1 p-2 bg-gray-800 rounded text-xs break-all">
            {refreshToken ? 
              refreshToken.substring(0, 50) + '...' : 
              'Не найден'
            }
          </div>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <strong className="text-yellow-400">Статус:</strong>
          <div className="mt-1">
            {accessToken && refreshToken ? (
              <span className="text-green-400">✅ Авторизован</span>
            ) : (
              <span className="text-red-400">❌ Не авторизован</span>
            )}
          </div>
        </div>

        <Button
          onClick={clearTokens}
          size="sm"
          className="w-full bg-red-600 hover:bg-red-700 text-white text-xs"
        >
          Очистить токены
        </Button>
      </div>
    </Card>
  );
} 