import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AnimationProject } from '@/types/api';

interface CompactAnimationMonitorProps {
  animation: AnimationProject;
  onRefresh: () => void;
}

export default function CompactAnimationMonitor({ 
  animation, 
  onRefresh
}: CompactAnimationMonitorProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh every 5 seconds for active animations
  useEffect(() => {
    if (!autoRefresh) return;
    
    const isActive = ['PENDING', 'IN_PROGRESS', 'ASSEMBLING'].includes(animation.status);
    if (!isActive) return;

    const interval = setInterval(() => {
      onRefresh();
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, animation.status, onRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'IN_PROGRESS': return '🔄';
      case 'ASSEMBLING': return '🔧';
      case 'COMPLETED': return '✅';
      case 'FAILED': return '❌';
      default: return '❓';
    }
  };

  const completedSegments = animation.segments?.filter(s => s.status === 'COMPLETED').length || 0;
  const inProgressSegments = animation.segments?.filter(s => s.status === 'IN_PROGRESS').length || 0;
  const progressPercentage = Math.round((completedSegments / animation.total_segments) * 100);
  const isProcessing = ['PENDING', 'IN_PROGRESS', 'ASSEMBLING'].includes(animation.status);

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 10) return 'только что';
    if (diffSeconds < 60) return `${diffSeconds}с назад`;
    return `${Math.floor(diffSeconds / 60)}м назад`;
  };

  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-xl">{getStatusIcon(animation.status)}</div>
          <div>
            <h3 className="font-medium text-gray-900">
              {animation.status === 'PENDING' ? 'Ожидание' : 
               animation.status === 'IN_PROGRESS' ? 'Генерация' :
               animation.status === 'ASSEMBLING' ? 'Сборка' :
               animation.status === 'COMPLETED' ? 'Готово' :
               animation.status === 'FAILED' ? 'Ошибка' : animation.status}
            </h3>
            <p className="text-sm text-gray-600">
              {completedSegments} / {animation.total_segments} сегментов
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-500">
            {formatLastUpdate(lastUpdate)}
          </div>
          {isProcessing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs ${autoRefresh ? 'bg-green-50 text-green-700' : ''}`}
            >
              {autoRefresh ? '🔄' : '⏸️'}
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          >
            {isProcessing && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            )}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {isProcessing && (
        <div className="text-xs text-gray-600">
          {animation.status === 'PENDING' && '📋 В очереди на обработку'}
          {animation.status === 'IN_PROGRESS' && (
            <>
              🤖 ИИ генерирует сегменты
              {inProgressSegments > 0 && ` (${inProgressSegments} в работе)`}
            </>
          )}
          {animation.status === 'ASSEMBLING' && '🎬 Сборка финального видео'}
        </div>
      )}

      {animation.status === 'COMPLETED' && (
        <div className="text-xs text-green-600">
          🎉 Анимация готова к просмотру
        </div>
      )}

      {animation.status === 'FAILED' && (
        <div className="text-xs text-red-600">
          ❌ Ошибка при обработке
        </div>
      )}
    </Card>
  );
} 