import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBulkUpdatePrompts } from '@/hooks/useAnimations';
import type { AnimationProject } from '@/services/api';

interface PromptPlannerProps {
  project: AnimationProject;
  onSaved?: () => void;
}

export default function PromptPlanner({ project, onSaved }: PromptPlannerProps) {
  const { mutateAsync: savePrompts, isPending } = useBulkUpdatePrompts();

  const [prompts, setPrompts] = useState(() => {
    const initial: Record<number, string> = {};
    for (let i = 1; i <= project.total_segments; i++) {
      const seg = project.segments.find((s) => s.segment_number === i);
      initial[i] = seg?.segment_prompt ?? seg?.prompts?.segment_prompt ?? '';
    }
    return initial;
  });

  const handleChange = (index: number, value: string) => {
    setPrompts((prev) => ({ ...prev, [index]: value }));
  };

  const allValid = useMemo(() => {
    return Object.values(prompts).every((p) => p.trim().length >= 10);
  }, [prompts]);

  const handleSave = async () => {
    const payload = Object.entries(prompts).map(([k, v]) => ({
      segment_number: Number(k),
      segment_prompt: v.trim(),
    }));
    try {
      await savePrompts({ projectId: project.id, prompts: payload });
      onSaved?.();
    } catch (err) {
      console.error('Save prompts error', err);
    }
  };

  return (
    <Card className="p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Prompt Planner</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: project.total_segments }, (_, idx) => {
          const num = idx + 1;
          const isInvalid = prompts[num].trim().length < 10;
          return (
            <div key={num} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Segment {num}
              </label>
              <textarea
                value={prompts[num]}
                onChange={(e) => handleChange(num, e.target.value)}
                rows={3}
                placeholder="Enter at least 10 characters..."
                className={`w-full p-2 border rounded bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isInvalid ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {isInvalid && (
                <p className="text-xs text-red-500">Minimum 10 characters required</p>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!allValid || isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          {isPending ? 'Saving...' : '💾 Save Prompts'}
        </Button>
      </div>
    </Card>
  );
}
