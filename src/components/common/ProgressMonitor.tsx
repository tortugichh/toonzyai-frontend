import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AnimationProject } from '@/services/api';

interface ProgressMonitorProps {
  project: AnimationProject;
  onRefresh: () => void;
  autoRefresh?: boolean;
}

export default function ProgressMonitor({ project, onRefresh, autoRefresh = true }: ProgressMonitorProps) {
  const [isAuto, setIsAuto] = useState(autoRefresh);

  useEffect(() => {
    if (!isAuto) return;
    const id = setInterval(onRefresh, 15000);
    return () => clearInterval(id);
  }, [isAuto, onRefresh]);

  const completed = project.segments.filter((s) => s.status === 'completed').length;
  const inProg = project.segments.filter((s) => s.status === 'in_progress').length;
  const failed = project.segments.filter((s) => s.status === 'failed').length;
  const pending = project.total_segments - completed - inProg - failed;
  const percent = Math.round((completed / project.total_segments) * 100);

  return (
    <Card className="p-4 mb-6 bg-white/80">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold">Прогресс проекта</h4>
        <Button size="sm" variant="outline" onClick={() => setIsAuto((v) => !v)}>
          {isAuto ? '⏸️ Авто' : '🔄 Авто'}
        </Button>
      </div>
      <div className="mb-2 w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-3 bg-green-500" style={{ width: `${percent}%` }} />
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs text-gray-700">
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span>{completed} Готово</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>{inProg} В работе</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full"></span>{pending} Ожидает</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span>{failed} Ошибки</span>
      </div>
    </Card>
  );
} 