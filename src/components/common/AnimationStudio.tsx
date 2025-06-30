/**
 * AnimationStudio Component
 * Полная реализация согласно BACKEND_API_DOCUMENTATION.md
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAnimations, useUpdateSegmentPrompt, useGenerateSegment } from '@/hooks/useAnimations';
import { apiClient, getErrorMessage } from '@/services/api';
import VideoPreview from '@/components/common/VideoPreview';
import type { AnimationSegment } from '@/services/api';

interface AnimationStudioProps {
  projectId: string;
}

const AnimationStudio: React.FC<AnimationStudioProps> = ({ projectId }) => {
  const { currentProject, fetchProject, assembleVideo, loading, error } = useAnimations();
  const { updatePrompt } = useUpdateSegmentPrompt();
  const { generateSegment } = useGenerateSegment();
  
  const [segmentPrompts, setSegmentPrompts] = useState<{ [key: number]: string }>({});
  const [localError, setLocalError] = useState<string | null>(null);

  // Load project on mount
  useEffect(() => {
    fetchProject(projectId);
  }, [projectId, fetchProject]);

  // Helper functions
  const getStatusText = (status: string, statusDescription?: string): string => {
    if (statusDescription) {
      return statusDescription;
    }
    
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'in_progress': return 'Генерируется...';
      case 'completed': return 'Готово';
      case 'failed': return 'Ошибка';
      case 'assembling': return 'Собирается...';
      default: return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'assembling': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleUpdatePrompt = async (segmentNumber: number, prompt: string) => {
    const success = await updatePrompt(projectId, segmentNumber, prompt);
    if (success) {
      setSegmentPrompts(prev => ({ ...prev, [segmentNumber]: prompt }));
      // Refresh project to get updated data
      fetchProject(projectId);
    }
  };

  const handleGenerateSegment = async (segmentNumber: number, prompt?: string) => {
    try {
      setLocalError(null);
      const success = await generateSegment(projectId, segmentNumber, prompt);
      if (success) {
        console.log(`✅ Started generation for segment ${segmentNumber}`);
        // fetchProject will be called automatically via polling
      }
    } catch (err) {
      setLocalError(getErrorMessage(err));
    }
  };

  const handleAssembleVideo = async () => {
    const success = await assembleVideo(projectId);
    if (success) {
      console.log('✅ Started video assembly');
    }
  };

  const getVideoUrl = (segment: AnimationSegment): string | null => {
    // Use new API endpoint format with authentication
    if (segment.urls?.video_endpoint) {
      return segment.urls.video_endpoint;
    }
    
    if (segment.video_url) {
      return segment.video_url;
    }

    // Fallback to standard endpoint
    return apiClient.getSegmentVideoUrl(projectId, segment.segment_number);
  };

  if (loading && !currentProject) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Загрузка проекта...</span>
      </div>
    );
  }

  if (error || localError) {
    return (
      <Card className="p-6">
        <div className="text-red-600">
          <h3 className="font-semibold mb-2">Ошибка</h3>
          <p className="text-sm">{error || localError}</p>
          <Button 
            onClick={() => fetchProject(projectId)} 
            className="mt-4"
            size="sm"
          >
            Попробовать снова
          </Button>
        </div>
      </Card>
    );
  }

  if (!currentProject) {
    return (
      <Card className="p-6">
        <div className="text-gray-600 text-center">
          <p>Проект не найден</p>
        </div>
      </Card>
    );
  }

  const completedSegments = currentProject.segments.filter(s => s.status === 'completed');
  const canAssemble = completedSegments.length > 0 && !currentProject.final_video_url;

  return (
    <div className="space-y-6">
      {/* Project Info */}
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">Проект анимации</h2>
            <p className="text-gray-600 text-sm mt-1">{currentProject.animation_prompt}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentProject.status)}`}>
            {getStatusText(currentProject.status)}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Сегментов:</span>
            <div className="font-medium">{currentProject.segments.length}/{currentProject.total_segments}</div>
          </div>
          <div>
            <span className="text-gray-500">Готово:</span>
            <div className="font-medium text-green-600">{completedSegments.length}</div>
          </div>
          <div>
            <span className="text-gray-500">Создан:</span>
            <div className="font-medium">{new Date(currentProject.created_at).toLocaleDateString()}</div>
          </div>
          <div>
            <span className="text-gray-500">ID проекта:</span>
            <div className="font-mono text-xs">{currentProject.id}</div>
          </div>
        </div>
      </Card>

      {/* Segments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Управление сегментами</h3>
        
        {currentProject.segments.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-gray-600">
              <p>⏳ Сегменты создаются...</p>
              <p className="text-sm mt-1">Это может занять 30-60 секунд</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {currentProject.segments
              .sort((a, b) => a.segment_number - b.segment_number)
              .map((segment) => (
                <Card key={segment.id} className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">Сегмент {segment.segment_number}</h4>
                    <span className={`px-2 py-1 rounded text-sm ${getStatusColor(segment.status)}`}>
                      {getStatusText(segment.status, segment.status_description)}
                    </span>
                  </div>

                  {/* Enhanced info display */}
                  {segment.generation && (
                    <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Генератор:</span>
                          <div className="font-medium">{segment.generation.generator}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Качество:</span>
                          <div className="font-medium">{segment.generation.quality}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Длительность:</span>
                          <div className="font-medium">{segment.generation.duration}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Время:</span>
                          <div className="font-medium">{segment.generation.estimated_time}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prompt Management */}
                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Промпт для сегмента:
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={segmentPrompts[segment.segment_number] ?? segment.segment_prompt ?? ''}
                        onChange={(e) => setSegmentPrompts(prev => ({
                          ...prev,
                          [segment.segment_number]: e.target.value
                        }))}
                        placeholder={`Опишите действие для сегмента ${segment.segment_number}...`}
                        className="text-sm"
                        disabled={segment.status === 'in_progress'}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdatePrompt(
                          segment.segment_number,
                          segmentPrompts[segment.segment_number] ?? ''
                        )}
                        disabled={
                          segment.status === 'in_progress' ||
                          !segmentPrompts[segment.segment_number]?.trim()
                        }
                      >
                        💾 Сохранить
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mb-3">
                    {segment.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateSegment(segment.segment_number)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        🎨 Генерировать
                      </Button>
                    )}

                    {(segment.status === 'completed' || segment.status === 'failed') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateSegment(
                          segment.segment_number, 
                          segmentPrompts[segment.segment_number] || segment.segment_prompt || undefined
                        )}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        🔄 Перегенерировать
                      </Button>
                    )}

                    {/* Enhanced video viewing */}
                    {segment.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const videoUrl = getVideoUrl(segment);
                          if (videoUrl) {
                            window.open(videoUrl, '_blank');
                          }
                        }}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        title="Открыть видео в новой вкладке"
                      >
                        👁️ Просмотр
                      </Button>
                    )}
                  </div>

                  {/* Generated Video Display */}
                  {segment.status === 'completed' && (
                    <div className="mt-3">
                      <label className="text-xs font-medium text-gray-600 block mb-2">
                        Сгенерированное видео:
                      </label>
                      <VideoPreview
                        videoUrl={segment.video_url}
                        segmentNumber={segment.segment_number}
                        projectId={projectId}
                        segment={segment as any}
                        title={`Сегмент ${segment.segment_number}`}
                        className="w-full max-w-md h-32"
                        onError={(error) => console.error('❌ Video error for segment:', segment.segment_number, error)}
                      />
                    </div>
                  )}

                  {/* Debug Information */}
                  {process.env.NODE_ENV === 'development' && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
                      <pre className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 rounded overflow-auto">
                        {JSON.stringify({
                          id: segment.id,
                          status: segment.status,
                          video_url: segment.video_url,
                          urls: segment.urls,
                          actions: segment.actions
                        }, null, 2)}
                      </pre>
                    </details>
                  )}
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Final Video Assembly */}
      {canAssemble && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Финальная сборка</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Готово сегментов: {completedSegments.length} из {currentProject.total_segments}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Собрать все готовые сегменты в единое видео
              </p>
            </div>
            <Button
              onClick={handleAssembleVideo}
              disabled={currentProject.status === 'assembling'}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {currentProject.status === 'assembling' ? '⏳ Собирается...' : '🎬 Собрать видео'}
            </Button>
          </div>
        </Card>
      )}

      {/* Final Video */}
      {currentProject.final_video_url && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">✅ Финальное видео готово!</h3>
          <div className="space-y-4">
            <VideoPreview
              videoUrl={currentProject.final_video_url}
              title="Финальное видео"
              className="w-full max-w-2xl"
              onError={(error) => console.error('❌ Final video error:', error)}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => window.open(apiClient.getFinalVideoUrl(projectId), '_blank')}
                variant="outline"
              >
                📁 Открыть в новой вкладке
              </Button>
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = apiClient.getFinalVideoUrl(projectId);
                  link.download = `animation-${projectId}.mp4`;
                  link.click();
                }}
                variant="outline"
              >
                💾 Скачать
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnimationStudio; 