import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { AvatarCard } from '@entities/avatar';
import { CreateAvatarForm } from '@/components/forms';
import { ContentModerationModal } from '@/components/common/ContentModerationModal';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';
import { useAvatars, useCreateAvatar, useDeleteAvatar } from '@/hooks/useAvatars';
import type { CreateAvatarRequest } from '@/types/api';

interface SuccessNotificationProps {
  onClose: () => void;
}

function SuccessNotification({ onClose }: SuccessNotificationProps) {
  return (
    <Card className="mb-8 p-4 bg-green-50 border-green-200 border">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm">✓</span>
        </div>
        <div>
          <p className="text-green-800 font-medium">Аватар успешно создан!</p>
          <p className="text-green-600 text-sm">Генерация началась. Изображение появится через несколько минут.</p>
        </div>
        <Button
          variant="outline"
          onClick={onClose}
          className="ml-auto text-green-600 hover:text-green-700 border-green-300"
        >
          ✕
        </Button>
      </div>
    </Card>
  );
}

function AvatarsPage() {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [moderationModal, setModerationModal] = useState<{
    isOpen: boolean;
    reasons: string[];
    suggestedFix: string;
  }>({
    isOpen: false,
    reasons: [],
    suggestedFix: ''
  });
  
  const { data: user } = useCurrentUser();
  const { data: avatars, isLoading, refetch } = useAvatars();
  const createAvatarMutation = useCreateAvatar();
  const deleteAvatarMutation = useDeleteAvatar();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCreateAvatar = async (data: CreateAvatarRequest) => {
    try {
      await createAvatarMutation.mutateAsync(data);
      setShowCreateForm(false);
      setShowSuccess(true);
      refetch();
      // Скрываем уведомление через 5 секунд
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error: any) {
      console.error('Create avatar error:', error);
      
      // Получаем raw detail из APIError.details или из response.data.detail
      let errorData = (error as any)?.details;
      // Если вложенный detail
      if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
        errorData = (errorData as any).detail;
      }
      
      // Если не найдено, пробуем path для Axios
      if (!errorData) {
        errorData = (error as any)?.response?.data?.detail;
      }
      // Распаковываем вложенный detail, если есть
      if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
        errorData = (errorData as any).detail;
      }
      
      // Если detail - строка, пробуем распарсить как JSON
      if (typeof errorData === 'string') {
        try {
          errorData = JSON.parse(errorData);
        } catch {
          // остаемся с оригиналом
        }
      }
      
      console.log('Parsed error data:', errorData);
      
      if (errorData?.error === 'content_policy_violation') {
        setModerationModal({
          isOpen: true,
          reasons: Array.isArray(errorData.reasons) ? errorData.reasons : ['Неподходящий контент'],
          suggestedFix: typeof errorData.suggested_fix === 'string' ? errorData.suggested_fix : 'Попробуйте изменить описание'
        });
      }
    }
  };

  const handleDeleteAvatar = async (avatarId: string) => {
    try {
      await deleteAvatarMutation.mutateAsync(avatarId);
      refetch();
    } catch (error) {
      console.error('Delete avatar error:', error);
    }
  };

  // Функция для тестирования модального окна модерации
  const handleTestModerationModal = () => {
    setModerationModal({
      isOpen: true,
      reasons: [
        'Обнаружен контент с элементами насилия',
        'Неподходящее описание внешности',
        'Нарушение правил сообщества'
      ],
      suggestedFix: 'Попробуйте описать персонажа в позитивном ключе, избегая упоминания насилия, травм или неподходящего контента. Сосредоточьтесь на внешности, одежде и позитивных эмоциях.'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        isLoggingOut={logoutMutation.isPending} 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Мои аватары</h1>
            <p className="text-xl text-gray-600">
              Создавайте и управляйте своими ИИ персонажами
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-[#FFD27F] via-[#FF9A2B] to-[#C65A00] hover:opacity-90 text-white px-6 py-3 transform-gpu hover:scale-105 transition"
            >
              Создать аватар
            </Button>
            {/* Кнопка для тестирования модального окна модерации */}
            
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <SuccessNotification onClose={() => setShowSuccess(false)} />
        )}

        

        {/* Info tip about animations */}
        {avatars?.avatars && avatars.avatars.some(a => a.status?.toLowerCase?.().trim() === 'completed') && (
          <Card className="mb-8 p-4 bg-blue-50 border-blue-200 border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16l13-8L7 4z" />
                </svg>
              </div>
              <div>
                <p className="text-blue-800 font-medium">Готовые аватары можно анимировать!</p>
                <p className="text-blue-600 text-sm">
                  Нажмите кнопку "Создать анимацию" на карточке готового аватара или перейдите в раздел{' '}
                  <Button
                    variant="link"
                    onClick={() => navigate('/animations')}
                    className="text-blue-700 underline p-0 h-auto font-medium"
                  >
                    Анимации
                  </Button>
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        {avatars?.avatars && avatars.avatars.length > 0 && (
          <Card className="mb-8 p-6 bg-gradient-to-r from-[#FFD27F] via-[#FF9A2B] to-[#C65A00] text-white border-0">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">📊 Статистика</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <p className="text-3xl font-bold">{avatars.total || 0}</p>
                  <p className="text-orange-100">Всего аватаров</p>
                </div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-800">
                    {avatars.avatars.filter(a => a.status?.toLowerCase?.().trim() === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-100">Готовых аватаров</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-yellow-200">
                    {avatars.avatars.filter(a => a.status?.toLowerCase?.().trim() === 'generating').length}
                  </div>
                  <div className="text-sm text-gray-100">В процессе</div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Create Avatar Form */}
        {showCreateForm && (
          <CreateAvatarForm
            onSubmit={handleCreateAvatar}
            onCancel={() => setShowCreateForm(false)}
            isLoading={createAvatarMutation.isPending}
            error={null}
          />
        )}

        {/* Avatars Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <div className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : avatars?.avatars?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {avatars.avatars.map((avatar) => (
              <AvatarCard
                key={avatar.avatar_id}
                avatar={avatar}
                onDelete={handleDeleteAvatar}
                isDeleting={deleteAvatarMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-16 h-16 text-blue-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2V3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              У вас пока нет аватаров
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Создайте своего первого ИИ персонажа! Просто опишите, как он должен выглядеть, 
              и наш алгоритм сгенерирует уникального аватара.
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-[#FFD27F] via-[#FF9A2B] to-[#C65A00] w-full sm:w-auto hover:opacity-90 text-white px-8 py-3 text-md sm:text-lg transform-gpu hover:scale-105 transition"
            >
              Создать первого аватара
            </Button>
          </Card>
        )}
      </div>

      {/* Content Moderation Modal */}
      <ContentModerationModal
        isOpen={moderationModal.isOpen}
        onClose={() => setModerationModal({ isOpen: false, reasons: [], suggestedFix: '' })}
        reasons={moderationModal.reasons}
        suggestedFix={moderationModal.suggestedFix}
        onRetry={() => {
          setModerationModal({ isOpen: false, reasons: [], suggestedFix: '' });
          // Форма остается открытой для повторной попытки
        }}
      />
    </div>
  );
}

export default AvatarsPage;