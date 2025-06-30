import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient, getErrorMessage } from '@/services/api';

interface DebugInfo {
  timestamp: string;
  action: string;
  status: 'success' | 'error' | 'info';
  message: string;
  details?: any;
}

function AvatarDebugPanel() {
  const [logs, setLogs] = useState<DebugInfo[]>([]);
  const [testPrompt, setTestPrompt] = useState('красивая девушка с длинными волосами');
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (action: string, status: 'success' | 'error' | 'info', message: string, details?: any) => {
    const newLog: DebugInfo = {
      timestamp: new Date().toLocaleTimeString(),
      action,
      status,
      message,
      details
    };
    
    setLogs(prev => [newLog, ...prev.slice(0, 19)]); // Сохраняем последние 20 записей
    console.log(`[${newLog.timestamp}] ${action}:`, message, details);
  };

  const clearLogs = () => setLogs([]);

  const testAuthStatus = async () => {
    addLog('AUTH_CHECK', 'info', 'Проверка аутентификации...');
    
    try {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      addLog('TOKENS', 'info', `Access Token: ${accessToken ? 'Есть' : 'Нет'}, Refresh Token: ${refreshToken ? 'Есть' : 'Нет'}`);
      
      if (!accessToken) {
        addLog('AUTH_CHECK', 'error', 'Нет токена доступа. Необходимо войти в систему.');
        return;
      }

      const user = await apiClient.getCurrentUser();
      addLog('AUTH_CHECK', 'success', `Пользователь: ${user.username} (${user.email})`);
      
    } catch (error) {
      addLog('AUTH_CHECK', 'error', `Ошибка аутентификации: ${getErrorMessage(error)}`);
    }
  };

  const testBackendConnection = async () => {
    addLog('BACKEND_TEST', 'info', 'Проверка соединения с backend...');
    
    try {
      const health = await apiClient.checkHealth();
      addLog('BACKEND_TEST', 'success', `Backend доступен: ${health.status}`);
    } catch (error) {
      addLog('BACKEND_TEST', 'error', `Backend недоступен: ${getErrorMessage(error)}`);
    }
  };

  const testCreateAvatar = async () => {
    if (!testPrompt.trim()) {
      addLog('CREATE_AVATAR', 'error', 'Введите описание аватара');
      return;
    }

    setIsLoading(true);
    addLog('CREATE_AVATAR', 'info', `Создание аватара: "${testPrompt}"`);
    
    try {
      const avatar = await apiClient.createAvatar(testPrompt);
      addLog('CREATE_AVATAR', 'success', `Аватар создан: ${avatar.avatar_id}`, avatar);
      
      // Сразу проверяем загрузку изображения
      setTimeout(() => testImageLoad(avatar.avatar_id), 2000);
      
    } catch (error) {
      addLog('CREATE_AVATAR', 'error', `Ошибка создания: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testImageLoad = async (avatarId?: string) => {
    if (!avatarId) {
      // Пробуем взять первый доступный аватар
      try {
        const avatarsResponse = await apiClient.getAvatars(1, 1);
        if (avatarsResponse.avatars.length === 0) {
          addLog('IMAGE_TEST', 'error', 'Нет аватаров для тестирования');
          return;
        }
        avatarId = avatarsResponse.avatars[0].avatar_id;
        addLog('IMAGE_TEST', 'info', `Используем первый аватар: ${avatarId}`);
      } catch (error) {
        addLog('IMAGE_TEST', 'error', 'Не удалось получить список аватаров');
        return;
      }
    }

    addLog('IMAGE_TEST', 'info', `Проверка загрузки изображения для ${avatarId}`);
    
    try {
      const token = localStorage.getItem('access_token');
      addLog('IMAGE_TEST', 'info', `Токен: ${token ? `${token.substring(0, 20)}...` : 'НЕТ'}`);
      
      if (!token) {
        addLog('IMAGE_TEST', 'error', 'Отсутствует токен авторизации');
        return;
      }
      
      // Тест 1: Новый метод с правильной аутентификацией
      try {
        addLog('IMAGE_TEST', 'info', 'Тест 1 - Новый метод getAvatarImageBlob');
        const blob = await apiClient.getAvatarImageBlob(avatarId);
        addLog('IMAGE_TEST', 'success', `✅ Новый метод работает: ${blob.size} байт`);
        
        // Создаем объект URL для отображения
        const imageUrl = URL.createObjectURL(blob);
        addLog('IMAGE_TEST', 'success', `Изображение доступно по URL: ${imageUrl}`);
        return;
      } catch (blobError) {
        addLog('IMAGE_TEST', 'error', `Новый метод неудачен: ${getErrorMessage(blobError)}`);
      }
      
      // Тест 2: Query параметр (старый метод)
      const queryUrl = apiClient.getAvatarImageUrl(avatarId);
      addLog('IMAGE_TEST', 'info', `Тест 2 - Query URL: ${queryUrl}`);
      
      const queryResponse = await fetch(queryUrl);
      addLog('IMAGE_TEST', 'info', `Query результат: ${queryResponse.status} ${queryResponse.statusText}`);
      
      if (queryResponse.ok) {
        const blob = await queryResponse.blob();
        addLog('IMAGE_TEST', 'success', `✅ Query метод работает: ${blob.size} байт`);
        return;
      }
      
      // Тест 3: Bearer заголовок через прокси
      const bearerUrl = `/api/v1/avatars/${avatarId}/image`;
      addLog('IMAGE_TEST', 'info', `Тест 3 - Bearer через прокси: ${bearerUrl}`);
      
      const bearerResponse = await fetch(bearerUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'image/*'
        }
      });
      
      addLog('IMAGE_TEST', 'info', `Bearer через прокси результат: ${bearerResponse.status} ${bearerResponse.statusText}`);
      
      if (bearerResponse.ok) {
        const blob = await bearerResponse.blob();
        addLog('IMAGE_TEST', 'success', `✅ Bearer через прокси работает: ${blob.size} байт`);
        return;
      }
      
      // Все методы не сработали
      const errorText = await bearerResponse.text();
      addLog('IMAGE_TEST', 'error', `❌ Все методы неудачны. Последняя ошибка: ${errorText}`);
      
      // Дополнительная диагностика токена
      try {
        const user = await apiClient.getCurrentUser();
        addLog('IMAGE_TEST', 'info', `Токен валиден для API: пользователь ${user.username}`);
      } catch (tokenError) {
        addLog('IMAGE_TEST', 'error', `Токен недействителен: ${getErrorMessage(tokenError)}`);
      }
      
    } catch (error) {
      addLog('IMAGE_TEST', 'error', `Ошибка тестирования: ${getErrorMessage(error)}`);
    }
  };

  const testFullFlow = async () => {
    addLog('FULL_TEST', 'info', 'Запуск полного теста...');
    await testBackendConnection();
    await testAuthStatus();
    await testCreateAvatar();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <Card className="p-6 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Диагностика аватаров</h3>
      
      {/* Кнопки тестов */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <Button onClick={testBackendConnection} variant="outline" size="sm">
          🌐 Backend
        </Button>
        <Button onClick={testAuthStatus} variant="outline" size="sm">
          🔐 Авторизация
        </Button>
        <Button 
          onClick={() => testImageLoad()} 
          variant="outline" 
          size="sm"
        >
          🖼️ Изображение
        </Button>
        <Button 
          onClick={testCreateAvatar} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? '⏳' : '🎨'} Создать
        </Button>
        <Button onClick={testFullFlow} variant="outline" size="sm" disabled={isLoading}>
          🚀 Полный тест
        </Button>
      </div>

      {/* Поле для ввода промпта */}
      <div className="mb-4">
        <Input
          value={testPrompt}
          onChange={(e) => setTestPrompt(e.target.value)}
          placeholder="Описание аватара для тестирования"
          className="w-full"
        />
      </div>

      {/* Кнопка очистки логов */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600">Логи операций:</span>
        <Button onClick={clearLogs} variant="outline" size="sm">
          🗑️ Очистить
        </Button>
      </div>

      {/* Логи */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            Нет логов. Запустите тесты выше.
          </div>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index}
              className={`p-2 rounded-md text-xs ${getStatusColor(log.status)}`}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono">
                  {getStatusIcon(log.status)} [{log.timestamp}] {log.action}
                </span>
              </div>
              <div className="mt-1">{log.message}</div>
              {log.details && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-gray-500">Подробности</summary>
                  <pre className="mt-1 text-xs overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export default AvatarDebugPanel;
export { AvatarDebugPanel };