import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/Header';
import { AnimationSegments, VideoPreview, AvatarSelector, CompactAnimationMonitor } from '@/components/common';
import {
  useCreateAnimationProject,
  useAnimationProjects,
  useDeleteAnimationProject,
  useAssembleVideo
} from '@/hooks/useAnimations';
import { useAvatars } from '@/hooks/useAvatars';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';
import { getErrorMessage } from '@/services/api';
import type { AnimationProject } from '@/services/api';
import { toastSuccess, toastError } from '@/utils/toast';
import Modal from '@/components/ui/Modal';

const createAnimationSchema = z.object({
  source_avatar_id: z.string().min(1, 'Please select an avatar'),
  animation_prompt: z.string().min(10, 'The description must be at least 10 characters long'),
  total_segments: z.number().min(1).max(20),
});

type CreateAnimationFormData = z.infer<typeof createAnimationSchema>;

function AnimationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedAvatarId = location.state?.sourceAvatarId;

  const [showCreateForm, setShowCreateForm] = useState(!!preselectedAvatarId);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteAnimationId, setDeleteAnimationId] = useState<string | null>(null);

  // Debug: track changes to showCreateForm
  useEffect(() => {
    console.log('🔍 showCreateForm changed to:', showCreateForm);
    console.trace('Stack trace for showCreateForm change');
  }, [showCreateForm]);

  // Prevent form from hiding automatically during development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && showCreateForm) {
      console.log('🔒 Form is now visible, preventing auto-hide');
      const timer = setTimeout(() => {
        if (!showCreateForm) {
          console.log('⚠️ Form was hidden, forcing it to stay visible');
          setShowCreateForm(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showCreateForm]);

  // API hooks
  const { data: user } = useCurrentUser();
  const { data: avatars, isLoading: avatarsLoading } = useAvatars();
  const { data: animations, isLoading: animationsLoading, refetch } = useAnimationProjects();
  const createAnimationMutation = useCreateAnimationProject();
  const deleteAnimationMutation = useDeleteAnimationProject();
  const assembleVideoMutation = useAssembleVideo();
  const logoutMutation = useLogout();

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CreateAnimationFormData>({
    resolver: zodResolver(createAnimationSchema),
    defaultValues: {
      source_avatar_id: preselectedAvatarId || '',
      animation_prompt: '',
      total_segments: 5,
    },
  });

  const watchedAvatarId = watch('source_avatar_id');

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handlers
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const onSubmit = async (data: any) => {
    // Convert form data to camelCase for the API client
    const payload = {
      name: 'New Project',
      sourceAvatarId: data.source_avatar_id,
      totalSegments: Number(data.total_segments),
      animationPrompt: data.animation_prompt,
    };

    console.log('🚀 Sending payload for animation creation:', payload);

    try {
      await createAnimationMutation.mutateAsync(payload as any);
      setShowCreateForm(false);
      reset();
      setSuccessMessage('Animation started! The process may take a few minutes.');
      refetch();
    } catch (error) {
      console.error('Create animation error:', error);
    }
  };

  const handleDeleteAnimation = (animationId: string) => {
    setDeleteAnimationId(animationId);
  };

  const confirmDeleteAnimation = async () => {
    if (!deleteAnimationId) return;
    try {
      await deleteAnimationMutation.mutateAsync(deleteAnimationId);
      setSuccessMessage('Animation deleted');
      refetch();
    } catch (error) {
      console.error('Delete animation error:', error);
    } finally {
      setDeleteAnimationId(null);
    }
  };

  const handleAssembleVideo = async (animationId: string) => {
    try {
      await assembleVideoMutation.mutateAsync(animationId);
      setSuccessMessage('Final video assembly has started!');
      refetch();
    } catch (error) {
      console.error('Assemble video error:', error);
    }
  };

  // Data processing
  const availableAvatars = avatars?.avatars?.filter(
    avatar => avatar.status?.toLowerCase?.().trim() === 'completed'
  ) || [];

  // Debug: show all avatars for debugging purposes
  console.log('All avatars:', avatars?.avatars?.map(a => ({ id: a.avatar_id, status: a.status, prompt: a.prompt.slice(0, 30) })));
  console.log('Available avatars (COMPLETED):', availableAvatars.length);
  console.log('Show create form?', showCreateForm);
  console.log('Is animation creator available?', availableAvatars.length > 0);

  // Temporary: show avatars in all statuses for testing
  const allAvatarsForTesting = avatars?.avatars || [];

  if (avatarsLoading || animationsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Header
          user={user}
          onLogout={handleLogout}
          isLoggingOut={logoutMutation.isPending}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header
        user={user}
        onLogout={handleLogout}
        isLoggingOut={logoutMutation.isPending}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Backend Status Check */}


        {/* Auth Debug */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mb-6 p-4 bg-gray-50 border-gray-200">
            <h3 className="font-medium mb-2">🔍 Debug Information:</h3>
            <div className="text-xs space-y-1">
              <p><strong>User:</strong> {user ? `${user.username} (${user.email})` : 'Not authenticated'}</p>
              <p><strong>Access Token:</strong> {localStorage.getItem('access_token') ? 'Present' : 'Absent'}</p>
              <p><strong>Total avatars:</strong> {avatars?.avatars?.length || 0}</p>
              <p><strong>Ready avatars:</strong> {availableAvatars.length}</p>
              <p><strong>Total animations:</strong> {animations?.length || 0}</p>
            </div>
            {!user && (
              <Button
                className="mt-3 text-xs"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            )}

            {/* API Test Buttons */}
            <div className="mt-3 flex gap-2">
              <Button
                className="text-xs"
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/v1/avatars/', {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                      },
                    });
                    const data = await response.json();
                    console.log('API Test - Avatars:', response.status, data);

                    // Detailed avatar information
                    if (data.avatars && data.avatars.length > 0) {
                      data.avatars.forEach((avatar: any, index: number) => {
                        console.log(`Avatar ${index + 1}:`, {
                          id: avatar.avatar_id,
                          status: avatar.status,
                          prompt: avatar.prompt?.substring(0, 50) + '...',
                          created: avatar.created_at
                        });
                      });
                    }

                    toastSuccess(`Avatars loaded: ${data.total}`);
                  } catch (error) {
                    console.error('API Test Error:', error);
                    toastError(error as unknown);
                  }
                }}
              >
                Test Avatars API
              </Button>

              <Button
                className="text-xs"
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/v1/animations/', {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                      },
                    });
                    const data = await response.json();
                    console.log('API Test - Animations:', response.status, data);

                    // Detailed animation information
                    if (Array.isArray(data) && data.length > 0) {
                      data.forEach((animation: any, index: number) => {
                        console.log(`Animation ${index + 1}:`, {
                          id: animation.id,
                          status: animation.status,
                          prompt: animation.animation_prompt?.substring(0, 50) + '...',
                          avatar_id: animation.source_avatar_id,
                          segments: animation.total_segments
                        });
                      });
                    }

                    toastSuccess(`Animations loaded: ${Array.isArray(data) ? data.length : 0}`);
                  } catch (error) {
                    console.error('API Test Error:', error);
                    toastError(error as unknown);
                  }
                }}
              >
                Test Animations API
              </Button>

              <Button
                className="text-xs"
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/v1/auth/me', {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                      },
                    });
                    const data = await response.json();
                    console.log('API Test - Auth:', response.status, data);
                    toastSuccess('Profile loaded');
                  } catch (error) {
                    console.error('API Test Error:', error);
                    toastError(error as unknown);
                  }
                }}
              >
                Test Auth
              </Button>
            </div>
          </Card>
        )}

        {/* Authentication Check */}
        {!user && (
          <Card className="mb-6 p-4 bg-amber-50 border-amber-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">!</span>
              </div>
              <div className="flex-1">
                <p className="text-amber-800 font-medium">Authentication Required</p>
                <p className="text-amber-700 text-sm">
                  You need to log in to create animations
                </p>
              </div>
              <Button
                onClick={() => navigate('/login')}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Log In
              </Button>
            </div>
          </Card>
        )}

        {/* No Avatars Info */}
        {user && availableAvatars.length === 0 && allAvatarsForTesting.length === 0 && (
          <Card className="mb-6 p-6 bg-blue-50 border-blue-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2V3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Create your first avatar
              </h3>
              <p className="text-blue-700 mb-4">
                To create animations, you first need to create an avatar from a text description
              </p>
              <Button
                onClick={() => navigate('/avatars')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Avatar
              </Button>
            </div>
          </Card>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Animations
              </h1>
              <p className="text-lg text-gray-600">
                Create talking animations from your avatars
              </p>
            </div>
            <Button
              onClick={() => {
                console.log('Create Animation button clicked');
                console.log('Available avatars:', availableAvatars.length);
                setShowCreateForm(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3"
              disabled={availableAvatars.length === 0}
            >
              Create Animation {availableAvatars.length > 0 ? `(${availableAvatars.length} ready)` : '(unavailable)'}
            </Button>
          </div>
        </div>

        {/* Video Generation Limit Alert */}
        {user && (
          <Card className="mb-6 p-4 bg-orange-50 border-orange-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-orange-800 font-medium mb-1">⚠️ Video Generation Limit</h3>
                <p className="text-orange-700 text-sm mb-2">
                  New users are limited to only <strong>one video generation</strong>.
                  Avatars and stories can be created without limits.
                </p>
                <div className="text-xs text-orange-600 space-y-1">
                  <p>• Avatars: unlimited</p>
                  <p>• Stories: unlimited</p>
                  <p>• Video animations: 1 time</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Success Message */}
        {successMessage && (
          <Card className="mb-8 p-4 bg-green-50 border-green-200 border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSuccessMessage(null)}
                className="ml-auto text-green-600 hover:text-green-700 border-green-300"
              >
                ✕
              </Button>
            </div>
          </Card>
        )}

        {/* Error Message for Create Animation */}
        {createAnimationMutation.error && (
          <Card className="mb-8 p-4 bg-red-50 border-red-200 border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">!</span>
              </div>
              <div>
                <p className="text-red-800 font-medium">Error Creating Animation</p>
                <p className="text-red-600 text-sm">{getErrorMessage(createAnimationMutation.error)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* No Avatars Warning */}
        {availableAvatars.length === 0 && (
          <Card className="p-6 bg-yellow-50 border border-yellow-200 mb-8">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">No Ready Avatars</h3>
                {avatars?.avatars && avatars.avatars.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-yellow-700 text-sm">
                      You have {avatars.avatars.length} avatars, but they are not ready yet:
                    </p>
                    <div className="mt-2 space-y-1">
                      {avatars.avatars.map((avatar: any) => (
                        <div key={avatar.avatar_id} className="flex items-center justify-between bg-yellow-100 rounded px-3 py-2 text-sm">
                          <span className="text-yellow-800 flex-1 mr-2">
                            {avatar.prompt.slice(0, 40)}...
                          </span>
                          <div
                            className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              avatar.status === 'pending'
                                ? 'bg-yellow-500 animate-pulse'
                                : avatar.status === 'failed'
                                ? 'bg-red-500'
                                : 'bg-green-500'
                            }`}
                          >
                            {avatar.status === 'generating' ? 'Generating' :
                            avatar.status === 'failed' ? 'Failed' :
                            avatar.status === 'pending' ? 'Pending' :
                            avatar.status === 'completed' ? 'Ready' : avatar.status}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-yellow-700 text-sm mt-3">
                      Please wait for the generation to complete or create a new avatar.
                    </p>
                  </div>
                ) : (
                  <p className="text-yellow-700 text-sm">
                    To create an animation, you first need to create an avatar.
                  </p>
                )}
                <Button
                  variant="link"
                  onClick={() => navigate('/avatars')}
                  className="text-yellow-800 underline p-0 h-auto ml-1 mt-2"
                >
                  Go to avatars →
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Temporary: Allow selection of all avatars for testing */}
        {allAvatarsForTesting.length > 0 && availableAvatars.length === 0 && (
          <Card className="p-6 bg-blue-50 border border-blue-200 mb-8">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🧪</span>
              <div>
                <h3 className="font-medium text-blue-800">Debug Mode</h3>
                <p className="text-blue-700 text-sm">
                  Temporarily allowing selection of avatars in any status for testing.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    variant="outline"
                    className="text-blue-600 border-blue-300"
                  >
                    🧪 Test Animation Creation
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/v1/health');
                        const data = await response.json();
                        toastSuccess(`Backend is available: v${data.version}`);
                      } catch (error) {
                        toastError(error as unknown);
                      }
                    }}
                    variant="outline"
                    className="text-blue-600 border-blue-300"
                  >
                    🔍 Check API
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Create Form Debug */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
            <h3 className="font-medium mb-2">🔧 Create Form Debug:</h3>
            <div className="text-xs space-y-1">
              <p><strong>Show form:</strong> {showCreateForm ? 'YES' : 'NO'}</p>
              <p><strong>Loading avatars:</strong> {avatarsLoading ? 'YES' : 'NO'}</p>
              <p><strong>Loading animations:</strong> {animationsLoading ? 'YES' : 'NO'}</p>
              <p><strong>Available avatars:</strong> {availableAvatars.length}</p>
              <p><strong>Button disabled:</strong> {availableAvatars.length === 0 ? 'YES' : 'NO'}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowCreateForm(true)}
                className="text-xs bg-blue-600 text-white"
              >
                Force Show Form
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="text-xs"
              >
                Hide Form
              </Button>
            </div>
          </Card>
        )}

        {/* Create Animation Form */}
        {showCreateForm && (
          <Card className="p-6 mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Animation</h2>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕ Close
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Avatar Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select an avatar for the animation
                </label>

                <AvatarSelector
                  avatars={availableAvatars.length > 0 ? availableAvatars : allAvatarsForTesting}
                  selectedAvatarId={watchedAvatarId}
                  onSelect={(avatarId) => setValue('source_avatar_id', avatarId)}
                  onCreateNew={() => navigate('/avatars')}
                />

                {errors.source_avatar_id && (
                  <p className="text-red-500 text-sm mt-2">{errors.source_avatar_id.message}</p>
                )}
                <input
                  type="hidden"
                  {...register('source_avatar_id')}
                />
              </div>

              {/* Animation Prompt */}
              <div>
                <label htmlFor="animation_prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Animation Description
                </label>
                <textarea
                  id="animation_prompt"
                  rows={4}
                  {...register('animation_prompt')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                    errors.animation_prompt ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe what your avatar should say or do. For example: 'Hello! My name is Anna and I want to tell you about our new product...'"
                />
                {errors.animation_prompt && (
                  <p className="text-red-500 text-sm mt-1">{errors.animation_prompt.message}</p>
                )}
              </div>

              {/* Total Segments */}
              <div>
                <label htmlFor="total_segments" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of segments (1-20)
                </label>
                <Input
                  id="total_segments"
                  type="number"
                  min="1"
                  max="20"
                  {...register('total_segments', { valueAsNumber: true })}
                  className={errors.total_segments ? 'border-red-500' : ''}
                />
                <p className="text-xs text-gray-500 mt-1">
                  More segments = higher quality result, but longer processing time
                </p>
                {errors.total_segments && (
                  <p className="text-red-500 text-sm mt-1">{errors.total_segments.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  disabled={createAnimationMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAnimationMutation.isPending || !watchedAvatarId}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {createAnimationMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create Animation'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Delete animation modal */}
        <Modal
          open={Boolean(deleteAnimationId)}
          title="Delete Animation?"
          description="Are you sure you want to delete this animation? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteAnimation}
          onClose={() => setDeleteAnimationId(null)}
        />

        {/* Animations List */}
        {animations && animations.length > 0 ? (
          <div className="space-y-6">
            {animations?.map((animation: AnimationProject) => (
              <AnimationCard
                key={animation.id}
                animation={animation}
                onDelete={handleDeleteAnimation}
                onAssemble={handleAssembleVideo}
                isDeleting={deleteAnimationMutation.isPending}
                isAssembling={assembleVideoMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16l13-8L7 4z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">No Animations</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first animation to bring your avatars to life
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              disabled={availableAvatars.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Create Animation
            </Button>
          </Card>
        )}

        {/* Statistics */}
        {animations && animations.length > 0 && (
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl text-blue-600">📊</span>
              </div>
              <p className="text-3xl font-bold">{animations.length}</p>
              <p className="text-gray-600">Total Animations</p>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-3xl font-bold">
                {animations?.filter((a: AnimationProject) =>
                  a.status === 'completed'
                ).length || 0}
              </p>
              <p className="text-gray-600">Completed</p>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">
                {animations?.filter((a: AnimationProject) => {
                  return a.status === 'in_progress' || a.status === 'assembling';
                }).length || 0}
              </p>
              <p className="text-gray-600">In Progress</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component for the animation card
interface AnimationCardProps {
  animation: AnimationProject;
  onDelete: (id: string) => void;
  onAssemble: (id: string) => void;
  isDeleting: boolean;
  isAssembling: boolean;
}

function AnimationCard({ animation, onDelete, onAssemble, isDeleting, isAssembling }: AnimationCardProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'assembling':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'Generating';
      case 'assembling':
        return 'Assembling Video';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const completedSegments = animation.segments?.filter(s =>
    s.status === 'completed'
  ).length || 0;
  const progressPercentage = Math.round((completedSegments / animation.total_segments) * 100);
  const allSegmentsCompleted = completedSegments === animation.total_segments;

  return (
    <Card className="p-6 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {((animation.animation_prompt ?? '')).length > 100
              ? `${(animation.animation_prompt ?? '').substring(0, 100)}...`
              : (animation.animation_prompt ?? animation.name)}
          </h3>

          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
            <span>ID: {animation.id}</span>
            <span>Created: {new Date(animation.created_at).toLocaleDateString('en-US')}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(animation.status)}`}>
              {getStatusText(animation.status)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress: {completedSegments} / {animation.total_segments} segments</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>

            {/* Progress Monitor */}
            <CompactAnimationMonitor
              animation={animation}
              onRefresh={() => window.location.reload()}

            />

            {/* Segments visualization */}
            {animation.segments && animation.segments.length > 0 && (
              <AnimationSegments
                segments={animation.segments}
                totalSegments={animation.total_segments}
              />
            )}
          </div>

          {/* Final Video Section */}
          {allSegmentsCompleted && (
            <div className="mb-4">
              {animation.status === 'completed' && animation.final_video_url ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <div>
                        <h4 className="font-medium text-green-800">Animation Ready!</h4>
                        <p className="text-green-600 text-sm">Final video has been generated</p>
                      </div>
                    </div>
                  </div>
                  <VideoPreview
                    videoUrl={animation.final_video_url}
                    title="Final Video"
                  />
                </div>
              ) : animation.status === 'assembling' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                    <div>
                      <h4 className="font-medium text-yellow-800">Assembling video...</h4>
                      <p className="text-yellow-600 text-sm">Please wait</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => onAssemble(animation.id)}
                  disabled={isAssembling}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isAssembling ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Starting assembly...</span>
                    </div>
                  ) : (
                    'Assemble Final Video'
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2 ml-4">
          <Button
            size="sm"
            onClick={() => navigate(`/animations/${animation.id}`)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Studio
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(animation.id)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? '...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default AnimationPage;