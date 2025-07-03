import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreateProject } from '@/components/common';
import { useAnimationProjects } from '@/hooks/useAnimations';
import { useNavigate } from 'react-router-dom';
import type { AnimationProject as AnimationProjectType } from '@/services/api';

function AnimationStudioPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: projects = [], isLoading, refetch } = useAnimationProjects();
  const navigate = useNavigate();

  if (showCreateForm) {
    return (
      <CreateProject 
        onProjectCreated={(project) => {
          setShowCreateForm(false);
          refetch();
          navigate(`/studio/${project.id}`);
        }}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  // Main studio page - project list
  return (
    <div className="animation-studio-page min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="studio-header flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🎬 Студия анимации
            </h1>
            <p className="text-gray-600 mt-2">
              Создавайте анимации с уникальными промптами для каждого сегмента
            </p>
          </div>
          
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
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
          <div className="projects-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard 
                key={project.id}
                project={project}
                onOpen={() => navigate(`/studio/${project.id}`)}
              />
            ))}
          </div>
        )}

        {/* Features Info */}
        <div className="features-info mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="feature-card p-6 text-center">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold mb-2">Точный контроль</h3>
            <p className="text-sm text-gray-600">
              Настраивайте промпт для каждого сегмента индивидуально
            </p>
          </Card>
          
          <Card className="feature-card p-6 text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">Быстрая генерация</h3>
            <p className="text-sm text-gray-600">
              Автоматическое отслеживание прогресса и обновления в реальном времени
            </p>
          </Card>
          
          <Card className="feature-card p-6 text-center">
            <div className="text-3xl mb-3">🎬</div>
            <h3 className="font-semibold mb-2">Финальная сборка</h3>
            <p className="text-sm text-gray-600">
              Автоматическая сборка всех сегментов в единое видео
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Project Card Component
interface ProjectCardProps {
  project: AnimationProjectType;
  onOpen: () => void;
}

function ProjectCard({ project, onOpen }: ProjectCardProps) {
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

  const completedSegments = project.segments?.filter(s => s.status === 'completed').length || 0;
  const inProgressSegments = project.segments?.filter(s => s.status === 'in_progress').length || 0;
  const failedSegments = project.segments?.filter(s => s.status === 'failed').length || 0;
  const totalSegments = project.total_segments;

  return (
    <Card className="project-card cursor-pointer hover:shadow-lg transition-shadow" onClick={onOpen}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              Проект #{project.id.slice(0, 8)}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {project.animation_prompt}
            </p>
          </div>
          
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {getStatusText(project.status)}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-4 space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span className="font-medium">Прогресс</span>
            <span>{completedSegments}/{totalSegments}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-500 h-2"
              style={{ width: `${(completedSegments / totalSegments) * 100}%` }}
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
        {project.final_video_url && (
          <div className="mb-4">
            <video 
              src={project.final_video_url}
              className="w-full h-24 object-cover rounded bg-gray-100"
              muted
              poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggNVYxOUwxOSAxMkw4IDVaIiBmaWxsPSIjNjM2NjcwIi8+Cjwvc3ZnPgo="
            />
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500">
          <div>Создан: {new Date(project.created_at).toLocaleDateString('ru-RU')}</div>
          <div>Аватар: {project.source_avatar_id.slice(0, 8)}...</div>
        </div>
      </div>
    </Card>
  );
}

export default AnimationStudioPage; 