import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, getErrorMessage } from '@/services/api';
import type { CreateAvatarRequest } from '@/types/api';

export function useCreateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAvatarRequest) => apiClient.createAvatar(data.prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatars'] });
    },
    onError: (error) => {
      console.error('Create avatar error:', getErrorMessage(error));
    },
  });
}

export function useAvatars(page = 1, perPage = 10) {
  return useQuery({
    queryKey: ['avatars', page, perPage],
    queryFn: () => apiClient.getAvatars(page, perPage),
    refetchInterval: (query) => {
      // Автоматически обновляем данные каждые 5 секунд, если есть аватары в процессе генерации
      const data = query.state.data;
      // Обновлены статусы согласно новой документации
      const hasGenerating = data?.avatars?.some((avatar: any) => 
        avatar.status === 'generating' || avatar.status === 'pending'
      );
      return hasGenerating ? 5000 : false;
    },
    refetchIntervalInBackground: true,
  });
}

export function useAvatar(avatarId: string) {
  return useQuery({
    queryKey: ['avatar', avatarId],
    queryFn: () => apiClient.getAvatar(avatarId),
    enabled: !!avatarId,
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (avatarId: string) => apiClient.deleteAvatar(avatarId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatars'] });
    },
    onError: (error) => {
      console.error('Delete avatar error:', getErrorMessage(error));
    },
  });
}

// Функция для получения URL изображения аватара через API
export function getAvatarImageUrl(avatarId: string): string {
  // Добавляем токен авторизации как query parameter для обхода CORS
  const token = localStorage.getItem('access_token');
  const baseUrl = `/api/v1/avatars/${avatarId}/image`;
  
  // Возвращаем URL с токеном, если он есть
  return token ? `${baseUrl}?token=${token}` : baseUrl;
}

// Хук для получения blob изображения аватара (более надежный способ)
export function useAvatarImage(avatarId: string, enabled = true) {
  return useQuery({
    queryKey: ['avatar-image', avatarId],
    queryFn: async () => {
      console.log('Fetching image for avatar:', avatarId);
      
      // Проверяем токен перед запросом
      const token = localStorage.getItem('access_token');
      console.log('Token available:', !!token, token ? 'Token length:' + token.length : 'No token');
      
      try {
        // Получаем URL изображения с токеном
        const imageUrl = apiClient.getAvatarImageUrl(avatarId);
        console.log('Avatar image URL:', imageUrl);
        
        // Загружаем изображение с токеном авторизации
        const response = await fetch(imageUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log('Image response:', response.status, response.headers.get('content-type'));
        
        // Получаем blob
        const blob = await response.blob();
        console.log('Blob size:', blob.size, 'type:', blob.type);
        
        if (blob.size === 0) {
          throw new Error('Received empty blob');
        }
        
        const blobUrl = URL.createObjectURL(blob);
        console.log('Created blob URL:', blobUrl);
        
        return blobUrl;
      } catch (error: any) {
        console.error('Error fetching avatar image:', error);
        console.error('Detailed error:', getErrorMessage(error));
        throw error;
      }
    },
    enabled: !!avatarId && enabled,
    staleTime: 60000, // Кэшируем на 1 минуту
    retry: 2, // Разрешаем 2 повтора для надежности
    retryDelay: 1000, // Задержка между попытками
  });
} 