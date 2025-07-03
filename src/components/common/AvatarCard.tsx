import type { Avatar } from '../../services/api';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import AvatarImage from './AvatarImage';

interface AvatarCardProps {
  avatar: Avatar;
  onDelete: (avatarId: string) => void;
  isDeleting?: boolean;
}

export function AvatarCard({ avatar, onDelete, isDeleting = false }: AvatarCardProps) {
  const navigate = useNavigate();

  // Подробная отладка каждого аватара
  console.log(`🎭 AVATAR CARD DEBUG для ${avatar.avatar_id}:`, {
    originalStatus: avatar.status,
    statusType: typeof avatar.status,
    statusString: String(avatar.status),
    statusLowerCase: String(avatar.status).toLowerCase().trim(),
    isCompleted: String(avatar.status).toLowerCase().trim() === 'completed',
    prompt: avatar.prompt.slice(0, 20) + '...'
  });

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить этот аватар?')) {
      onDelete(avatar.avatar_id);
    }
  };

  const handleAnimate = () => {
    navigate('/animations', { 
      state: { 
        selectedAvatarId: avatar.avatar_id,
        selectedAvatar: avatar
      } 
    });
  };

  // Нормализуем статус для проверки - теперь используем lowercase
  const normalizedStatus = avatar.status?.toString().toLowerCase().trim();

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase?.().trim();
    switch (normalizedStatus) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'generating':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    const normalizedStatus = status?.toLowerCase?.().trim();
    switch (normalizedStatus) {
      case 'completed':
        return 'Готов';
      case 'generating':
        return 'Обработка';
      case 'failed':
        return 'Ошибка';
      case 'pending':
        return 'Ожидание';
      default:
        return status;
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="relative aspect-square w-full bg-gray-100">
        <AvatarImage 
          avatar={avatar}
          className="absolute inset-0 w-full h-full object-cover z-0"
          showPlaceholder={true}
        />
      </div>
      <div className="p-6 relative z-20">
        <p className="font-medium text-gray-900 mb-2 line-clamp-2">
          {avatar.prompt}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(avatar.status)}`}>
            {getStatusText(avatar.status)}
          </span>
          <p className="text-xs text-gray-500">
            {new Date(avatar.created_at).toLocaleDateString('ru-RU')}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {normalizedStatus === 'completed' ? (
            <>
              <Button
                onClick={handleAnimate}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm py-2 font-medium"
              >
                🎬 Создать анимацию
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm py-2 px-4"
                disabled={isDeleting}
              >
                {isDeleting ? '...' : '🗑️'}
              </Button>
            </>
          ) : normalizedStatus === 'generating' ? (
            <>
              <div className="flex-1 bg-yellow-100 text-yellow-700 text-sm py-2 px-4 rounded-md text-center">
                ⚙️ Генерируется...
              </div>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm py-2 px-4"
                disabled={isDeleting}
              >
                {isDeleting ? '...' : '🗑️'}
              </Button>
            </>
          ) : normalizedStatus === 'failed' ? (
            <>
              <div className="flex-1 bg-red-100 text-red-700 text-sm py-2 px-4 rounded-md text-center">
                ❌ Ошибка генерации
              </div>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm py-2 px-4"
                disabled={isDeleting}
              >
                {isDeleting ? '...' : '🗑️'}
              </Button>
            </>
          ) : (
            <>
              <div className="flex-1 bg-gray-100 text-gray-600 text-sm py-2 px-4 rounded-md text-center">
                ⏳ В очереди...
              </div>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm py-2 px-4"
                disabled={isDeleting}
              >
                {isDeleting ? '...' : '🗑️'}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
} 