import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAvatars } from '@/hooks/useAvatars';
import { useCreateAnimationProject } from '@/hooks/useAnimations';
import type { AnimationProject } from '@/services/api';
import { toastError } from '@/utils/toast';
import Modal from '@/components/ui/Modal';

interface CreateProjectProps {
  onProjectCreated: (project: AnimationProject) => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  avatarId: string;
  totalSegments: number;
  prompt: string;
  animationType: 'sequential' | 'independent';
}

export function CreateProject({ onProjectCreated, onCancel }: CreateProjectProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    avatarId: '',
    totalSegments: 0,
    prompt: '',
    animationType: 'independent',
  });

  const { data: avatarsResponse, isLoading: avatarsLoading } = useAvatars();
  const createProjectMutation = useCreateAnimationProject();
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.avatarId) {
      toastError('Please select an avatar');
      return;
    }

    if (!formData.title.trim()) {
      toastError('Enter a project title');
      return;
    }

    if (segmentsError) {
      toastError('Select the number of segments');
      return;
    }

    try {
      const project = await createProjectMutation.mutateAsync({
        name: formData.title.trim(),
        sourceAvatarId: formData.avatarId,
        totalSegments: formData.totalSegments,
        animationPrompt: formData.prompt.trim() || undefined,
        animationType: formData.animationType,
      });

      onProjectCreated(project);
    } catch (error: any) {
      if (error?.message?.includes('Only one video generation is allowed')) {
        setLimitModalOpen(true);
      } else {
        toastError('Project creation error: ' + error.message);
      }
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    if (field === 'totalSegments') {
      let v = parseInt(value as string, 10);
      if (isNaN(v)) v = 0;
      setFormData((prev) => ({ ...prev, totalSegments: v }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const isSubmitting = createProjectMutation.isPending;
  const avatars = avatarsResponse?.avatars || [];
  const segmentsError = formData.totalSegments < 1 || formData.totalSegments > 5;
  const promptError = formData.prompt.trim().length > 0 && formData.prompt.trim().length < 10;

  return (
    <>
      <Card className="create-project-form max-w-2xl mx-auto p-6">
        <div className="form-header mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Project</h2>
          <p className="text-gray-600">
            Choose an avatar and describe the animation you want to create
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Title */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Title
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter your project title"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          {/* Avatar Selection */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Avatar
            </label>

            {avatarsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading avatars...</span>
              </div>
            ) : avatars.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No avatars available</p>
                <p className="text-sm mt-1">Create an avatar first in the "Avatars" section</p>
              </div>
            ) : (
              <div className="avatars-grid grid grid-cols-2 md:grid-cols-3 gap-4">
                {avatars.map((avatar) => (
                  <div
                    key={avatar.avatar_id}
                    className={`avatar-option border-2 rounded-lg p-3 cursor-pointer transition-all ${
                      formData.avatarId === avatar.avatar_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('avatarId', avatar.avatar_id)}
                  >
                    {avatar.image_url && (
                      <img
                        src={avatar.image_url}
                        alt={avatar.prompt}
                        className="w-full h-24 object-cover rounded mb-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <p className="text-xs text-gray-600 line-clamp-2">{avatar.prompt}</p>
                    <div className="mt-1 text-xs text-gray-400">
                      ID: {avatar.avatar_id.slice(0, 8)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Number of Segments */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Segments
            </label>
            <select
              value={formData.totalSegments || ''}
              onChange={(e) => handleInputChange('totalSegments', e.target.value)}
              disabled={isSubmitting}
              className={`rounded px-3 py-2 w-full bg-white border ${
                segmentsError ? 'border-red-500 focus:border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="" disabled>
                -- select --
              </option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {segmentsError && (
              <p className="text-red-500 text-xs mt-1">
                The number of segments must be between 1 and 5
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Allowed: 1–5 segments. Recommended: 3–5 for best quality.
            </p>
          </div>

          {/* Animation Type Selection */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Animation Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="animationType"
                  value="independent"
                  checked={formData.animationType === 'independent'}
                  onChange={() => handleInputChange('animationType', 'independent')}
                  disabled={isSubmitting}
                />
                Independent Frames
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="animationType"
                  value="sequential"
                  checked={formData.animationType === 'sequential'}
                  onChange={() => handleInputChange('animationType', 'sequential')}
                  disabled={isSubmitting}
                />
                Sequential Animation
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <b>Sequential:</b> each frame is generated after the previous one.<br />
              <b>Independent:</b> frames can be generated in any order.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="form-actions flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.avatarId || segmentsError}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Project'
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                disabled={isSubmitting}
                className="px-6 py-3"
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Error Display */}
          {createProjectMutation.isError && (
            <div className="error-message mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
              <p>
                Project creation error:{' '}
                {createProjectMutation.error instanceof Error
                  ? createProjectMutation.error.message
                  : String(createProjectMutation.error)}
              </p>
            </div>
          )}
        </form>
      </Card>
      <Modal
        open={limitModalOpen}
        title="Video Generation Limit"
        description="New users can only generate one video. You can create unlimited avatars and stories."
        onClose={() => setLimitModalOpen(false)}
        confirmText="Got it"
      />
    </>
  );
}
