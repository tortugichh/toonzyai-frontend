import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { avatarImageCache } from '@/utils/imageUtils';
import { apiClient } from '../../services/api';
import type { Avatar } from '@/types/api';

interface DebugAvatarInfoProps {
  avatar: Avatar;
}

export function DebugAvatarInfo({ avatar }: DebugAvatarInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testImageResult, setTestImageResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    if (!avatar) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.request(`/avatars/debug/${avatar.avatar_id}`);
      setDebugInfo(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch debug info');
    } finally {
      setIsLoading(false);
    }
  };

  const testImageLoad = async () => {
    try {
      const blobUrl = await avatarImageCache.get(avatar.avatar_id);
      setTestImageResult(`✅ Success: ${blobUrl}`);
    } catch (error: any) {
      setTestImageResult(`❌ Failed: ${error.message}`);
    }
  };

  const clearCache = () => {
    avatarImageCache.clear();
    setTestImageResult('🗑️ Cache cleared');
  };

  const removeFromCache = () => {
    avatarImageCache.remove(avatar.avatar_id);
    setTestImageResult('🗑️ Removed from cache');
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setIsExpanded(true);
          fetchDebugInfo();
        }}
        className="text-xs"
      >
        🐛 Debug
      </Button>
    );
  }

  const cacheInfo = avatarImageCache.getDebugInfo();

  return (
    <Card className="absolute top-2 right-2 z-10 p-4 bg-gray-900 text-white border border-gray-700 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-white">Debug Info</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="text-xs text-white border-gray-600 hover:bg-gray-800"
        >
          ✕
        </Button>
      </div>

      <div className="space-y-3 text-xs">
        {/* Avatar Info */}
        <div>
          <strong className="text-green-400">Avatar:</strong>
          <div className="mt-1 p-2 bg-gray-800 rounded text-xs">
            <div>ID: {avatar.avatar_id}</div>
            <div>Status: {avatar.status}</div>
            <div>Prompt: {avatar.prompt?.substring(0, 30)}...</div>
          </div>
        </div>

        {/* Cache Info */}
        <div>
          <strong className="text-blue-400">Cache Info:</strong>
          <div className="mt-1 p-2 bg-gray-800 rounded text-xs">
            <div>Size: {cacheInfo.cacheSize}/{cacheInfo.maxSize}</div>
            <div>Loading: {cacheInfo.loadingPromises}</div>
            <div>Has This: {cacheInfo.cachedAvatars.includes(avatar.avatar_id) ? '✅' : '❌'}</div>
          </div>
        </div>

        {/* API Debug Info */}
        {isLoading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
            <div className="mt-1">Loading debug info...</div>
          </div>
        ) : error ? (
          <div>
            <strong className="text-red-400">Error:</strong>
            <div className="mt-1 p-2 bg-gray-800 rounded text-xs break-all">
              {error}
            </div>
          </div>
        ) : debugInfo ? (
          <div>
            <strong className="text-yellow-400">API Info:</strong>
            <div className="mt-1 p-2 bg-gray-800 rounded text-xs max-h-32 overflow-y-auto">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          </div>
        ) : null}

        {/* Test Results */}
        {testImageResult && (
          <div>
            <strong className="text-purple-400">Test Result:</strong>
            <div className="mt-1 p-2 bg-gray-800 rounded text-xs break-all">
              {testImageResult}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-gray-700 space-y-2">
          <Button
            onClick={testImageLoad}
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
          >
            🧪 Test Image Load
          </Button>
          
          <div className="flex space-x-1">
            <Button
              onClick={removeFromCache}
              size="sm"
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs"
            >
              🗑️ Remove
            </Button>
            <Button
              onClick={clearCache}
              size="sm"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              💥 Clear All
            </Button>
          </div>

          <Button
            onClick={fetchDebugInfo}
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
          >
            🔄 Refresh Debug
          </Button>
        </div>

        {/* Token Info */}
        <div className="pt-2 border-t border-gray-700">
          <strong className="text-red-400">Token:</strong>
          <div className="mt-1 p-2 bg-gray-800 rounded text-xs break-all">
            {localStorage.getItem('access_token')?.substring(0, 20)}...
          </div>
        </div>
      </div>
    </Card>
  );
} 