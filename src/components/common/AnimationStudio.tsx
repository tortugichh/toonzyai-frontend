import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  useAnimationProject, 
  useGenerateSegment, 
  useAssembleVideo, 
  useGenerateAllSegments 
} from '@/hooks/useAnimations';
import { useProjectProgressWS } from '@/hooks/useAnimations';
import { apiClient, getErrorMessage } from '@/services/api';
import VideoPreview from '@/components/common/VideoPreview';
import type { AnimationSegment } from '@/services/api';
import { toastError } from '@/utils/toast';

interface AnimationStudioProps {
  projectId: string;
}

const AnimationStudio: React.FC<AnimationStudioProps> = ({ projectId }) => {
  const { data: currentProject, isLoading: loading, error, refetch: fetchProject } = useAnimationProject(projectId);
  const { mutateAsync: generateSegment } = useGenerateSegment();
  const { mutateAsync: assembleVideo } = useAssembleVideo();
  const { mutateAsync: generateAllSegments, isPending: isGeneratingAll } = useGenerateAllSegments();
  
  const [segmentPrompts, setSegmentPrompts] = useState<{ [key: number]: string }>({});
  const [localError, setLocalError] = useState<string | null>(null);

  // Load project on mount
  useEffect(() => {
    fetchProject();
  }, [projectId, fetchProject]);

  // Subscribe to websocket progress
  useProjectProgressWS(projectId);

  // In API v2 generation requires a mandatory segment_prompt,
  // so auto-generation for pending segments is disabled.
  // The user must provide a prompt manually in the UI.

  const getStatusText = (status: string, statusDescription?: string): string => {
    if (statusDescription) {
      return statusDescription;
    }
    
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'Generating...';
      case 'completed': return 'Completed';
      case 'failed': return 'Error';
      case 'assembling': return 'Assembling...';
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

  const handleUpdatePrompt = (segmentNumber: number, prompt: string) => {
    setSegmentPrompts(prev => ({ ...prev, [segmentNumber]: prompt }));
  };

  const handleGenerateSegment = async (segmentNumber: number, prompt?: string) => {
    const segmentObj = currentProject?.segments.find(s => s.segment_number === segmentNumber);
    const fallbackPrompt = segmentObj?.segment_prompt || segmentObj?.prompts?.project_prompt || '';
    const effectivePrompt = (prompt ?? segmentPrompts[segmentNumber] ?? fallbackPrompt).trim();
    if (effectivePrompt.length < 10) {
      toastError('Prompt must be at least 10 characters');
      return;
    }
    try {
      setLocalError(null);
      await generateSegment({ projectId, segmentNumber, segmentPrompt: effectivePrompt });
      console.log(`✅ Started generation for segment ${segmentNumber}`);
    } catch (err) {
      setLocalError(getErrorMessage(err));
    }
  };

  const handleAssembleVideo = async () => {
    try {
      await assembleVideo(projectId);
      console.log('✅ Started video assembly');
    } catch (error) {
      setLocalError(getErrorMessage(error));
    }
  };

  const handleGenerateAll = async () => {
    try {
      if (!currentProject) return;

      setLocalError(null);

      const bulkPrompts = currentProject.segments.map(seg => {
        const localPrompt = segmentPrompts[seg.segment_number];
        const effective = (localPrompt ?? seg.segment_prompt ?? seg.prompts?.project_prompt ?? '').trim();
        return { segment_number: seg.segment_number, segment_prompt: effective };
      });

      const invalid = bulkPrompts.filter(p => p.segment_prompt.length < 10);
      if (invalid.length > 0) {
        toastError(`Please provide prompts (≥10 characters) for segments: ${invalid.map(i => i.segment_number).join(', ')}`);
        return;
      }

      await apiClient.updateSegmentPromptsBulk(projectId, bulkPrompts);
      await generateAllSegments({ projectId, forceRegenerate: false });
      console.log('🚀 Parallel generation started for all segments');
    } catch (err) {
      setLocalError(getErrorMessage(err));
    }
  };

  const getVideoUrl = (segment: AnimationSegment): string | null => {
    if (segment.urls?.video_endpoint) {
      return segment.urls.video_endpoint;
    }
    if (segment.video_url) {
      return segment.video_url;
    }
    return apiClient.getSegmentVideoUrl(projectId, segment.segment_number);
  };

  if (loading && !currentProject) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading project...</span>
      </div>
    );
  }

  if (error || localError) {
    return (
      <Card className="p-6">
        <div className="text-red-600">
          <h3 className="font-semibold mb-2">Error</h3>
          <p className="text-sm">{getErrorMessage(error) || localError}</p>
          <Button 
            onClick={() => fetchProject()} 
            className="mt-4"
            size="sm"
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!currentProject) {
    return (
      <Card className="p-6">
        <div className="text-gray-600 text-center">
          <p>Project not found</p>
        </div>
      </Card>
    );
  }

  const completedSegments = currentProject.segments.filter(s => s.status === 'completed');
  const totalProgressPoints = currentProject.segments.reduce((sum, seg) => sum + (seg.progress ?? (seg.status === 'completed' ? 100 : 0)), 0);
  const progressPercent = Math.round(totalProgressPoints / (currentProject.total_segments * 100) * 100);
  const canAssemble = completedSegments.length > 0 && !currentProject.final_video_url;

  return (
    <div className="space-y-6">
      {/* Project Info */}
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">Animation Project</h2>
            <p className="text-gray-600 text-sm mt-1">{currentProject.animation_prompt}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentProject.status)}`}>
            {getStatusText(currentProject.status)}
          </span>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full mb-4">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs mt-1 text-gray-500 text-right">{progressPercent}%</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Segments:</span>
            <div className="font-medium">{currentProject.segments.length}/{currentProject.total_segments}</div>
          </div>
          <div>
            <span className="text-gray-500">Completed:</span>
            <div className="font-medium text-green-600">{completedSegments.length}</div>
          </div>
          <div>
            <span className="text-gray-500">Created:</span>
            <div className="font-medium">{new Date(currentProject.created_at).toLocaleDateString()}</div>
          </div>
          <div>
            <span className="text-gray-500">Project ID:</span>
            <div className="font-mono text-xs">{currentProject.id}</div>
          </div>
        </div>

        {/* Generate All Segments */}
        {currentProject.status === 'pending' && (
          <div className="mt-6">
            <Button
              onClick={handleGenerateAll}
              disabled={isGeneratingAll}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGeneratingAll ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Starting generation...
                </div>
              ) : (
                '🚀 Generate All Segments'
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Segments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Segment Management</h3>
        
        {currentProject.segments.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-gray-600">
              <p>⏳ Creating segments...</p>
              <p className="text-sm mt-1">This may take 30–60 seconds</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {Array.from({ length: currentProject.total_segments }, (_, idx) => {
              const segment = currentProject.segments.find(s => s.segment_number === idx + 1);
              const segKey = segment?.id ?? `placeholder-${idx+1}`;
              const segStatus = segment?.status ?? 'pending';
              const segPrompt = segmentPrompts[idx + 1] ?? segment?.segment_prompt ?? segment?.prompts?.project_prompt ?? '';

              return (
                <Card key={segKey} className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">Segment {idx + 1}</h4>
                    <span className={`px-2 py-1 rounded text-sm ${getStatusColor(segStatus)}`}>
                      {getStatusText(segStatus, segment?.status_description)}
                    </span>
                  </div>

                  {segPrompt && (
                    <p className="text-sm text-gray-700 mb-2 line-clamp-3">
                      {segPrompt}
                    </p>
                  )}

                  {segment?.generation && (
                    <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Generator:</span>
                          <div className="font-medium">{segment.generation.generator}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Quality:</span>
                          <div className="font-medium">{segment.generation.quality}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <div className="font-medium">{segment.generation.duration}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Time:</span>
                          <div className="font-medium">{segment.generation.estimated_time}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {segment && (
                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Segment Prompt:
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={segmentPrompts[idx + 1] ?? segment.segment_prompt ?? ''}
                        onChange={(e) => setSegmentPrompts(prev => ({
                          ...prev,
                          [idx + 1]: e.target.value
                        }))}
                        placeholder={`Describe the action for segment ${idx + 1}...`}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdatePrompt(
                          idx + 1,
                          segmentPrompts[idx + 1] ?? ''
                        )}
                        disabled={!segmentPrompts[idx + 1]?.trim()}
                      >
                        💾 Save
                      </Button>
                    </div>
                  </div>
                  )}

                  {segment && (
                  <div className="flex gap-2 mb-3">
                    {segment.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateSegment(segment.segment_number)}
                        disabled={!segmentPrompts[segment.segment_number]?.trim()}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        🎨 Generate
                      </Button>
                    )}

                    {(segment.status === 'completed' || segment.status === 'failed') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateSegment(
                          segment.segment_number,
                          segmentPrompts[segment.segment_number] || segment.segment_prompt || ''
                        )}
                        disabled={!(segmentPrompts[segment.segment_number]?.trim() || segment.segment_prompt?.trim())}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50 disabled:opacity-50"
                      >
                        🔄 Regenerate
                      </Button>
                    )}

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
                        title="Open video in new tab"
                      >
                        👁️ View
                      </Button>
                    )}
                  </div>
                  )}

                  {segment?.status === 'completed' && (
                    <div className="mt-3">
                      <label className="text-xs font-medium text-gray-600 block mb-2">
                        Generated Video:
                      </label>
                      <VideoPreview
                        videoUrl={segment.video_url}
                        segmentNumber={segment.segment_number}
                        projectId={projectId}
                        segment={segment as any}
                        title={`Segment ${segment.segment_number}`}
                        className="w-full max-w-md h-32"
                        onError={(error) => console.error('❌ Video error for segment:', segment.segment_number, error)}
                      />
                    </div>
                  )}

                  {process.env.NODE_ENV === 'development' && segment && (
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
              );
            })}
          </div>
        )}
      </div>

      {canAssemble && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Final Assembly</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Segments completed: {completedSegments.length} of {currentProject.total_segments}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Assemble all completed segments into a final video
              </p>
            </div>
            <Button
              onClick={handleAssembleVideo}
              disabled={currentProject.status === 'assembling'}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {currentProject.status === 'assembling' ? '⏳ Assembling...' : '🎬 Assemble Video'}
            </Button>
          </div>
        </Card>
      )}

      {currentProject.final_video_url && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">✅ Final Video Ready!</h3>
          <div className="space-y-4">
            <VideoPreview
              videoUrl={currentProject.final_video_url}
              title="Final Video"
              className="w-full max-w-2xl"
              onError={(error) => console.error('❌ Final video error:', error)}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => window.open(apiClient.getFinalVideoUrl(projectId), '_blank')}
                variant="outline"
              >
                📁 Open in New Tab
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
                💾 Download
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnimationStudio;
