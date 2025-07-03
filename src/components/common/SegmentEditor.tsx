import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTaskProgress, useGenerateSegment } from '@/hooks/useAnimations';
import type { AnimationSegment } from '@/services/api';

interface SegmentEditorProps {
  projectId: string;
  segment: AnimationSegment;
  onUpdate: () => void;
}

export function SegmentEditor({ projectId, segment, onUpdate }: SegmentEditorProps) {
  const [prompt, setPrompt] = useState(segment.segment_prompt || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSegmentMutation = useGenerateSegment();

  const { status: taskStatus } = useTaskProgress(
    (segment as any).task_id, 
    (result) => {
      onUpdate();
      setIsGenerating(false);
    }
  );

  const handleSavePrompt = async () => {
    // В API v2 нет отдельного endpoint для обновления промпта.
    // Сохраняем только локально – фактически prompt уйдёт при следующем generate.
    setIsEditing(false);
    onUpdate();
  };

  const handleGenerate = async () => {
    const effectivePrompt = prompt.trim() || segment.prompts?.project_prompt || segment.segment_prompt || '';
    if (!effectivePrompt) {
      alert('Укажите prompt для сегмента');
      return;
    }
    try {
      setIsGenerating(true);
      await generateSegmentMutation.mutateAsync({
        projectId,
        segmentNumber: segment.segment_number,
        segmentPrompt: effectivePrompt
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
        {isEditing ? (
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Опишите что должно происходить в этом сегменте..."
              rows={3}
              className="prompt-input w-full p-2 border border-gray-300 rounded resize-vertical"
            />
            <div className="prompt-actions mt-2 flex gap-2">
              <Button 
                onClick={handleSavePrompt}
                disabled={generateSegmentMutation.isPending}
                className="btn-save bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
              >
                {generateSegmentMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
              <Button 
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="btn-cancel px-3 py-1 text-sm"
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="prompt-display p-2 bg-gray-50 rounded mb-2 min-h-[40px]">
              {segment.segment_prompt || segment.prompts?.project_prompt || 'Промпт не задан'}
            </p>
            <Button 
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="btn-edit text-sm"
            >
              ✏️ Редактировать промпт
            </Button>
          </div>
        )}
      </div>

      <div className="generation-section">
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating || segment.status === 'in_progress' || generateSegmentMutation.isPending}
          className="btn-generate bg-blue-600 hover:bg-blue-700 text-white mb-3"
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
            <video 
              src={segment.video_url} 
              controls 
              className="segment-video w-full max-w-md rounded shadow-sm"
            />
          </div>
        )}
      </div>
    </Card>
  );
} 