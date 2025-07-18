import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AnimationProject as AnimationProjectComponent } from '@/components/common';

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  if (!projectId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600 text-lg">Project ID not specified</p>
        <Button onClick={() => navigate('/studio')}>← Back to projects</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <AnimationProjectComponent projectId={projectId} onBack={() => navigate('/studio')} />
    </div>
  );
} 