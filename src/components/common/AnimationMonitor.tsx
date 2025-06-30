import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimationSegments } from '@/components/common';
import type { AnimationProject } from '@/types/api';

interface AnimationMonitorProps {
  animation: AnimationProject;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export default function AnimationMonitor({ 
  animation, 
  onRefresh, 
  isRefreshing = false 
}: AnimationMonitorProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(3000); // 3 seconds

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      onRefresh();
      setLastUpdate(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  // Update last update time when animation data changes
  useEffect(() => {
    setLastUpdate(new Date());
  }, [animation]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-gray-600 bg-gray-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'ASSEMBLING': return 'text-orange-600 bg-orange-100';
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const completedSegments = animation.segments?.filter(s => s.status === 'COMPLETED').length || 0;
  const inProgressSegments = animation.segments?.filter(s => s.status === 'IN_PROGRESS').length || 0;
  const failedSegments = animation.segments?.filter(s => s.status === 'FAILED').length || 0;
  const pendingSegments = animation.total_segments - completedSegments - inProgressSegments - failedSegments;
  
  const progressPercentage = Math.round((completedSegments / animation.total_segments) * 100);
  const isProcessing = ['PENDING', 'IN_PROGRESS', 'ASSEMBLING'].includes(animation.status);

  const getEstimatedTimeRemaining = () => {
    if (animation.status === 'COMPLETED') return 'Завершено';
    if (animation.status === 'FAILED') return 'Ошибка';
    
    const remainingSegments = animation.total_segments - completedSegments;
    if (remainingSegments <= 0) return 'Сборка видео...';
    
    const avgTimePerSegment = 3; // minutes
    const estimatedMinutes = remainingSegments * avgTimePerSegment;
    
    if (estimatedMinutes < 1) return 'Менее минуты';
    if (estimatedMinutes < 60) return `~${estimatedMinutes} мин`;
    
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;
    return `~${hours}ч ${minutes}м`;
  };

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 10) return 'только что';
    if (diffSeconds < 60) return `${diffSeconds} сек назад`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} мин назад`;
    
    return date.toLocaleTimeString('ru-RU');
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card className="p-6 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${getStatusColor(animation.status)}`}>
              {getStatusIcon(animation.status)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Статус: {animation.status === 'PENDING' ? 'Ожидание' : 
                        animation.status === 'IN_PROGRESS' ? 'Генерация' :
                        animation.status === 'ASSEMBLING' ? 'Сборка видео' :
                        animation.status === 'COMPLETED' ? 'Завершено' :
                        animation.status === 'FAILED' ? 'Ошибка' : animation.status}
              </h2>
              <p className="text-gray-600">
                Осталось времени: {getEstimatedTimeRemaining()}
              </p>
            </div>
          </div>

          {/* Auto-refresh controls */}
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              Обновлено: {formatLastUpdate(lastUpdate)}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50 text-green-700 border-green-200' : ''}
              >
                {autoRefresh ? '🔄 Авто' : '⏸️ Ручной'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="min-w-[80px]"
              >
                {isRefreshing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <span>...</span>
                  </div>
                ) : (
                  '🔄 Обновить'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Прогресс сегментов: {completedSegments} / {animation.total_segments}</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            >
              {isProcessing && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{completedSegments}</div>
            <div className="text-sm text-green-600">Готово</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{inProgressSegments}</div>
            <div className="text-sm text-blue-600">В работе</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{pendingSegments}</div>
            <div className="text-sm text-gray-600">В очереди</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{failedSegments}</div>
            <div className="text-sm text-red-600">Ошибки</div>
          </div>
        </div>

        {/* Settings */}
        {autoRefresh && (
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Интервал обновления: {refreshInterval / 1000} сек
            </label>
            <div className="flex space-x-2">
              {[1000, 3000, 5000, 10000].map((interval) => (
                <Button
                  key={interval}
                  variant="outline"
                  size="sm"
                  onClick={() => setRefreshInterval(interval)}
                  className={refreshInterval === interval ? 'bg-blue-50 border-blue-200' : ''}
                >
                  {interval / 1000}с
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Segments Visualization */}
      {animation.segments && animation.segments.length > 0 && (
        <Card className="p-6 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Детали сегментов</h3>
          <AnimationSegments 
            segments={animation.segments}
            totalSegments={animation.total_segments}
          />
        </Card>
      )}

      {/* Processing Status Messages */}
      {isProcessing && (
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <h4 className="font-medium text-blue-800">
                {animation.status === 'PENDING' && 'Анимация добавлена в очередь обработки'}
                {animation.status === 'IN_PROGRESS' && 'Генерируем сегменты с помощью ИИ...'}
                {animation.status === 'ASSEMBLING' && 'Собираем финальное видео...'}
              </h4>
              <p className="text-blue-600 text-sm">
                Система автоматически обрабатывает анимацию. Вы можете закрыть страницу и вернуться позже.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Success Message */}
      {animation.status === 'COMPLETED' && (
        <Card className="p-4 bg-green-50 border border-green-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎉</span>
            <div>
              <h4 className="font-medium text-green-800">Анимация готова!</h4>
              <p className="text-green-600 text-sm">
                Все {animation.total_segments} сегментов успешно обработаны и собраны в финальное видео.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {animation.status === 'FAILED' && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">❌</span>
            <div>
              <h4 className="font-medium text-red-800">Ошибка обработки</h4>
              <p className="text-red-600 text-sm">
                Произошла ошибка при генерации анимации. Попробуйте создать новую анимацию.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 