import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { API_BASE_URL } from '@/constants';

interface BackendStatusProps {
  onStatusChange?: (isOnline: boolean) => void;
}

export default function BackendStatus({ onStatusChange }: BackendStatusProps) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkBackendStatus = async () => {
    setIsChecking(true);
    try {
      const healthUrl = API_BASE_URL ? `${API_BASE_URL.replace(/\/api\/v1$/, '')}/health` : '/health';
      const response = await fetch(healthUrl, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsOnline(true);
        onStatusChange?.(true);
        console.log('Backend доступен:', data);
      } else {
        setIsOnline(false);
        onStatusChange?.(false);
        console.error('Backend response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      setIsOnline(false);
      onStatusChange?.(false);
      console.error('Backend недоступен:', error);
    } finally {
      setIsChecking(false);
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    // Проверяем статус при загрузке
    checkBackendStatus();
  }, []);

  if (isOnline === null) {
    return (
      <Card className="p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-card">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div>
          <span className="text-gray-800">Checking server connection...</span>
        </div>
      </Card>
    );
  }

  if (isOnline) {
    return (
      <Card className="p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-gray-800 font-medium">Server available</span>
          </div>
          <Button
            onClick={checkBackendStatus}
            disabled={isChecking}
            size="sm"
            className="bg-gradient-to-r from-[#FFA657] via-[#FF8800] to-[#CC6E00] text-white px-3 py-1 rounded-md font-medium shadow hover:opacity-90 transition"
          >
            {isChecking ? 'Проверка...' : 'Обновить'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">!</span>
          </div>
          <div>
            <p className="text-gray-800 font-medium">Server unavailable</p>
            <p className="text-gray-600 text-sm">
              Backend server is not responding: {API_BASE_URL || 'localhost:8000'}
            </p>
            {lastCheck && (
              <p className="text-gray-500 text-xs mt-1">
                Последняя проверка: {lastCheck.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={checkBackendStatus}
            disabled={isChecking}
            variant="outline"
            className="text-red-600 border-red-300 text-sm"
            size="sm"
          >
            {isChecking ? 'Проверка...' : 'Повторить'}
          </Button>
        </div>
      </div>
      
      <div className="mt-3 p-3 bg-gray-100 rounded-lg text-sm">
        <h3 className="text-sm font-medium text-red-800 mb-2">Connection Issues</h3>
        <p className="text-sm text-red-700 mb-3">
          Backend server is not responding: {API_BASE_URL || 'localhost:8000'}
        </p>
        <div className="text-sm text-red-600">
          <p className="font-medium mb-2">Troubleshooting steps:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>• Start the ToonzyAI backend server on port 8000</li>
            <li>• Check if the server is running: <code>curl http://localhost:8000/api/v1/health</code></li>
            <li>• Make sure there's no firewall blocking the connection</li>
          </ul>
        </div>
      </div>
    </Card>
  );
} 