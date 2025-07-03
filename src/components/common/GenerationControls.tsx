import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useGenerateAllSegments } from '@/hooks/useAnimations';
import type { AnimationProject } from '@/services/api';

interface GenerationControlsProps {
  project: AnimationProject;
  promptsFilled: boolean; // from PromptPlanner validation
  onStarted?: () => void;
}

export default function GenerationControls({ project, promptsFilled, onStarted }: GenerationControlsProps) {
  const { mutateAsync: generateAll, isPending } = useGenerateAllSegments();

  const canGenerateAll = useMemo(() => {
    if (!promptsFilled) return false;
    const hasGenerating = project.segments.some((s) => s.status === 'in_progress' || s.status === 'pending');
    const allCompleted = project.segments.every((s) => s.status === 'completed');
    return !hasGenerating && !allCompleted;
  }, [project.segments, promptsFilled]);

  const handleGenerateAll = async () => {
    if (!canGenerateAll) return;
    try {
      await generateAll({ projectId: project.id });
      onStarted?.();
    } catch (err) {
      console.error('Generate all error', err);
    }
  };

  return (
    <div className="mb-6 flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded">
      <div>
        <h4 className="font-semibold text-blue-800">Параллельная генерация</h4>
        {!promptsFilled && <p className="text-xs text-blue-600">Заполните все промпты (≥10 симв.)</p>}
      </div>
      <Button
        onClick={handleGenerateAll}
        disabled={!canGenerateAll || isPending}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? 'Запуск...' : '🚀 Сгенерировать все'}
      </Button>
    </div>
  );
} 