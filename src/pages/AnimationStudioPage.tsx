import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreateProject } from '@/components/common';
import { useAnimationProjects, useAnimationProject, useDeleteAnimationProject } from '@/hooks/useAnimations';
import { useAvatars } from '@/hooks/useAvatars';
import { useNavigate } from 'react-router-dom';
import type { AnimationProject as AnimationProjectType } from '@/services/api';
import { Header } from '@/components/layout/Header';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';
import Modal from '@/components/ui/Modal';
import AvatarImage from '@/components/common/AvatarImage';

function AnimationStudioPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [avatarFilter, setAvatarFilter] = useState<string>('all');
  const { data: projects = [], isLoading, refetch } = useAnimationProjects();
  const { data: avatarsData } = useAvatars();
  const availableAvatars = avatarsData?.avatars || [];
  const deleteProjectMutation = useDeleteAnimationProject();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    console.log('[STUDIO] Logout button clicked');
    logoutMutation.mutate();
  };
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleteProjectName, setDeleteProjectName] = useState<string>('');
  
  // Apply filter
  const filteredProjects = avatarFilter === 'all'
    ? projects
    : projects.filter(p => p.source_avatar_id === avatarFilter);

  const openDeleteModal = (projectId: string, projectName: string) => {
    setDeleteProjectId(projectId);
    setDeleteProjectName(projectName);
  };

  const confirmDeleteProject = async () => {
    if (!deleteProjectId) return;
    try {
      await deleteProjectMutation.mutateAsync(deleteProjectId);
      refetch();
    } catch (error) {
      console.error('Error deleting project:', error);
      // TODO: Implement global toast; temporarily use console.
    } finally {
      setDeleteProjectId(null);
    }
  };

  if (showCreateForm) {
    return (
      <>
        <Header user={user} onLogout={handleLogout} isLoggingOut={logoutMutation.isPending} />
      <CreateProject 
        onProjectCreated={(project) => {
          setShowCreateForm(false);
          refetch();
          navigate(`/studio/${project.id}`);
        }}
        onCancel={() => setShowCreateForm(false)}
      />
      </>
    );
  }

  // Main studio page - project list
  return (
    <div className="animation-studio-page min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} isLoggingOut={logoutMutation.isPending} />
      <div className="max-w-6xl mx-auto p-6">
        {/* Hero / Header */}
        <div className="studio-header mb-8 bg-gradient-to-r from-[#FFD27F] via-[#FF9A2B] to-[#C65A00] text-white rounded-xl p-6 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
            <Button onClick={() => navigate(-1)} variant="outline" className="border-white text-white hover:bg-white/10">← Back</Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Animation Studio
              </h1>
              <p className="text-gray-600 mt-2">
                Create animations with unique prompts for each segment
              </p>
            </div>
          </div>

          {/* Avatar Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 sm:flex-none">
            <label htmlFor="avatarFilter" className="text-sm hidden md:block">Filter by avatar:</label>
            <select
              id="avatarFilter"
              value={avatarFilter}
              onChange={(e) => setAvatarFilter(e.target.value)}
              className="rounded px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-white/70 w-full sm:w-auto"
            >
              <option value="all">All avatars</option>
              {availableAvatars.map(av => (
                <option key={av.avatar_id} value={av.avatar_id}>{av.prompt.slice(0, 40)}</option>
              ))}
            </select>
          </div>
          
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-[#FFD27F] via-[#FF9A2B] to-[#C65A00] hover:opacity-90 text-white px-6 py-3 transform-gpu hover:scale-105 transition w-full sm:w-auto"
          >
            ➕ New Project
          </Button>
        </div>

        {/* Projects List */}
        {isLoading ? (
          <div className="loading text-center py-12">
            <div className="animate-spin-infinite rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <Card className="welcome-card text-center py-12">
            <div className="mb-6">
                              <div className="text-purple-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16l13-8L7 4z" />
                  </svg>
                </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to ToonzyAI Studio!
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Here you can create amazing animations with AI. 
                Start by creating your first project.
              </p>
            </div>
            
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Create First Project
            </Button>
          </Card>
        ) : (
          <div className="projects-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <ProjectCard 
                key={project.id}
                project={project}
                onOpen={() => navigate(`/studio/${project.id}`)}
                onDelete={() => openDeleteModal(project.id, project.name)}
              />
            ))}
          </div>
        )}
      </div>
      {/* Delete Confirm Modal */}
      <Modal
        open={Boolean(deleteProjectId)}
        title="Delete project?"
        description={`Are you sure you want to delete project "${deleteProjectName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteProject}
        onClose={() => setDeleteProjectId(null)}
      />
    </div>
  );
}

// Project Card Component
interface ProjectCardProps {
  project: AnimationProjectType;
  onOpen: () => void;
  onDelete: () => void;
}

function ProjectCard({ project, onOpen, onDelete }: ProjectCardProps) {
  // Fetch live data for accurate progress without reloading the whole page
  const { data: liveProject } = useAnimationProject(project.id);
  const p = liveProject || project;

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase?.().trim();
    switch (s) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'assembling': return 'text-purple-600 bg-purple-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    const s = status?.toLowerCase?.().trim();
    switch (s) {
              case 'completed': return 'Completed';
        case 'in_progress': return 'In Progress';
        case 'assembling': return 'Assembling';
        case 'failed': return 'Failed';
        default: return 'Pending';
    }
  };

  const completedSegments = p.segments?.filter(s => s.status === 'completed').length || 0;
  const inProgressSegments = p.segments?.filter(s => s.status === 'in_progress').length || 0;
  const failedSegments = p.segments?.filter(s => s.status === 'failed').length || 0;
  const totalSegments = p.total_segments;

  const totalProgressPoints = p.segments?.reduce((sum, seg: any) => sum + (seg.progress ?? (seg.status === 'completed' ? 100 : 0)), 0) || 0;
  const progressPercent = totalSegments > 0 ? (totalProgressPoints / (totalSegments * 100)) * 100 : 0;

  return (
    <Card className="project-card hover:shadow-lg transition-shadow relative group">
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Delete project"
      >
        ×
      </button>
      
      <div className="p-6 cursor-pointer" onClick={onOpen}>
        {/* Project Header with Avatar */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar Image */}
          <div className="avatar-container flex-shrink-0">
            <AvatarImage
              avatar={{
                avatar_id: p.source_avatar_id,
                status: 'completed' // Assume avatar is completed if used in project
              }}
                className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200"
              showPlaceholder={true}
            />
          </div>
          
          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
              {p.name || `Project #${p.id.slice(0, 8)}`}
            </h3>
            {p.animation_prompt && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {p.animation_prompt}
              </p>
            )}
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>
              {getStatusText(p.status)}
          </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4 space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span className="font-medium">Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-500 h-2 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Status counters */}
          <div className="grid grid-cols-3 gap-2 mt-1">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>{completedSegments}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>{inProgressSegments}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>{failedSegments}</span>
          </div>
        </div>

        {/* Video Thumbnail - Only show when final video exists */}
        {p.final_video_url ? (
          <div className="mb-4 relative">
            <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
              {/* Avatar as background */}
              <AvatarImage
                avatar={{
                  avatar_id: p.source_avatar_id,
                  status: 'completed'
                }}
                className="w-full h-full object-cover"
                showPlaceholder={true}
              />
              
              {/* Semi-transparent overlay */}
              <div className="absolute inset-0 bg-opacity-30 flex items-center justify-center">
                {/* Play button */}
                <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all cursor-pointer">
                  <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                </div>
              </div>

              {/* Status badge in top-right corner */}
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Completed
              </div>
            </div>
          </div>
        ) : (
          /* No video placeholder - show progress or status instead */
          <div className="mb-4">
            <div className="w-full h-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-500">
                {p.status === 'pending' && (
                  <>
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">Pending processing</p>
                  </>
                )}
                {p.status === 'in_progress' && (
                  <>
                    <svg className="w-8 h-8 mx-auto mb-2 text-blue-400 animate-spin-infinite" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm">Creating segments...</p>
                  </>
                )}
                {p.status === 'assembling' && (
                  <>
                    <svg className="w-8 h-8 mx-auto mb-2 text-orange-400 animate-pulse-infinite" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <p className="text-sm">Assembling final video...</p>
                  </>
                )}
                {p.status === 'failed' && (
                  <>
                    <svg className="w-8 h-8 mx-auto mb-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <p className="text-sm">Creation failed</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 flex justify-between">
          <div>Created: {new Date(p.created_at).toLocaleDateString('ru-RU')}</div>
          <div>Segments: {totalSegments}</div>
        </div>
      </div>
    </Card>
  );
}

export default AnimationStudioPage; 