import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusIcon, ActionIcon } from '@/components/ui/icons';
import { useTaskProgress, useGenerateSegment, useSegmentProgressWS, useUpdateSegmentPrompt } from '@/hooks/useAnimations';
import type { AnimationSegment } from '@/services/api';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { toastError, toastSuccess } from '@/utils/toast';

interface SegmentEditorProps {
  projectId: string;
  segment: AnimationSegment;
  onUpdate: () => void;
  animationType?: 'sequential' | 'independent';
  isNextAllowed?: boolean;
}

export function SegmentEditor({ projectId, segment, onUpdate, animationType, isNextAllowed = true }: SegmentEditorProps) {
  const [prompt, setPrompt] = useState(segment.segment_prompt ?? '');
  const [isEditing, setIsEditing] = useState(!segment.segment_prompt);
  const [isGenerating, setIsGenerating] = useState(false);

  const updatePromptMutation = useUpdateSegmentPrompt();
  const generateSegmentMutation = useGenerateSegment();

  // live progress via WebSocket (только если сегмент не завершён)
  const skipWS = segment.status === 'completed' || segment.status === 'failed';
  useSegmentProgressWS(segment.id, projectId, skipWS);

  const handleGenerateClick = async () => {
    if (prompt.trim().length < 10) {
      toastError('Промпт должен содержать минимум 10 символов');
      return;
    }
    setIsGenerating(true);
    try {
      // 1) сохраняем промпт если он новый
      if (prompt !== segment.segment_prompt) {
        await updatePromptMutation.mutateAsync({
          projectId,
          segmentNumber: segment.segment_number,
          segmentPrompt: prompt.trim(),
        });
      }
      // 2) запускаем генерацию
      await generateSegmentMutation.mutateAsync({
        projectId,
        segmentNumber: segment.segment_number,
        segmentPrompt: prompt.trim(),
      });
      // прячем textarea, показываем текст
      setIsEditing(false);
      onUpdate();
    } catch (error:any) {
      toastError(error.message || 'Ошибка при генерации сегмента');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = () => {
    switch (segment.status) {
      case 'completed': return <StatusIcon status="completed" className="w-4 h-4" />;
      case 'in_progress': return <StatusIcon status="inProgress" className="w-4 h-4" />;
      case 'pending': return <StatusIcon status="pending" className="w-4 h-4" />;
      case 'failed': return <StatusIcon status="failed" className="w-4 h-4" />;
      default: return <StatusIcon status="unknown" className="w-4 h-4" />;
    }
  };
  
  const getStatusText = () => {
    const progress = segment.progress ?? 0;
    switch (segment.status) {
      case 'completed': return 'Готово';
      case 'in_progress': return `В процессе (${progress}%)`;
      case 'pending': return 'В очереди';
      case 'failed': return 'Ошибка';
      default: return 'Неизвестно';
    }
  };

  const getPromptSource = () => {
    if (segment.prompts?.prompt_source === 'custom') {
      return 'Пользовательский';
    }
    return '📝 По умолчанию';
  };

  return (
    <Card className="segment-editor p-4 mb-4 bg-white shadow-sm">
      <div className="segment-header flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">
          Сегмент {segment.segment_number} {getStatusIcon()}
        </h3>
        <span className="prompt-source text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
          {getPromptSource()}
        </span>
      </div>

      <div className="prompt-source mt-4">
        {isEditing ? (
          <textarea
            className="prompt-input w-full p-2 border border-gray-300 rounded resize-vertical"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Введите детальное описание для этого сегмента..."
            rows={4}
          />
        ) : (
          <div className="prompt-display group relative">
            <p className="text-gray-700 whitespace-pre-wrap pr-8">
              {prompt || 'Промпт не задан'}
            </p>
            {/* Редактировать */}
            {segment.status !== 'completed' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              >
                <ActionIcon action="edit" className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {segment.status === 'in_progress' && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Прогресс</span><span>{segment.progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-2 bg-blue-500" style={{width:`${segment.progress}%`}} />
          </div>
        </div>
      )}

      {segment.status !== 'completed' && (
        <div className="actions mt-4">
          <Button
            onClick={handleGenerateClick}
            disabled={isGenerating || segment.status === 'in_progress' || !prompt.trim() || (animationType === 'sequential' && !isNextAllowed)}
            className="btn-generate"
          >
            {isGenerating ? (
          <>
            <ActionIcon action="loading" className="w-4 h-4 mr-2" animate />
            Генерация...
          </>
        ) : (
          <>
            <ActionIcon action="play" className="w-4 h-4 mr-2" />
            Сгенерировать видео
          </>
        )}
          </Button>
          {animationType === 'sequential' && !isNextAllowed && (
            <div className="text-xs text-blue-600 mt-2">Доступно только после завершения предыдущего сегмента</div>
          )}
        </div>
      )}

      {segment.generated_video_url && (
        <div className="video-preview">
          <video 
            src={segment.generated_video_url} 
            controls 
            className="segment-video w-full max-w-md rounded shadow-sm"
          />
        </div>
      )}

      {segment.video_url && !segment.generated_video_url && (
        <div className="video-preview">
          <LazyLoadImage 
            src={segment.start_frame_url}
            alt={`Сегмент ${segment.segment_number}`}
            effect="blur"
            className="w-full max-w-md h-40 object-cover rounded"
          />
        </div>
      )}
    </Card>
  );
} 