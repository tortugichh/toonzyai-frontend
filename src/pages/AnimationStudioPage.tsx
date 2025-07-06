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
        <Header user={user} onLogout={logoutMutation.mutateAsync} isLoggingOut={logoutMutation.isPending} />
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
      <Header user={user} onLogout={logoutMutation.mutateAsync} isLoggingOut={logoutMutation.isPending} />
      <div className="max-w-6xl mx-auto p-6">
        {/* Hero / Header */}
        <div className="studio-header mb-8 bg-gradient-to-r from-[#FFD27F] via-[#FF9A2B] to-[#C65A00] text-white rounded-xl p-6 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
            <Button onClick={() => navigate(-1)} variant="outline" className="border-white text-white hover:bg-white/10">← Назад</Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🎬 Студия анимации
              </h1>
              <p className="text-gray-600 mt-2">
                Создавайте анимации с уникальными промптами для каждого сегмента
              </p>
            </div>
          </div>

          {/* Avatar Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 sm:flex-none">
            <label htmlFor="avatarFilter" className="text-sm hidden md:block">Фильтр по аватару:</label>
            <select
              id="avatarFilter"
              value={avatarFilter}
              onChange={(e) => setAvatarFilter(e.target.value)}
              className="rounded px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-white/70 w-full sm:w-auto"
            >
              <option value="all">Все аватары</option>
              {availableAvatars.map(av => (
                <option key={av.avatar_id} value={av.avatar_id}>{av.prompt.slice(0, 40)}</option>
              ))}
            </select>
          </div>
          
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-[#FFD27F] via-[#FF9A2B] to-[#C65A00] hover:opacity-90 text-white px-6 py-3 transform-gpu hover:scale-105 transition w-full sm:w-auto"
          >
            ➕ Новый проект
          </Button>
        </div>

        {/* Projects List */}
        {isLoading ? (
          <div className="loading text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Загрузка проектов...</p>
          </div>
        ) : projects.length === 0 ? (
          <Card className="welcome-card text-center py-12">
            <div className="mb-6">
              <div className="text-6xl mb-4">🎭</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Добро пожаловать в ToonzyAI Studio!
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Здесь вы можете создавать удивительные анимации с помощью ИИ. 
                Начните с создания вашего первого проекта.
              </p>
            </div>
            
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              🚀 Создать первый проект
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
        title="Удалить проект?"
        description={`Вы уверены, что хотите удалить проект "${deleteProjectName}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
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
      case 'completed': return '✅ Завершен';
      case 'in_progress': return '⏳ В процессе';
      case 'assembling': return '🎬 Сборка';
      case 'failed': return '❌ Ошибка';
      default: return '⏸️ Ожидает';
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
        title="Удалить проект"
      >
        ×
      </button>
      
      <div className="p-6 cursor-pointer" onClick={onOpen}>
        {/* Project Header with Avatar */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar Image */}
          <div className="avatar-container flex-shrink-0">
            {p.source_avatar_url ? (
              <img 
                src={p.source_avatar_url}
                alt="Avatar"
                className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  const fallback = img.nextElementSibling as HTMLDivElement;
                  img.style.display = 'none';
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-400"
              style={{ display: p.source_avatar_url ? 'none' : 'flex' }}
            >
              🎭
            </div>
          </div>
          
          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
              {p.name || `Проект #${p.id.slice(0, 8)}`}
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
            <span className="font-medium">Прогресс</span>
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

        {/* Final Video Preview */}
        {p.final_video_url && (
          <div className="mb-4">
            <video 
              src={p.final_video_url}
              className="w-full h-24 object-cover rounded bg-gray-100"
              muted
              poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggNVYxOUwxOSAxMkw4IDVaIiBmaWxsPSIjNjM2NjcwIi8+Cjwvc3ZnPgo="
            />
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 flex justify-between">
          <div>Создан: {new Date(p.created_at).toLocaleDateString('ru-RU')}</div>
          <div>Сегментов: {totalSegments}</div>
        </div>
      </div>
    </Card>
  );
}

export default AnimationStudioPage; 