import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Modal from '@/components/ui/Modal';
import { useState } from 'react';

const createAvatarSchema = z.object({
  prompt: z.string().min(10, 'Описание должно содержать минимум 10 символов'),
});

type CreateAvatarFormData = z.infer<typeof createAvatarSchema>;

interface CreateAvatarFormProps {
  onSubmit: (data: CreateAvatarFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function CreateAvatarForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  error = null 
}: CreateAvatarFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateAvatarFormData>({
    resolver: zodResolver(createAvatarSchema),
  });

  const [limitModalOpen, setLimitModalOpen] = useState(false);

  const handleFormSubmit = (data: CreateAvatarFormData) => {
    onSubmit(data);
    reset();
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  // Показываем модалку если ошибка 403
  const isLimitError = typeof error === 'string' && error.includes('Доступна только одна генерация аватара');

  return (
    <>
      <Card className="mb-8 p-6 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Создать новый аватар</h2>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Описание персонажа
            </label>
            <Input
              id="prompt"
              type="text"
              placeholder="Например: Симпатичная девушка с длинными волосами, в стиле аниме, улыбающаяся"
              {...register('prompt')}
              className={`w-full ${errors.prompt ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {errors.prompt && (
              <p className="text-red-500 text-sm mt-1">{errors.prompt.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Чем подробнее описание, тем лучше будет результат
            </p>
          </div>

          {error && !isLimitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </p>
            </div>
          )}

          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Создание...</span>
                </div>
              ) : (
                'Создать аватар'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-6 py-3"
            >
              Отмена
            </Button>
          </div>
        </form>
      </Card>
      <Modal
        open={isLimitError}
        title="Лимит генерации аватара"
        description="Новым пользователям доступна только одна генерация аватара."
        onClose={() => setLimitModalOpen(false)}
        confirmText="Понятно"
      />
    </>
  );
} 