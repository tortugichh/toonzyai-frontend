import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAvatars } from '@/hooks/useAvatars';
import { useCreateAnimationProject } from '@/hooks/useAnimations';
import { toastError } from '@/utils/toast';
import Modal from '@/components/ui/Modal';
import type { AnimationProject } from '@/types/api';

interface CreateProjectProps {
  onProjectCreated: (project: AnimationProject) => void;
  onCancel?: () => void;
}

  interface FormData {
    title: string;
    avatarId: string;
    totalSegments: number;
    prompt: string;
    animationType: 'independent' | 'sequential';
  }

export function CreateProject({ onProjectCreated, onCancel }: CreateProjectProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    avatarId: '',
    totalSegments: 0, // 0 means "not selected"
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
      toastError('Please enter a project name');
      return;
    }

    if (segmentsError) {
      toastError('Please select the number of segments');
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
      if (error?.message?.includes('Only one animation project available')) {
        setLimitModalOpen(true);
      } else {
      toastError('Error creating project: ' + error.message);
      }
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    if (field === 'totalSegments') {
      // value from <select> is always string
      let v = parseInt(value as string, 10);
      if (isNaN(v)) v = 0; // "not selected"
      setFormData(prev => ({ ...prev, totalSegments: v }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const isSubmitting = createProjectMutation.isPending;
  const avatars = avatarsResponse?.avatars || [];

  const segmentsError = formData.totalSegments < 1 || formData.totalSegments > 5;

  // Validation helpers
  const promptError = formData.prompt.trim().length > 0 && formData.prompt.trim().length < 10;

  return (
    <>
    <Card className="create-project-form max-w-2xl mx-auto p-6">
      <div className="form-header mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create New Project
        </h2>
        <p className="text-gray-600">
          Select an avatar and describe the animation you want to create
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div>
          <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-2">
            Project Name
          </label>
          <Input
            id="project-name"
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter project name..."
            className="w-full"
            required
          />
        </div>

        {/* Avatar Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Avatar
          </label>
          {avatarsLoading ? (
            <div className="flex items-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
              <span className="ml-2 text-gray-600">Loading avatars...</span>
            </div>
          ) : avatars.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No avatars available</p>
              <p className="text-sm">Create an avatar first to start an animation project</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {avatars.map((avatar) => (
                <div
                  key={avatar.avatar_id}
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    formData.avatarId === avatar.avatar_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('avatarId', avatar.avatar_id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      {avatar.status === 'completed' ? (
                        <img
                          src={avatar.image_url}
                          alt="Avatar"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {avatar.prompt}
                      </p>
                      <p className="text-xs text-gray-500">
                        {avatar.status === 'completed' ? 'Ready' : 'Generating...'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Animation Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Animation Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                formData.animationType === 'independent'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleInputChange('animationType', 'independent')}
            >
              <div className="text-center">
                <div className="text-lg mb-1">🎬</div>
                <div className="text-sm font-medium">Independent</div>
                <div className="text-xs text-gray-500">Separate segments</div>
              </div>
            </div>
                           <div
                 className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                   formData.animationType === 'sequential'
                     ? 'border-blue-500 bg-blue-50'
                     : 'border-gray-200 hover:border-gray-300'
                 }`}
                 onClick={() => handleInputChange('animationType', 'sequential')}
               >
                 <div className="text-center">
                   <div className="text-lg mb-1">🎭</div>
                   <div className="text-sm font-medium">Sequential</div>
                   <div className="text-xs text-gray-500">Connected story</div>
                 </div>
               </div>
          </div>
        </div>

        {/* Number of Segments */}
        <div>
          <label htmlFor="segments" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Segments
          </label>
          <select
            id="segments"
            value={formData.totalSegments}
            onChange={(e) => handleInputChange('totalSegments', e.target.value)}
            className={`w-full p-2 border rounded-lg ${
              segmentsError ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value={0}>Select number of segments</option>
            <option value={1}>1 segment</option>
            <option value={2}>2 segments</option>
            <option value={3}>3 segments</option>
            <option value={4}>4 segments</option>
            <option value={5}>5 segments</option>
          </select>
          {segmentsError && (
            <p className="text-red-500 text-sm mt-1">
              Please select between 1 and 5 segments
            </p>
          )}
        </div>

        {/* Animation Description */}
        <div>
          <label htmlFor="animation_prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Animation Description
          </label>
          <textarea
            id="animation_prompt"
            rows={4}
            value={formData.prompt}
            onChange={(e) => handleInputChange('prompt', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
              promptError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe what your avatar should say or do. For example: 'Hello! My name is Anna and I want to tell you about our new product...'"
          />
          {promptError && (
            <p className="text-red-500 text-sm mt-1">
              Description must be at least 10 characters long
            </p>
          )}
        </div>

        {/* Action buttons */}
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
            <p>Error creating project: {createProjectMutation.error instanceof Error ? createProjectMutation.error.message : String(createProjectMutation.error)}</p>
          </div>
        )}
      </form>
    </Card>
      <Modal
        open={limitModalOpen}
        title="Animation Project Limit"
        description="New users can only create one animation project."
        onClose={() => setLimitModalOpen(false)}
        confirmText="Got it"
      />
    </>
  );
} 