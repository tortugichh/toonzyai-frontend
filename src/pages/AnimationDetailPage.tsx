import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { AnimationProject } from '@/components/common';
import { useAnimationProject, useDeleteAnimationProject, useAssembleVideo, useProjectProgressWS } from '@/hooks/useAnimations';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';
import { getErrorMessage } from '@/services/api';
import Modal from '@/components/ui/Modal';
import { useState } from 'react';

function AnimationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user } = useCurrentUser();
  const { data: animation, isLoading, error } = useAnimationProject(id!);
  const deleteAnimationMutation = useDeleteAnimationProject();
  const assembleVideoMutation = useAssembleVideo();
  const logoutMutation = useLogout();
  const projectProgressWS = useProjectProgressWS(id);
  
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      try {
        await deleteAnimationMutation.mutateAsync(id!);
        navigate('/animations');
      } catch (error) {
        console.error('Delete error:', error);
    } finally {
      setDeleteModalOpen(false);
    }
  };

  const handleAssemble = async () => {
    try {
      await assembleVideoMutation.mutateAsync(id!);
    } catch (error) {
      console.error('Assemble error:', error);
    }
  };

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
        return 'Assembling video';
      case 'failed':
        return 'Error';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  if (isLoading) {
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

  if (error || !animation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Header 
          user={user} 
          onLogout={handleLogout} 
          isLoggingOut={logoutMutation.isPending} 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <svg className="w-16 h-16 text-red-500 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Animation not found</h2>
            <p className="text-gray-600 mb-6">
              {error ? getErrorMessage(error) : 'This animation does not exist or has been deleted'}
            </p>
            <Button onClick={() => navigate('/animations')}>
              ← Back to animations
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const completedSegments = animation.segments?.filter((s: any) =>
    s.status === 'completed'
  ).length || 0;
  const allSegmentsCompleted = completedSegments === animation.total_segments;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        isLoggingOut={logoutMutation.isPending} 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/animations')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to animations
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Animation Studio
              </h1>
              <p className="text-gray-600 text-lg mb-4">
                Manage each segment of your animation individually
              </p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>ID: {animation.id}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(animation.status)}`}>
                  {getStatusText(animation.status)}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2 ml-4">
              <Button
                onClick={handleDelete}
                variant="outline"
                disabled={deleteAnimationMutation.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {deleteAnimationMutation.isPending ? 'Deleting...' : '🗑️ Delete'}
              </Button>
              <Modal
                open={isDeleteModalOpen}
                title="Delete animation?"
                description="Are you sure you want to delete this animation? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onClose={() => setDeleteModalOpen(false)}
              />
            </div>
          </div>
        </div>

        {/* Animation Project - Main Content */}
        <AnimationProject 
          projectId={animation.id}
          onBack={() => navigate('/animations')}
        />

        {/* Final Video Section */}
        {allSegmentsCompleted && (
          <Card className="p-6 bg-white/90 backdrop-blur-sm border-0 shadow-lg mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🎬 Final Video</h2>
            
            {animation.status === 'completed' && animation.final_video_url ? (
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Ready Video</h3>
                <video
                  src={animation.final_video_url}
                  controls
                  className="w-full max-w-4xl rounded-lg shadow-lg"
                />
                <div className="mt-4 flex gap-3">
                  <Button
                    onClick={() => window.open(animation.final_video_url!, '_blank')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    🎥 Open in New Tab
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = animation.final_video_url!;
                      link.download = `animation-${animation.id}.mp4`;
                      link.click();
                    }}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    📥 Download
                  </Button>
                </div>
              </div>
            ) : animation.status === 'assembling' ? (
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">Assembling video...</h3>
                    <p className="text-sm text-yellow-700">
                      The final video is being assembled from ready segments. This may take a few minutes.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Ready to assemble!</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    All segments are ready. Now you can assemble the final video.
                  </p>
                  <Button
                    onClick={handleAssemble}
                    disabled={assembleVideoMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {assembleVideoMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Starting assembly...</span>
                      </div>
                    ) : (
                      '🔧 Assemble Final Video'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

export default AnimationDetailPage;
