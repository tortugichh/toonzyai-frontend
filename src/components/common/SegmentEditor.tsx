import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTaskProgress, useGenerateSegment } from '@/hooks/useAnimations';
import type { AnimationSegment } from '@/services/api';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface SegmentEditorProps {
  projectId: string;
  segment: AnimationSegment;
  onUpdate: () => void;
}

export function SegmentEditor({ projectId, segment, onUpdate }: SegmentEditorProps) {
  const [prompt, setPrompt] = useState(segment.segment_prompt || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSegmentMutation = useGenerateSegment();

  const { status: taskStatus } = useTaskProgress(
    (segment as any).task_id, 
    (result) => {
      onUpdate();
      setIsGenerating(false);
    }
  );

  const isPromptValid = prompt.trim().length >= 10;

  const handleGenerate = async () => {
    const effectivePrompt = prompt.trim();
    if (!isPromptValid) {
      alert('Prompt must be at least 10 characters');
      return;
    }
    try {
      setIsGenerating(true);
      await generateSegmentMutation.mutateAsync({
        projectId,
        segmentNumber: segment.segment_number,
        segmentPrompt: effectivePrompt,
      });
      onUpdate();
    } catch (error: any) {
      alert('Ошибка запуска генерации: ' + error.message);
      setIsGenerating(false);
    }
  };

  const getStatusIcon = () => {
    switch (segment.status) {
      case 'completed': return '✅';
      case 'in_progress': return '⏳';
      case 'failed': return '❌';
      default: return '⏸️';
    }
  };

  const getPromptSource = () => {
    if (segment.prompts?.prompt_source === 'custom') {
      return '🎯 Пользовательский';
    }
    return '📝 По умолчанию';
  };

  const progress = (segment as any).progress ?? 0;

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

      <div className="prompt-section mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Опишите что должно происходить в этом сегменте..."
          rows={3}
          className="prompt-input w-full p-2 border border-gray-300 rounded resize-vertical mb-3"
        />
      </div>

      {/* Progress bar */}
      {segment.status === 'in_progress' && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Прогресс</span><span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-2 bg-blue-500" style={{width:`${progress}%`}} />
          </div>
        </div>
      )}

      <div className="generation-section">
        <Button 
          onClick={handleGenerate}
          disabled={
            isGenerating ||
            segment.status === 'in_progress' ||
            segment.status === 'completed' ||
            generateSegmentMutation.isPending ||
            !isPromptValid
          }
          title={segment.status === 'completed' ? 'Сегмент уже сгенерирован' : undefined}
          className="btn-generate bg-blue-600 hover:bg-blue-700 text-white mb-3 disabled:opacity-50"
        >
          {isGenerating || generateSegmentMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Генерация...
            </div>
          ) : (
            '🎬 Генерировать видео'
          )}
        </Button>
        
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
      </div>
    </Card>
  );
} 