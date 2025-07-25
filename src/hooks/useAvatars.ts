import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, getErrorMessage } from '@/services/api';
import { toastError, toastSuccess } from '@/utils/toast';
import type { CreateAvatarRequest } from '@/types/api';

export function useCreateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAvatarRequest) => {
      const result = await apiClient.createAvatar(data.prompt);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['avatars'] });
    },
    onError: (error) => {
      const errorData = (error as any)?.details || (error as any)?.response?.data?.detail;
      if (errorData?.error !== 'content_policy_violation') {
        toastError(getErrorMessage(error));
      }
    },
  });
}

export function useAvatars(page = 1, perPage = 10) {
  return useQuery({
    queryKey: ['avatars', page, perPage],
    queryFn: async () => {
      const result = await apiClient.getAvatars(page, perPage);
      return result;
    },
    refetchInterval: (query) => {
      // Автоматически обновляем данные каждые 5 секунд, если есть аватары в процессе генерации
      const data = query.state.data;
      const hasGenerating = data?.avatars?.some((avatar: any) => {
        const status = String(avatar.status).toLowerCase();
        return status === 'generating' || status === 'pending' || status === 'in_progress';
      });
      
      if (hasGenerating) {
      }
      
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
      toastError(getErrorMessage(error));
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
      const token = localStorage.getItem('access_token');
      try {
        const imageUrl = apiClient.getAvatarImageUrl(avatarId);
        const response = await fetch(imageUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error('Received empty blob');
        }
        const blobUrl = URL.createObjectURL(blob);
        return blobUrl;
      } catch (error: any) {
        throw error;
      }
    },
    enabled: !!avatarId && enabled,
    staleTime: 60000, // Кэшируем на 1 минуту
    retry: 2, // Разрешаем 2 повтора для надежности
    retryDelay: 1000, // Задержка между попытками
  });
} 