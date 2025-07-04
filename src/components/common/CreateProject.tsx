import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAvatars } from '@/hooks/useAvatars';
import { useCreateAnimationProject } from '@/hooks/useAnimations';
import type { AnimationProject } from '@/services/api';
import { toastError } from '@/utils/toast';

interface CreateProjectProps {
  onProjectCreated: (project: AnimationProject) => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  avatarId: string;
  totalSegments: number;
  prompt: string;
}

export function CreateProject({ onProjectCreated, onCancel }: CreateProjectProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    avatarId: '',
    totalSegments: 3,
    prompt: ''
  });

  const { data: avatarsResponse, isLoading: avatarsLoading } = useAvatars();
  const createProjectMutation = useCreateAnimationProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.avatarId) {
      toastError('Выберите аватар');
      return;
    }

    if (!formData.title.trim()) {
      toastError('Введите название проекта');
      return;
    }

    try {
      const project = await createProjectMutation.mutateAsync({
        name: formData.title.trim(),
        sourceAvatarId: formData.avatarId,
        totalSegments: formData.totalSegments,
        animationPrompt: formData.prompt.trim() || undefined
      });
      
      onProjectCreated(project);
    } catch (error: any) {
      toastError('Ошибка создания проекта: ' + error.message);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    // Ensure totalSegments stays in 1-10 range and is an integer
    if (field === 'totalSegments') {
      let v = typeof value === 'number' ? value : parseInt(value as string, 10);
      if (isNaN(v)) v = 1;
      if (v < 1) v = 1;
      if (v > 10) v = 10;
      setFormData(prev => ({ ...prev, totalSegments: v }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const isSubmitting = createProjectMutation.isPending;
  const avatars = avatarsResponse?.avatars || [];

  const segmentsError = formData.totalSegments < 1 || formData.totalSegments > 10;

  // Validation helpers
  const promptError = formData.prompt.trim().length > 0 && formData.prompt.trim().length < 10;

  return (
    <Card className="create-project-form max-w-2xl mx-auto p-6">
      <div className="form-header mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Создать новый проект
        </h2>
        <p className="text-gray-600">
          Выберите аватар и опишите анимацию, которую хотите создать
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Title */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название проекта
          </label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Введите название проекта"
            disabled={isSubmitting}
            className="w-full"
          />
        </div>

        {/* Avatar Selection */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите аватар
          </label>
          
          {avatarsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Загрузка аватаров...</span>
            </div>
          ) : avatars.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Нет доступных аватаров</p>
              <p className="text-sm mt-1">Сначала создайте аватар в разделе "Аватары"</p>
            </div>
          ) : (
            <div className="avatars-grid grid grid-cols-2 md:grid-cols-3 gap-4">
              {avatars.map(avatar => (
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
                        // Fallback if image fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {avatar.prompt}
                  </p>
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
            Количество сегментов
          </label>
          <Input
            type="number"
            min="1"
            max="10"
            value={formData.totalSegments}
            onChange={(e) => handleInputChange('totalSegments', e.target.value)}
            disabled={isSubmitting}
            className={`w-full ${segmentsError ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {segmentsError && (
            <p className="text-red-500 text-xs mt-1">Количество сегментов должно быть от 1 до 10</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Рекомендуется 3-5 сегментов для оптимального качества
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
                <span>Создание...</span>
              </div>
            ) : (
              '🚀 Создать проект'
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
              Отмена
            </Button>
          )}
        </div>

        {/* Error Display */}
        {createProjectMutation.isError && (
          <div className="error-message mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
            <p>Ошибка создания проекта: {createProjectMutation.error instanceof Error ? createProjectMutation.error.message : String(createProjectMutation.error)}</p>
          </div>
        )}
      </form>
    </Card>
  );
} 