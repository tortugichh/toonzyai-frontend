import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/Header';
import { AnimationSegments, VideoPreview, AvatarSelector, BackendStatus, CompactAnimationMonitor } from '@/components/common';
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

const createAnimationSchema = z.object({
  sourceAvatarId: z.string().min(1, 'Выберите аватар'),
  animationPrompt: z.string().min(10, 'Описание должно содержать минимум 10 символов'),
  totalSegments: z.number().min(1).max(20),
});

type CreateAnimationFormData = z.infer<typeof createAnimationSchema>;

function AnimationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedAvatarId = location.state?.sourceAvatarId;
  
  const [showCreateForm, setShowCreateForm] = useState(!!preselectedAvatarId);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Debug: отслеживаем изменения showCreateForm
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
    // Приводим данные формы к camelCase, так как backend-hook ожидает именно их
    const payload = {
      name: data.name || 'Новый проект',
      sourceAvatarId: data.sourceAvatarId ?? data.source_avatar_id,
      totalSegments:
        typeof data.totalSegments !== 'undefined'
          ? Number(data.totalSegments)
          : Number(data.total_segments),
      animationPrompt: data.animationPrompt ?? data.animation_prompt,
    };

    console.log('🚀 Отправляем payload для создания анимации:', payload);

    try {
      await createAnimationMutation.mutateAsync(payload as any);
      setShowCreateForm(false);
      reset();
      setSuccessMessage('Анимация запущена! Процесс может занять несколько минут.');
      refetch();
    } catch (error) {
      console.error('Create animation error:', error);
    }
  };

  const handleDeleteAnimation = async (animationId: string) => {
    if (confirm('Вы уверены, что хотите удалить эту анимацию?')) {
      try {
        await deleteAnimationMutation.mutateAsync(animationId);
        setSuccessMessage('Анимация удалена');
        refetch();
      } catch (error) {
        console.error('Delete animation error:', error);
      }
    }
  };

  const handleAssembleVideo = async (animationId: string) => {
    try {
      await assembleVideoMutation.mutateAsync(animationId);
      setSuccessMessage('Запущена сборка финального видео!');
      refetch();
    } catch (error) {
      console.error('Assemble video error:', error);
    }
  };

  // Data processing
  const availableAvatars = avatars?.avatars?.filter(
    avatar => avatar.status?.toLowerCase?.().trim() === 'completed'
  ) || [];
  
  // Debug: показываем все аватары для отладки
  console.log('Все аватары:', avatars?.avatars?.map(a => ({ id: a.avatar_id, status: a.status, prompt: a.prompt.slice(0, 30) })));
  console.log('Доступные аватары (COMPLETED):', availableAvatars.length);
  console.log('Показать форму создания?', showCreateForm);
  console.log('Доступен ли создатель анимации?', availableAvatars.length > 0);

  // Временно: показываем аватары во всех статусах для тестирования
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
            <p className="text-lg text-gray-600">Загрузка...</p>
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
        <div className="mb-6">
          <BackendStatus />
        </div>

        {/* Debug авторизации */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mb-6 p-4 bg-gray-50 border-gray-200">
            <h3 className="font-medium mb-2">🔍 Debug информация:</h3>
            <div className="text-xs space-y-1">
              <p><strong>Пользователь:</strong> {user ? `${user.username} (${user.email})` : 'Не авторизован'}</p>
              <p><strong>Access Token:</strong> {localStorage.getItem('access_token') ? 'Есть' : 'Нет'}</p>
              <p><strong>Всего аватаров:</strong> {avatars?.avatars?.length || 0}</p>
              <p><strong>Готовых аватаров:</strong> {availableAvatars.length}</p>
              <p><strong>Всего анимаций:</strong> {animations?.length || 0}</p>
            </div>
            {!user && (
              <Button 
                className="mt-3 text-xs" 
                size="sm"
                onClick={() => navigate('/login')}
              >
                Перейти к авторизации
              </Button>
            )}
            
            {/* Тестовые кнопки API */}
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
                    
                                         // Детальная информация об аватарах
                     if (data.avatars && data.avatars.length > 0) {
                       data.avatars.forEach((avatar: any, index: number) => {
                         console.log(`Аватар ${index + 1}:`, {
                           id: avatar.avatar_id,
                           status: avatar.status,
                           prompt: avatar.prompt?.substring(0, 50) + '...',
                           created: avatar.created_at
                         });
                       });
                     }
                     
                     alert(`Аватары: ${response.status}\nВсего: ${data.total}\nСтатусы: ${data.avatars?.map((a: any) => a.status).join(', ')}`);
                  } catch (error) {
                    console.error('API Test Error:', error);
                    alert(`Ошибка: ${error}`);
                  }
                }}
              >
                Тест API Аватары
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
                    
                                         // Детальная информация об анимациях
                     if (Array.isArray(data) && data.length > 0) {
                       data.forEach((animation: any, index: number) => {
                         console.log(`Анимация ${index + 1}:`, {
                           id: animation.id,
                           status: animation.status,
                           prompt: animation.animation_prompt?.substring(0, 50) + '...',
                           avatar_id: animation.source_avatar_id,
                           segments: animation.total_segments
                         });
                       });
                     }
                     
                     alert(`Анимации: ${response.status}\nВсего: ${Array.isArray(data) ? data.length : 0}\nСтатусы: ${Array.isArray(data) ? data.map((a: any) => a.status).join(', ') : 'N/A'}`);
                  } catch (error) {
                    console.error('API Test Error:', error);
                    alert(`Ошибка: ${error}`);
                  }
                }}
              >
                Тест API Анимации
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
                    alert(`Профиль: ${response.status} - ${JSON.stringify(data).substring(0, 100)}`);
                  } catch (error) {
                    console.error('API Test Error:', error);
                    alert(`Ошибка: ${error}`);
                  }
                }}
              >
                Тест авторизации
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
                <p className="text-amber-800 font-medium">Требуется авторизация</p>
                <p className="text-amber-700 text-sm">
                  Для создания анимаций необходимо войти в систему
                </p>
              </div>
              <Button 
                onClick={() => navigate('/login')}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Войти
              </Button>
            </div>
          </Card>
        )}

        {/* No Avatars Info */}
        {user && availableAvatars.length === 0 && allAvatarsForTesting.length === 0 && (
          <Card className="mb-6 p-6 bg-blue-50 border-blue-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Создайте свой первый аватар
              </h3>
              <p className="text-blue-700 mb-4">
                Для создания анимаций сначала нужно создать аватар из текстового описания
              </p>
              <Button 
                onClick={() => navigate('/avatars')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                🎨 Создать аватар
              </Button>
            </div>
          </Card>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                🎬 Анимации
              </h1>
              <p className="text-lg text-gray-600">
                Создавайте говорящие анимации из ваших аватаров
              </p>
            </div>
            <Button
              onClick={() => {
                console.log('Кнопка "Создать анимацию" нажата');
                console.log('Доступные аватары:', availableAvatars.length);
                setShowCreateForm(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3"
              disabled={availableAvatars.length === 0}
            >
              ✨ Создать анимацию {availableAvatars.length > 0 ? `(${availableAvatars.length} готов)` : '(недоступно)'}
            </Button>
          </div>
        </div>

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
                <p className="text-red-800 font-medium">Ошибка создания анимации</p>
                <p className="text-red-600 text-sm">{getErrorMessage(createAnimationMutation.error)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* No Avatars Warning */}
        {availableAvatars.length === 0 && (
          <Card className="p-6 bg-yellow-50 border border-yellow-200 mb-8">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">Нет готовых аватаров</h3>
                {avatars?.avatars && avatars.avatars.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-yellow-700 text-sm">
                      У вас есть {avatars.avatars.length} аватаров, но они ещё не готовы:
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
                            {avatar.status === 'generating' ? 'Генерируется' :
                            avatar.status === 'failed' ? 'Ошибка' :
                            avatar.status === 'pending' ? 'В очереди' : 
                            avatar.status === 'completed' ? 'Готов' : avatar.status}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-yellow-700 text-sm mt-3">
                      Дождитесь завершения генерации или создайте новый аватар.
                    </p>
                  </div>
                ) : (
                  <p className="text-yellow-700 text-sm">
                    Для создания анимации сначала нужно создать аватар.
                  </p>
                )}
                <Button 
                  variant="link" 
                  onClick={() => navigate('/avatars')}
                  className="text-yellow-800 underline p-0 h-auto ml-1 mt-2"
                >
                  Перейти к аватарам →
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
                <h3 className="font-medium text-blue-800">Режим отладки</h3>
                <p className="text-blue-700 text-sm">
                  Временно разрешаем выбор аватаров в любом статусе для тестирования.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    variant="outline"
                    className="text-blue-600 border-blue-300"
                  >
                    🧪 Тест создания анимации
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/v1/health');
                        const data = await response.json();
                        alert(`Backend доступен: ${data.status} v${data.version}`);
                                             } catch (error) {
                         alert(`Ошибка подключения к backend: ${error instanceof Error ? error.message : String(error)}`);
                      }
                    }}
                    variant="outline"
                    className="text-blue-600 border-blue-300"
                  >
                    🔍 Проверить API
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Debug формы создания */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
            <h3 className="font-medium mb-2">🔧 Debug формы создания:</h3>
            <div className="text-xs space-y-1">
              <p><strong>Показать форму:</strong> {showCreateForm ? 'ДА' : 'НЕТ'}</p>
              <p><strong>Загружаются аватары:</strong> {avatarsLoading ? 'ДА' : 'НЕТ'}</p>
              <p><strong>Загружаются анимации:</strong> {animationsLoading ? 'ДА' : 'НЕТ'}</p>
              <p><strong>Доступные аватары:</strong> {availableAvatars.length}</p>
              <p><strong>Кнопка заблокирована:</strong> {availableAvatars.length === 0 ? 'ДА' : 'НЕТ'}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <Button 
                size="sm"
                onClick={() => setShowCreateForm(true)}
                className="text-xs bg-blue-600 text-white"
              >
                Принудительно показать форму
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="text-xs"
              >
                Скрыть форму
              </Button>
            </div>
          </Card>
        )}

        {/* Create Animation Form */}
        {showCreateForm && (
          <Card className="p-6 mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Создать анимацию</h2>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕ Закрыть
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Avatar Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Выберите аватар для анимации
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
                  Описание анимации
                </label>
                <textarea
                  id="animation_prompt"
                  rows={4}
                  {...register('animation_prompt')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                    errors.animation_prompt ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Опишите, что должен говорить или делать ваш аватар. Например: 'Привет! Меня зовут Анна и я хочу рассказать о нашем новом продукте...'"
                />
                {errors.animation_prompt && (
                  <p className="text-red-500 text-sm mt-1">{errors.animation_prompt.message}</p>
                )}
              </div>

              {/* Total Segments */}
              <div>
                <label htmlFor="total_segments" className="block text-sm font-medium text-gray-700 mb-2">
                  Количество сегментов (1-20)
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
                  Больше сегментов = более качественный результат, но дольше обработка
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
                  Отменить
                </Button>
                <Button
                  type="submit"
                  disabled={createAnimationMutation.isPending || !watchedAvatarId}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {createAnimationMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Создание...</span>
                    </div>
                  ) : (
                    '🎬 Создать анимацию'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}

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
              <span className="text-3xl">🎬</span>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">Нет анимаций</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Создайте свою первую анимацию, чтобы оживить ваших аватаров
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              disabled={availableAvatars.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              🎨 Создать анимацию
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
              <p className="text-gray-600">Всего анимаций</p>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl text-green-600">✅</span>
              </div>
              <p className="text-3xl font-bold">
                {animations?.filter((a: AnimationProject) => 
                  a.status === 'completed'
                ).length || 0}
              </p>
              <p className="text-gray-600">Завершено</p>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl text-yellow-600">⚙️</span>
              </div>
              <p className="text-3xl font-bold">
                {animations?.filter((a: AnimationProject) => {
                  return a.status === 'in_progress' || a.status === 'assembling';
                }).length || 0}
              </p>
              <p className="text-gray-600">В обработке</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Отдельный компонент для карточки анимации
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
        return 'Завершено';
      case 'in_progress':
        return 'Генерация';
      case 'assembling':
        return 'Сборка видео';
      case 'failed':
        return 'Ошибка';
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
            {animation.animation_prompt.length > 100 
              ? `${animation.animation_prompt.substring(0, 100)}...` 
              : animation.animation_prompt}
          </h3>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
            <span>ID: {animation.id}</span>
            <span>Создано: {new Date(animation.created_at).toLocaleDateString('ru-RU')}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(animation.status)}`}>
              {getStatusText(animation.status)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Прогресс: {completedSegments} / {animation.total_segments} сегментов</span>
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
                      <span className="text-2xl">🎉</span>
                      <div>
                        <h4 className="font-medium text-green-800">Анимация готова!</h4>
                        <p className="text-green-600 text-sm">Финальное видео сформировано</p>
                      </div>
                    </div>
                  </div>
                  <VideoPreview 
                    videoUrl={animation.final_video_url}
                    title="Финальное видео"
                  />
                </div>
              ) : animation.status === 'assembling' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                    <div>
                      <h4 className="font-medium text-yellow-800">Сборка видео...</h4>
                      <p className="text-yellow-600 text-sm">Пожалуйста, подождите</p>
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
                      <span>Запуск сборки...</span>
                    </div>
                  ) : (
                    '🔧 Собрать финальное видео'
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
            🎨 Студия
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(animation.id)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? '...' : '🗑️'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default AnimationPage; 