import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusIcon, ActionIcon } from '@/components/ui/icons';
import { useGenerateSegment, useSegmentProgressWS, useUpdateSegmentPrompt } from '@/hooks/useAnimations';
import type { AnimationSegment } from '@/services/api';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { toastError } from '@/utils/toast';

interface SegmentEditorProps {
  projectId: string;
  segment: AnimationSegment;
  onUpdate: () => void;
  animationType?: 'sequential' | 'independent';
  isNextAllowed?: boolean;
}

export function SegmentEditor({
  projectId,
  segment,
  onUpdate,
  animationType,
  isNextAllowed = true,
}: SegmentEditorProps) {
  const [prompt, setPrompt] = useState(segment.segment_prompt ?? '');
  const [isEditing, setIsEditing] = useState(!segment.segment_prompt);
  const [isGenerating, setIsGenerating] = useState(false);

  const updatePromptMutation = useUpdateSegmentPrompt();
  const generateSegmentMutation = useGenerateSegment();

  // Live updates via WebSocket (skip for completed/failed)
  const skipWS = segment.status === 'completed' || segment.status === 'failed';
  useSegmentProgressWS(segment.id, projectId, skipWS);

  const handleGenerateClick = async () => {
    if (prompt.trim().length < 10) {
      toastError('Prompt must be at least 10 characters long.');
      return;
    }
    setIsGenerating(true);
    try {
      // Save prompt if it has changed
      if (prompt !== segment.segment_prompt) {
        await updatePromptMutation.mutateAsync({
          projectId,
          segmentNumber: segment.segment_number,
          segmentPrompt: prompt.trim(),
        });
      }
      // Start generation
      await generateSegmentMutation.mutateAsync({
        projectId,
        segmentNumber: segment.segment_number,
        segmentPrompt: prompt.trim(),
      });
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      toastError(error.message || 'Error generating segment.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = () => {
    switch (segment.status) {
      case 'completed':
        return <StatusIcon status="completed" className="w-4 h-4" />;
      case 'in_progress':
        return <StatusIcon status="inProgress" className="w-4 h-4" />;
      case 'pending':
        return <StatusIcon status="pending" className="w-4 h-4" />;
      case 'failed':
        return <StatusIcon status="failed" className="w-4 h-4" />;
      default:
        return <StatusIcon status="unknown" className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    const progress = segment.progress ?? 0;
    switch (segment.status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return `In Progress (${progress}%)`;
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getPromptSource = () => {
    if (segment.prompts?.prompt_source === 'custom') {
      return 'Custom';
    }
    return '📝 Default';
  };

  return (
    <Card className="segment-editor p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Segment {segment.segment_number} {getStatusIcon()}
        </h3>
        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
          {getPromptSource()}
        </span>
      </div>

      <div className="mt-4">
        {isEditing ? (
          <textarea
            className="w-full p-2 border border-gray-300 rounded resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a detailed description for this segment..."
            rows={4}
          />
        ) : (
          <div className="group relative">
            <p className="text-gray-700 whitespace-pre-wrap pr-8">
              {prompt || 'No prompt set'}
            </p>
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

      {segment.status === 'in_progress' && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{segment.progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${segment.progress}%` }}
            />
          </div>
        </div>
      )}

      {segment.status !== 'completed' && (
        <div className="mt-4">
          <Button
            onClick={handleGenerateClick}
            disabled={
              isGenerating ||
              segment.status === 'in_progress' ||
              !prompt.trim() ||
              (animationType === 'sequential' && !isNextAllowed)
            }
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? (
              <>
                <ActionIcon action="loading" className="w-4 h-4 mr-2" animate />
                Generating...
              </>
            ) : (
              <>
                <ActionIcon action="play" className="w-4 h-4 mr-2" />
                Generate Segment
              </>
            )}
          </Button>
          {animationType === 'sequential' && !isNextAllowed && (
            <p className="text-xs text-blue-600 mt-2">
              Available only after the previous segment is completed.
            </p>
          )}
        </div>
      )}

      {segment.generated_video_url && (
        <div className="mt-4">
          <video
            src={segment.generated_video_url}
            controls
            className="w-full max-w-md rounded shadow-sm"
          />
        </div>
      )}

      {segment.video_url && !segment.generated_video_url && (
        <div className="mt-4">
          <LazyLoadImage
            src={segment.start_frame_url}
            alt={`Segment ${segment.segment_number}`}
            effect="blur"
            className="w-full max-w-md h-40 object-cover rounded"
          />
        </div>
      )}
    </Card>
  );
}
