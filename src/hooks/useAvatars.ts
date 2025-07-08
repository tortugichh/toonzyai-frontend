import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, getErrorMessage } from '@/services/api';
import { toastError, toastSuccess } from '@/utils/toast';
import type { CreateAvatarRequest } from '@/types/api';

export function useCreateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAvatarRequest) => {
      console.log('🎨 Создаем аватара с промптом:', data.prompt);
      
      const result = await apiClient.createAvatar(data.prompt);
      
      console.log('✅ Аватар создан успешно:', {
        avatar_id: result.avatar_id,
        status: result.status,
        prompt: result.prompt,
        user_id: result.user_id,
        created_at: result.created_at,
        image_url: result.image_url
      });
      
      return result;
    },
    onSuccess: (data) => {
      console.log('🔄 Обновляем кэш аватаров после создания...');
      queryClient.invalidateQueries({ queryKey: ['avatars'] });
      
      console.log('📊 Созданный аватар будет иметь статус:', data.status);
      // Проверяем статус более гибко, так как могут быть разные значения
      const statusStr = String(data.status).toLowerCase();
      if (statusStr === 'pending' || statusStr === 'generating' || statusStr === 'in_progress') {
        console.log('⏳ Аватар в процессе генерации. Изображение появится через несколько минут.');
      } else if (statusStr === 'completed') {
        console.log('🎉 Аватар готов!');
      } else {
        console.log('ℹ️ Статус аватара:', statusStr);
      }
    },
    onError: (error) => {
      console.error('Create avatar error in hook:', error);
      // НЕ показываем toast для ошибок модерации, они обрабатываются в UI
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
      console.log(`📥 Загружаем аватары: страница ${page}, на странице ${perPage}`);
      
      const result = await apiClient.getAvatars(page, perPage);
      
      console.log(`📊 Получено аватаров: ${result.avatars.length} из ${result.total}`);
      
      if (result.avatars.length === 0) {
        console.log('❌ АВАТАРЫ НЕ НАЙДЕНЫ! Возможные причины:');
        console.log('1. Аватары не создавались');
        console.log('2. Проблемы с базой данных на бэкенде');
        console.log('3. Проблемы с авторизацией');
        console.log('💡 Попробуйте создать аватара или проверить логи бэкенда');
      } else {
        console.log('🎭 Детали аватаров:');
        result.avatars.forEach((avatar, index) => {
          console.log(`  ${index + 1}. ID: ${avatar.avatar_id}`);
          console.log(`     Статус: ${avatar.status}`);
          console.log(`     Промпт: ${avatar.prompt.slice(0, 50)}...`);
          console.log(`     Создан: ${avatar.created_at}`);
          console.log(`     Изображение: ${avatar.image_url || 'НЕТ'}`);
          console.log(`     ---`);
        });
      }
      
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
        console.log('⏳ Есть аватары в процессе генерации, обновляем каждые 5 секунд');
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
      console.error('Delete avatar error in hook:', error);
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