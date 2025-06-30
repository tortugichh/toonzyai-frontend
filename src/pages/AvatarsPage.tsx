import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { AvatarCard } from '@/components/common/AvatarCard';
import { CreateAvatarForm } from '@/components/forms/CreateAvatarForm';
import { AvatarDebugPanel } from '@/components/common/AvatarDebugPanel';
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
  
  const { data: user } = useCurrentUser();
  const { data: avatars, isLoading, refetch } = useAvatars();
  const createAvatarMutation = useCreateAvatar();
  const deleteAvatarMutation = useDeleteAvatar();
  const logoutMutation = useLogout();

  // Временное логирование для отладки статусов
  if (avatars?.avatars) {
    console.log('=== ОТЛАДКА СТАТУСОВ АВАТАРОВ ===');
    avatars.avatars.forEach((avatar, index) => {
      console.log(`Аватар ${index + 1}:`, {
        id: avatar.avatar_id,
        status: avatar.status,
        statusType: typeof avatar.status,
        statusUpperCase: avatar.status?.toString().toUpperCase(),
        prompt: avatar.prompt.slice(0, 30) + '...',
        created: avatar.created_at,
        hasImageUrl: !!avatar.image_url
      });
    });
    console.log('=== КОНЕЦ ОТЛАДКИ ===');
  }

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
    } catch (error) {
      console.error('Create avatar error:', error);
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
              onClick={async () => {
                try {
                  console.log('🔍 ПРЯМОЙ ВЫЗОВ API...');
                  const token = localStorage.getItem('access_token');
                  console.log('🔑 Токен:', token ? 'Есть' : 'Нет');
                  
                  const response = await fetch('/api/v1/avatars/?page=1&per_page=20', {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  console.log('📡 Статус ответа:', response.status);
                  const data = await response.json();
                  console.log('📊 СЫРЫЕ ДАННЫЕ ОТ API:', data);
                  
                  if (data.avatars) {
                    data.avatars.forEach((avatar: any, index: number) => {
                      console.log(`🎭 Аватар ${index + 1} (RAW):`, avatar);
                    });
                  }
                  
                  alert(`Проверьте консоль браузера (F12) для подробной информации`);
                } catch (error) {
                  console.error('❌ Ошибка API:', error);
                  alert(`Ошибка: ${error}`);
                }
              }}
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-700 border-blue-300"
            >
              🔍 Проверить API
            </Button>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3"
            >
              ✨ Создать аватар
            </Button>
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
                <span className="text-white text-sm">🎬</span>
              </div>
              <div>
                <p className="text-blue-800 font-medium">Готовые аватары можно анимировать!</p>
                <p className="text-blue-600 text-sm">
                  Нажмите кнопку "🎬 Создать анимацию" на карточке готового аватара или перейдите в раздел{' '}
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

        {/* Debug Panel - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8">
            <AvatarDebugPanel />
          </div>
        )}

        {/* Create Avatar Form */}
        {showCreateForm && (
          <CreateAvatarForm
            onSubmit={handleCreateAvatar}
            onCancel={() => setShowCreateForm(false)}
            isLoading={createAvatarMutation.isPending}
            error={createAvatarMutation.error?.message || null}
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <span className="text-4xl">🎨</span>
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
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg"
            >
              ✨ Создать первого аватара
            </Button>
          </Card>
        )}

        {/* Stats */}
        {avatars?.avatars && avatars.avatars.length > 0 && (
          <Card className="mt-8 p-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white border-0">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">📊 Статистика</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <p className="text-3xl font-bold">{avatars.total || 0}</p>
                  <p className="text-purple-100">Всего аватаров</p>
                </div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-800">
                    {avatars.avatars.filter(a => a.status?.toLowerCase?.().trim() === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Готовых аватаров</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-yellow-600">
                    {avatars.avatars.filter(a => a.status?.toLowerCase?.().trim() === 'generating').length}
                  </div>
                  <div className="text-sm text-gray-600">В процессе</div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AvatarsPage;