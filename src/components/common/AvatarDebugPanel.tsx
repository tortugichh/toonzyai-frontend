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
  const [testPrompt, setTestPrompt] = useState('beautiful girl with long hair');
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (action: string, status: 'success' | 'error' | 'info', message: string, details?: any) => {
    const newLog: DebugInfo = {
      timestamp: new Date().toLocaleTimeString(),
      action,
      status,
      message,
      details
    };
    setLogs(prev => [newLog, ...prev.slice(0, 19)]); // keep last 20 logs
  };

  const clearLogs = () => setLogs([]);

  const testAuthStatus = async () => {
    addLog('AUTH_CHECK', 'info', 'Checking authentication...');

    try {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      addLog('TOKENS', 'info', `Access Token: ${accessToken ? 'Found' : 'Missing'}, Refresh Token: ${refreshToken ? 'Found' : 'Missing'}`);

      if (!accessToken) {
        addLog('AUTH_CHECK', 'error', 'No access token found. Please log in.');
        return;
      }

      const user = await apiClient.getCurrentUser();
      addLog('AUTH_CHECK', 'success', `User: ${user.username} (${user.email})`);
    } catch (error) {
      addLog('AUTH_CHECK', 'error', `Authentication error: ${getErrorMessage(error)}`);
    }
  };

  const testBackendConnection = async () => {
    addLog('BACKEND_TEST', 'info', 'Testing backend connection...');

    try {
      const health = await apiClient.checkHealth();
      addLog('BACKEND_TEST', 'success', `Backend available: ${health.status}`);
    } catch (error) {
      addLog('BACKEND_TEST', 'error', `Backend unavailable: ${getErrorMessage(error)}`);
    }
  };

  const testCreateAvatar = async () => {
    if (!testPrompt.trim()) {
      addLog('CREATE_AVATAR', 'error', 'Please enter an avatar description.');
      return;
    }

    setIsLoading(true);
    addLog('CREATE_AVATAR', 'info', `Creating avatar: "${testPrompt}"`);

    try {
      const avatar = await apiClient.createAvatar(testPrompt);
      addLog('CREATE_AVATAR', 'success', `Avatar created: ${avatar.avatar_id}`, avatar);

      // test image load shortly after creation
      setTimeout(() => testImageLoad(avatar.avatar_id), 2000);
    } catch (error) {
      addLog('CREATE_AVATAR', 'error', `Creation failed: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testImageLoad = async (avatarId?: string) => {
    if (!avatarId) {
      try {
        const avatarsResponse = await apiClient.getAvatars(1, 1);
        if (avatarsResponse.avatars.length === 0) {
          addLog('IMAGE_TEST', 'error', 'No avatars found for testing.');
          return;
        }
        avatarId = avatarsResponse.avatars[0].avatar_id;
        addLog('IMAGE_TEST', 'info', `Using first avatar: ${avatarId}`);
      } catch (error) {
        addLog('IMAGE_TEST', 'error', 'Could not fetch avatar list.');
        return;
      }
    }

    addLog('IMAGE_TEST', 'info', `Testing image load for ${avatarId}`);

    try {
      const token = localStorage.getItem('access_token');
      addLog('IMAGE_TEST', 'info', `Token: ${token ? `${token.substring(0, 20)}...` : 'MISSING'}`);

      if (!token) {
        addLog('IMAGE_TEST', 'error', 'Authorization token missing.');
        return;
      }

      // Test 1: Blob fetch with authentication
      try {
        addLog('IMAGE_TEST', 'info', 'Test 1 - Using getAvatarImageBlob');
        const blob = await apiClient.getAvatarImageBlob(avatarId);
        addLog('IMAGE_TEST', 'success', `✅ Blob method works: ${blob.size} bytes`);

        const imageUrl = URL.createObjectURL(blob);
        addLog('IMAGE_TEST', 'success', `Image available at URL: ${imageUrl}`);
        return;
      } catch (blobError) {
        addLog('IMAGE_TEST', 'error', `Blob method failed: ${getErrorMessage(blobError)}`);
      }

      // Test 2: Query parameter
      const queryUrl = apiClient.getAvatarImageUrl(avatarId);
      addLog('IMAGE_TEST', 'info', `Test 2 - Query URL: ${queryUrl}`);

      const queryResponse = await fetch(queryUrl);
      addLog('IMAGE_TEST', 'info', `Query response: ${queryResponse.status} ${queryResponse.statusText}`);

      if (queryResponse.ok) {
        const blob = await queryResponse.blob();
        addLog('IMAGE_TEST', 'success', `✅ Query method works: ${blob.size} bytes`);
        return;
      }

      // Test 3: Bearer header via proxy
      const bearerUrl = `/api/v1/avatars/${avatarId}/image`;
      addLog('IMAGE_TEST', 'info', `Test 3 - Bearer via proxy: ${bearerUrl}`);

      const bearerResponse = await fetch(bearerUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'image/*'
        }
      });

      addLog('IMAGE_TEST', 'info', `Bearer proxy response: ${bearerResponse.status} ${bearerResponse.statusText}`);

      if (bearerResponse.ok) {
        const blob = await bearerResponse.blob();
        addLog('IMAGE_TEST', 'success', `✅ Bearer proxy works: ${blob.size} bytes`);
        return;
      }

      const errorText = await bearerResponse.text();
      addLog('IMAGE_TEST', 'error', `❌ All methods failed. Last error: ${errorText}`);

      try {
        const user = await apiClient.getCurrentUser();
        addLog('IMAGE_TEST', 'info', `Token valid for API: user ${user.username}`);
      } catch (tokenError) {
        addLog('IMAGE_TEST', 'error', `Token invalid: ${getErrorMessage(tokenError)}`);
      }

    } catch (error) {
      addLog('IMAGE_TEST', 'error', `Image test error: ${getErrorMessage(error)}`);
    }
  };

  const testFullFlow = async () => {
    addLog('FULL_TEST', 'info', 'Starting full diagnostic test...');
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
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Avatar Diagnostics</h3>

      {/* Test buttons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <Button onClick={testBackendConnection} variant="outline" size="sm">
          🌐 Backend
        </Button>
        <Button onClick={testAuthStatus} variant="outline" size="sm">
          🔐 Auth
        </Button>
        <Button onClick={() => testImageLoad()} variant="outline" size="sm">
          🖼️ Image
        </Button>
        <Button 
          onClick={testCreateAvatar} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? '⏳' : '🎨'} Create
        </Button>
        <Button onClick={testFullFlow} variant="outline" size="sm" disabled={isLoading}>
          🚀 Full Test
        </Button>
      </div>

      {/* Prompt input */}
      <div className="mb-4">
        <Input
          value={testPrompt}
          onChange={(e) => setTestPrompt(e.target.value)}
          placeholder="Avatar description for testing"
          className="w-full"
        />
      </div>

      {/* Clear logs */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600">Operation logs:</span>
        <Button onClick={clearLogs} variant="outline" size="sm">
          🗑️ Clear
        </Button>
      </div>

      {/* Logs */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No logs yet. Run a test above.
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
                  <summary className="cursor-pointer text-gray-500">Details</summary>
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
