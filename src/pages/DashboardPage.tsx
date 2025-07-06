import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { BackendStatus } from '@/components/common';
import { AvatarCard } from '@entities/avatar';
import { useAvatars } from '@/hooks/useAvatars';
import { useAnimationProjects } from '@/hooks/useAnimations';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';

function DashboardPage() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: avatars, isLoading: avatarsLoading } = useAvatars();
  const { data: animations, isLoading: animationsLoading } = useAnimationProjects();
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <Header 
        user={user} 
        onLogout={() => logoutMutation.mutate()} 
        isLoggingOut={logoutMutation.isPending} 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Backend Status */}
        <div className="mb-6">
          <BackendStatus />
        </div>

        {/* Welcome Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-black text-sm font-medium mb-6">
            🏠 Панель управления
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 gradient-text-animated">
            Добро пожаловать, {user?.username}! 👋
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Управляйте своими аватарами и анимациями из единого центра
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="p-8 bg-white rounded-xl shadow-card cursor-pointer overflow-hidden group transition-shadow duration-300 hover:shadow-lg"
                onClick={handleCreateAvatar}>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-light to-primary rounded-lg flex items-center justify-center shadow group-hover:scale-105 transition-transform duration-300">
                <span className="text-3xl">🎨</span>
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary-light transition-colors duration-300">Создать аватар</h3>
                <p className="text-white/80 leading-relaxed">Создайте нового персонажа из текстового описания</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-white rounded-xl shadow-card cursor-pointer overflow-hidden group transition-shadow duration-300 hover:shadow-lg"
                onClick={handleCreateAnimation}>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-light to-secondary rounded-lg flex items-center justify-center shadow group-hover:scale-105 transition-transform duration-300">
                <span className="text-3xl">🎬</span>
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-3 group-hover:text-secondary-light transition-colors duration-300">Создать анимацию</h3>
                <p className="text-white/80 leading-relaxed">Оживите своих аватаров с помощью анимации</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Cards - unified design */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 bg-gray-50 border border-gray-200 rounded-xl shadow-card group relative hover:shadow-lg">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-light to-primary rounded-2xl flex items-center justify-center shadow">
                <span className="text-3xl text-white">👤</span>
              </div>
              <h3 className="text-5xl font-bold text-black">
                  {avatarsLoading ? '...' : avatars?.avatars?.length || 0}
              </h3>
              <p className="text-sm text-gray-600 uppercase tracking-wide font-medium">Всего аватаров</p>
            </div>
            <Link to="/avatars" className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary-light font-medium">
              Посмотреть все
            </Link>
          </Card>

          <Card className="p-8 bg-gray-50 border border-gray-200 rounded-xl shadow-card group relative hover:shadow-lg">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-light to-secondary rounded-2xl flex items-center justify-center shadow">
                <span className="text-3xl text-white">🎭</span>
              </div>
              <h3 className="text-5xl font-bold text-black">
                  {animationsLoading ? '...' : animations?.length || 0}
              </h3>
              <p className="text-sm text-gray-600 uppercase tracking-wide font-medium">Анимации</p>
            </div>
            <Link to="/animations" className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary-light font-medium">
              Посмотреть все
            </Link>
          </Card>

          <Card className="p-8 bg-gray-50 border border-gray-200 rounded-xl shadow-card group relative hover:shadow-lg">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow">
                <span className="text-3xl text-white">📊</span>
              </div>
              <h3 className="text-5xl font-bold text-black">
                  {(avatars?.avatars?.length || 0) + (animations?.length || 0)}
              </h3>
              <p className="text-sm text-gray-600 uppercase tracking-wide font-medium">Всего проектов</p>
            </div>
          </Card>
        </div>

        {/* Recent Content */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Recent Avatars */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-black">Последние аватары</h2>
              <Link 
                to="/avatars" 
                className="text-primary hover:text-secondary font-medium transition-colors duration-300 inline-flex items-center space-x-2 group"
              >
                <span>Смотреть все</span>
                <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
            </div>

            <div className="space-y-4">
              {avatarsLoading ? (
                <Card className="p-12 bg-gray-50 border border-gray-200 rounded-xl shadow-card text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-700 mt-4 text-lg">Загрузка аватаров...</p>
                </Card>
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
                <Card className="p-12 bg-white border border-gray-200 rounded-xl shadow-card group hover:shadow-lg transition-shadow duration-300 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-light to-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                    <span className="text-3xl text-white">🎨</span>
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-4">Нет аватаров</h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">Создайте своего первого персонажа</p>
                  <Button 
                    onClick={handleCreateAvatar}
                    size="lg"
                    className="bg-gradient-to-r from-[#FFA657] via-[#FF8800] to-[#CC6E00] text-white px-6 py-3 rounded-xl hover:opacity-90 transition transform-gpu hover:scale-105 shadow-lg"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                    <span className="relative z-10">
                    Создать аватар
                    </span>
                  </Button>
                </Card>
              )}
            </div>
          </div>

          {/* Recent Animations */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-black">Последние анимации</h2>
              <Link 
                to="/animations" 
                className="text-primary hover:text-secondary font-medium transition-colors duration-300 inline-flex items-center space-x-2 group"
              >
                <span>Смотреть все</span>
                <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
            </div>

            <div className="space-y-4">
              {animationsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-700 mt-2">Загрузка анимаций...</p>
                </div>
              ) : recentAnimations.length > 0 ? (
                recentAnimations.map((animation: any) => (
                  <Card key={animation.id} className="p-4 bg-white rounded-xl shadow-card hover:shadow-lg transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">🎬</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {(() => {
                            const title = animation.name || animation.animation_prompt || 'Без названия';
                            return title.length > 50 ? `${title.substring(0, 50)}...` : title;
                          })()}
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
                <Card className="p-8 bg-gray-50 border border-gray-200 rounded-xl shadow-card text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎬</span>
                  </div>
                  <h3 className="text-lg font-medium text-black mb-2">Нет анимаций</h3>
                  <p className="text-gray-700 mb-4">Создайте свою первую анимацию</p>
                  <Button 
                    onClick={handleCreateAnimation}
                    className="bg-gradient-to-r from-[#FFA657] via-[#FF8800] to-[#CC6E00] text-white px-6 py-3 rounded-xl hover:opacity-90 transition transform-gpu hover:scale-105 shadow-lg"
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