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
        <p className="text-gray-600 text-lg">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="error text-center py-10">
        <p className="text-red-600 text-lg">Project not found</p>
        <Button onClick={onBack} className="mt-4">← Back</Button>
      </div>
    );
  }

  const handleAssembleVideo = async () => {
    try {
      const resp = await assembleVideoMutation.mutateAsync(projectId);
      refetch();
    } catch (error: any) {
      toastError('Video assembly error: ' + error.message);
    }
  };

  const allSegmentsCompleted = segments.every(segment => segment.status === 'completed');
  const hasSegmentsInProgress = segments.some(segment => 
    segment.status === 'in_progress' || segment.status === 'pending'
  );

  const handleDownload = async () => {
    if (!project.final_video_url) return;
    try {
      const response = await fetch(project.final_video_url, { mode: 'cors' });
      if (!response.ok) throw new Error('File download error');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `animation-${project.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Could not download video. Try opening the link in a new tab.');
    }
  };

  return (
    <div className="animation-project max-w-4xl mx-auto p-6">
      <div className="project-header flex items-center gap-4 mb-6">
        <Button 
          onClick={onBack} 
          variant="outline"
          className="btn-back"
        >
          ← Back
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            Animation Project Editor
          </h2>
        </div>
      </div>

      {/* Animation type info */}
      <Card className="mb-4 p-4 border-2 border-dashed border-blue-400 bg-blue-50">
        <div className="flex items-center gap-3">
          {project.animation_type === 'sequential' ? (
            <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-semibold text-sm">Sequential Frames</span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-gray-400 text-white font-semibold text-sm">Independent Frames</span>
          )}
          <span className="text-gray-700 text-sm">
            {project.animation_type === 'sequential'
              ? 'The next segment can only be created after the previous one is completed.'
              : 'You can create and generate any segments in any order.'}
          </span>
        </div>
      </Card>

      {/* Project Status */}
      <Card className="project-status p-4 mb-6 bg-blue-50 border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-blue-900">Project Status</h3>
            <p className="text-blue-700">
              {project.status === 'completed' && '✅ Completed'}
              {project.status === 'in_progress' && '⏳ In Progress'}
              {project.status === 'pending' && '⏸️ Pending'}
              {project.status === 'assembling' && '🎬 Assembling Video'}
              {project.status === 'failed' && '❌ Error'}
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
                  Assembling video...
                </div>
              ) : (
                '🎬 Assemble Final Video'
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
          <h3 className="font-semibold text-green-900 mb-3">Final Video is Ready!</h3>
          <video 
            src={project.final_video_url} 
            controls 
            className="w-full max-w-2xl rounded shadow-lg"
          />
          <div className="mt-4 flex justify-end">
            <a
              href={project.final_video_url}
              download={`animation-${project.id}.mp4`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow transition"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
              </svg>
              Download Video
            </a>
          </div>
        </Card>
      )}

      {/* Segments */}
      <div className="segments-section">
        <h3 className="text-xl font-semibold mb-4">
          Segments ({segments.length})
        </h3>
        
        {segments.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-600">No segments found</p>
          </Card>
        ) : (
          <div className="segments-list space-y-4">
            {segments
              .sort((a, b) => a.segment_number - b.segment_number)
              .map((segment, idx) => (
                <SegmentEditor 
                  key={`${segment.id}-${segment.segment_number}`}
                  projectId={projectId}
                  segment={segment}
                  onUpdate={() => {
                    refresh();
                    refetch();
                  }}
                  animationType={project.animation_type}
                  isNextAllowed={project.animation_type !== 'sequential' || idx === 0 || segments[idx-1]?.status === 'completed'}
                />
              ))
            }
          </div>
        )}
      </div>

      {/* Progress Summary */}
      <Card className="progress-summary p-4 mt-6 bg-gray-50">
        <h4 className="font-semibold mb-2">Progress</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {segments.filter(s => s.status === 'completed').length}
            </div>
            <div className="text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {segments.filter(s => s.status === 'in_progress').length}
            </div>
            <div className="text-gray-600">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {segments.filter(s => s.status === 'pending').length}
            </div>
            <div className="text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {segments.filter(s => s.status === 'failed').length}
            </div>
            <div className="text-gray-600">Errors</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
