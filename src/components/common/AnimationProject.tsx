import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSegments, useAnimationProject, useAssembleVideo } from '@/hooks/useAnimations';
import { SegmentEditor } from './SegmentEditor';
import ProgressMonitor from './ProgressMonitor';
import { toastError } from '@/utils/toast';

interface AnimationProjectProps {
  projectId: string;
  onBack: () => void;
}

export function AnimationProject({ projectId, onBack }: AnimationProjectProps) {
  const { data: project, isLoading, refetch } = useAnimationProject(projectId);
  const { segments, loading: segmentsLoading, refresh } = useSegments(projectId);
  const assembleVideoMutation = useAssembleVideo();

  if (isLoading || segmentsLoading) {
    return (
      <div className="loading text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Загрузка проекта...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="error text-center py-10">
        <p className="text-red-600 text-lg">Проект не найден</p>
        <Button onClick={onBack} className="mt-4">← Назад</Button>
      </div>
    );
  }

  const handleAssembleVideo = async () => {
    console.log('[UI] ▶️ Assemble video button clicked', { projectId });
    try {
      const resp = await assembleVideoMutation.mutateAsync(projectId);
      console.log('[UI] ✅ Assemble video API response', resp);
      refetch();
    } catch (error: any) {
      console.error('[UI] ❌ Assemble video error', error);
      toastError('Ошибка сборки видео: ' + error.message);
    }
  };

  const allSegmentsCompleted = segments.every(segment => segment.status === 'completed');
  const hasSegmentsInProgress = segments.some(segment => 
    segment.status === 'in_progress' || segment.status === 'pending'
  );

  return (
    <div className="animation-project max-w-4xl mx-auto p-6">
      <div className="project-header flex items-center gap-4 mb-6">
        <Button 
          onClick={onBack} 
          variant="outline"
          className="btn-back"
        >
          ← Назад
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            Редактор анимационного проекта
          </h2>
        </div>
      </div>

      {/* Project Status */}
      <Card className="project-status p-4 mb-6 bg-blue-50 border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-blue-900">Статус проекта</h3>
            <p className="text-blue-700">
              {project.status === 'completed' && '✅ Завершен'}
              {project.status === 'in_progress' && '⏳ В процессе'}
              {project.status === 'pending' && '⏸️ Ожидает'}
              {project.status === 'assembling' && '🎬 Сборка видео'}
              {project.status === 'failed' && '❌ Ошибка'}
            </p>
          </div>
          
          {allSegmentsCompleted && project.status !== 'assembling' && !project.final_video_url && (
            <Button 
              onClick={handleAssembleVideo}
              disabled={assembleVideoMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
            >
              {assembleVideoMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Сборка видео...
                </div>
              ) : (
                '🎬 Собрать финальное видео'
              )}
            </Button>
          )}
        </div>

        
      </Card>

      {/* Global Progress Monitor */}
      <ProgressMonitor project={project} onRefresh={refetch} />

      {/* Final Video */}
      {project.final_video_url && (
        <Card className="final-video p-4 mb-6 bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-900 mb-3">🎊 Финальное видео готово!</h3>
          <video 
            src={project.final_video_url} 
            controls 
            className="w-full max-w-2xl rounded shadow-lg"
          />
          
        </Card>
      )}

     

      {/* Segments */}
      <div className="segments-section">
        <h3 className="text-xl font-semibold mb-4">
          Сегменты ({segments.length})
        </h3>
        
        {segments.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-600">Сегменты не найдены</p>
          </Card>
        ) : (
          <div className="segments-list space-y-4">
            {segments
              .sort((a, b) => a.segment_number - b.segment_number)
              .map(segment => (
                <SegmentEditor 
                  key={`${segment.id}-${segment.segment_number}`}
                  projectId={projectId}
                  segment={segment}
                  onUpdate={() => {
                    refresh();
                    refetch();
                  }}
                />
              ))
            }
          </div>
        )}
      </div>

      {/* Progress Summary */}
      <Card className="progress-summary p-4 mt-6 bg-gray-50">
        <h4 className="font-semibold mb-2">Прогресс</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {segments.filter(s => s.status === 'completed').length}
            </div>
            <div className="text-gray-600">Завершено</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {segments.filter(s => s.status === 'in_progress').length}
            </div>
            <div className="text-gray-600">В процессе</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {segments.filter(s => s.status === 'pending').length}
            </div>
            <div className="text-gray-600">Ожидает</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {segments.filter(s => s.status === 'failed').length}
            </div>
            <div className="text-gray-600">Ошибки</div>
          </div>
        </div>
      </Card>
    </div>
  );
} 