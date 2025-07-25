import { useState, useEffect } from 'react';
import { StatusIcon } from '../ui/icons';
import { apiClient } from '../../services/api';

interface AvatarImageProps {
  avatar: {
    avatar_id: string;
    image_url?: string;
    status?: string;
  };
  className?: string;
  showPlaceholder?: boolean;
}

const AvatarImage = ({ avatar, className = '', showPlaceholder = true }: AvatarImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем изображение с авторизацией через новый метод API
  useEffect(() => {
    const loadImageWithAuth = async () => {
      if (!avatar.avatar_id) return;
      
      setIsLoading(true);
      setHasError(false);
      
      try {
        
        // Используем новый метод с правильной аутентификацией
        const blob = await apiClient.getAvatarImageBlob(avatar.avatar_id);
        
        if (blob.size === 0) {
          throw new Error('Получен пустой файл');
        }

        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        
      } catch (error: any) {
        setHasError(true);
        
        // Если статус аватара "completed", но изображение не загружается - это проблема
        if (avatar.status === 'completed') {
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadImageWithAuth();

    // Cleanup blob URL при размонтировании или смене аватара
    return () => {
      // Очищаем предыдущий blob URL только если он есть
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [avatar.avatar_id]); // Убираем blobUrl из зависимостей

  // Отдельный useEffect для очистки blob URL при размонтировании
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const imageUrl = blobUrl || avatar.image_url;

  const handleImageLoad = () => {
    setImageLoaded(true);
    setHasError(false);
  };

  const handleImageError = () => {
    setHasError(true);
    setImageLoaded(false);
  };

  // Показываем ошибку только если загрузка завершена и есть ошибка
  if (hasError && !isLoading) {
    if (!showPlaceholder) return null;
    
    return (
      <div className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
                      <div className="mb-2">
              <StatusIcon status="warning" className="w-10 h-10 text-yellow-500" />
            </div>
          <p className="text-gray-500 text-sm">
            {avatar.status === 'completed' ? 'Ошибка загрузки' : 'Генерируется...'}
          </p>
        </div>
      </div>
    );
  }

  // Показываем загрузку пока идет процесс
  if (isLoading || !imageUrl) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">
            {avatar.status === 'completed' ? 'Загрузка...' : 'Генерация...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt="Avatar"
        className={`w-full h-full object-cover rounded-lg ${
          imageLoaded ? 'block' : 'hidden'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ display: imageLoaded ? 'block' : 'none' }}
      />
    </div>
  );
};

export default AvatarImage; 