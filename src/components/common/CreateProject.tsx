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
    totalSegments: 0, // 0 означает «не выбрано»
    prompt: '',
    animationType: 'independent',
  });

  const { data: avatarsResponse, isLoading: avatarsLoading } = useAvatars();
  const createProjectMutation = useCreateAnimationProject();
  const [limitModalOpen, setLimitModalOpen] = useState(false);

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

    if (segmentsError) {
      toastError('Выберите количество сегментов');
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
      if (error?.message?.includes('Доступна только одна генерация видео')) {
        setLimitModalOpen(true);
      } else {
      toastError('Ошибка создания проекта: ' + error.message);
      }
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    if (field === 'totalSegments') {
      // value из <select> всегда строка
      let v = parseInt(value as string, 10);
      if (isNaN(v)) v = 0; // «не выбрано»
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
          <select
            value={formData.totalSegments || ''}
            onChange={(e) => handleInputChange('totalSegments', e.target.value)}
            disabled={isSubmitting}
            className={`rounded px-3 py-2 w-full bg-white border ${segmentsError ? 'border-red-500 focus:border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="" disabled>
              -- выберите --
            </option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          {segmentsError && (
            <p className="text-red-500 text-xs mt-1">Количество сегментов должно быть от 1 до 5</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Допустимо от 1 до 5 сегментов. Рекомендуется 3&nbsp;–&nbsp;5 для оптимального качества.
          </p>
        </div>

          {/* Animation Type Selection */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип анимации
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
                Несвязанные кадры
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
                Логически связанная анимация
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <b>Логически связанная</b>: следующий кадр можно сгенерировать только после завершения предыдущего.<br/>
              <b>Несвязанные кадры</b>: можно генерировать любые кадры в любом порядке.
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
                                'Создать проект'
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
      <Modal
        open={limitModalOpen}
        title="Лимит генерации видео"
        description="Новым пользователям доступна только одна генерация видео. Аватары и истории можно создавать без ограничений."
        onClose={() => setLimitModalOpen(false)}
        confirmText="Понятно"
      />
    </>
  );
} 