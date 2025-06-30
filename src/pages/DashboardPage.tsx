import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { AvatarCard, BackendStatus } from '@/components/common';
import { useAvatars } from '@/hooks/useAvatars';
import { useAnimations } from '@/hooks/useAnimations';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';

function DashboardPage() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: avatars, isLoading: avatarsLoading } = useAvatars();
  const { data: animations, isLoading: animationsLoading } = useAnimations();
  const logoutMutation = useLogout();

  const handleCreateAvatar = () => {
    navigate('/avatars');
  };

  const handleCreateAnimation = () => {
    navigate('/animations');
  };

  const recentAvatars = avatars?.avatars?.slice(0, 3) || [];
      const recentAnimations = animations?.slice(0, 3) || [];

  // Функция для получения цвета статуса
  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase?.().trim();
    return normalizedStatus === 'completed'
      ? 'text-green-600'
      : normalizedStatus === 'in_progress' || normalizedStatus === 'assembling'
      ? 'text-yellow-600'
      : normalizedStatus === 'failed'
      ? 'text-red-600'
      : 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header 
        user={user} 
        onLogout={() => logoutMutation.mutate()} 
        isLoggingOut={logoutMutation.isPending} 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Backend Status */}
        <div className="mb-6">
          <BackendStatus />
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Добро пожаловать, {user?.username}! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Управляйте своими аватарами и анимациями из единого центра
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer transform hover:scale-105 transition-transform duration-200"
                onClick={handleCreateAvatar}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎨</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Создать аватар</h3>
                <p className="text-purple-100">Создайте нового персонажа из текстового описания</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer transform hover:scale-105 transition-transform duration-200"
                onClick={handleCreateAnimation}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎬</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Создать анимацию</h3>
                <p className="text-blue-100">Оживите своих аватаров с помощью анимации</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-purple-600">👤</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Всего аватаров</p>
                <p className="text-2xl font-bold text-gray-900">
                  {avatarsLoading ? '...' : avatars?.avatars?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-blue-600">🎭</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Анимации</p>
                <p className="text-2xl font-bold text-gray-900">
                  {animationsLoading ? '...' : animations?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-green-600">📊</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Всего проектов</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(avatars?.avatars?.length || 0) + (animations?.length || 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Content */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Recent Avatars */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Последние аватары</h2>
              <Link 
                to="/avatars" 
                className="text-purple-600 hover:text-purple-500 font-medium transition-colors"
              >
                Смотреть все →
              </Link>
            </div>

            <div className="space-y-4">
              {avatarsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Загрузка аватаров...</p>
                </div>
              ) : recentAvatars.length > 0 ? (
                recentAvatars.map((avatar) => (
                  <AvatarCard 
                    key={avatar.avatar_id} 
                    avatar={avatar}
                    onDelete={() => {
                      // Обновление произойдет автоматически через React Query
                    }}
                  />
                ))
              ) : (
                <Card className="p-8 text-center bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎨</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Нет аватаров</h3>
                  <p className="text-gray-600 mb-4">Создайте своего первого персонажа</p>
                  <Button 
                    onClick={handleCreateAvatar}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    Создать аватар
                  </Button>
                </Card>
              )}
            </div>
          </div>

          {/* Recent Animations */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Последние анимации</h2>
              <Link 
                to="/animations" 
                className="text-purple-600 hover:text-purple-500 font-medium transition-colors"
              >
                Смотреть все →
              </Link>
            </div>

            <div className="space-y-4">
              {animationsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Загрузка анимаций...</p>
                </div>
              ) : recentAnimations.length > 0 ? (
                recentAnimations.map((animation) => (
                  <Card key={animation.id} className="p-4 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">🎬</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {animation.animation_prompt.length > 50 
                            ? `${animation.animation_prompt.substring(0, 50)}...` 
                            : animation.animation_prompt}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            getStatusColor(animation.status)
                          }`}>
                            {animation.status}
                          </span>
                          <span>{new Date(animation.created_at).toLocaleDateString('ru-RU')}</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/animations`)}
                      >
                        Открыть
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎬</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Нет анимаций</h3>
                  <p className="text-gray-600 mb-4">Создайте свою первую анимацию</p>
                  <Button 
                    onClick={handleCreateAnimation}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    Создать анимацию
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage; 