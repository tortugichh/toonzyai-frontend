import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusIcon, ActionIcon } from '@/components/ui/icons';
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
      case 'PENDING': return <StatusIcon status="pending" className="w-4 h-4" />;
      case 'IN_PROGRESS': return <StatusIcon status="inProgress" className="w-4 h-4" />;
      case 'ASSEMBLING': return <StatusIcon status="assembling" className="w-4 h-4" />;
      case 'COMPLETED': return <StatusIcon status="completed" className="w-4 h-4" />;
      case 'FAILED': return <StatusIcon status="failed" className="w-4 h-4" />;
      default: return <StatusIcon status="unknown" className="w-4 h-4" />;
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

  const completedSegments = animation.segments?.filter(s => s.status === 'completed').length || 0;
  const inProgressSegments = animation.segments?.filter(s => s.status === 'in_progress').length || 0;
  const failedSegments = animation.segments?.filter(s => s.status === 'failed').length || 0;
  const pendingSegments = animation.total_segments - completedSegments - inProgressSegments - failedSegments;
  
  const progressPercentage = Math.round((completedSegments / animation.total_segments) * 100);
  const isProcessing = ['pending', 'in_progress', 'assembling'].includes(animation.status);

  const getEstimatedTimeRemaining = () => {
    if (animation.status === 'completed') return 'Завершено';
    if (animation.status === 'failed') return 'Ошибка';
    
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
                Статус: {animation.status === 'pending' ? 'Ожидание' : 
                        animation.status === 'in_progress' ? 'Генерация' :
                        animation.status === 'assembling' ? 'Сборка видео' :
                        animation.status === 'completed' ? 'Завершено' :
                        animation.status === 'failed' ? 'Ошибка' : animation.status}
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
                  <>
                  <ActionIcon action="refresh" className="w-4 h-4 mr-2" animate={isRefreshing} />
                  Обновить
                </>
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
                {animation.status === 'pending' && 'Анимация добавлена в очередь обработки'}
                {animation.status === 'in_progress' && 'Генерируем сегменты с помощью ИИ...'}
                {animation.status === 'assembling' && 'Собираем финальное видео...'}
              </h4>
              <p className="text-blue-600 text-sm">
                Система автоматически обрабатывает анимацию. Вы можете закрыть страницу и вернуться позже.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Success Message */}
      {animation.status === 'completed' && (
        <Card className="p-4 bg-green-50 border border-green-200">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
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
      {animation.status === 'failed' && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <div className="flex items-center space-x-3">
            <StatusIcon status="failed" className="w-8 h-8" />
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