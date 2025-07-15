import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { toastError, toastSuccess } from '@/utils/toast';
import type { LoginRequest, RegisterRequest } from '@/types/api';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => apiClient.login(data.username, data.password),
    onSuccess: (response) => {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => toastError(error),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => apiClient.register(data.username, data.email, data.password),
    onSuccess: () => {
      // После успешной регистрации пользователь должен войти в систему
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => toastError(error),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => apiClient.getCurrentUser(),
    enabled: !!localStorage.getItem('access_token'),
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<{ username: string; email: string; password?: string }>) => 
      apiClient.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => toastError(error),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => 
      apiClient.changePassword(currentPassword, newPassword),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('[LOGOUT] Starting logout process...');
      
      // Сначала вызываем API logout, затем очищаем локальное хранилище
      try {
        console.log('[LOGOUT] Calling API logout...');
        await apiClient.logout();
        console.log('[LOGOUT] API logout successful');
      } catch (error) {
        console.error('[LOGOUT] API logout failed:', error);
        // Продолжаем выход даже если API недоступен
      }
      
      // Очищаем данные
      console.log('[LOGOUT] Clearing local storage and cache...');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      queryClient.clear();
    },
    onSuccess: () => {
      console.log('[LOGOUT] Logout mutation completed successfully');
      toastSuccess('Вы успешно вышли из системы');
      
      // Перенаправляем на страницу логина
      console.log('[LOGOUT] Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 500); // Небольшая задержка для показа toast
    },
    onError: (error) => {
      console.error('[LOGOUT] Logout mutation failed:', error);
      // Всё равно очищаем данные и перенаправляем
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      queryClient.clear();
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    },
  });
}

// Утилитарная функция для простого выхода без хуков
export function simpleLogout() {
  console.log('[SIMPLE_LOGOUT] Performing simple logout...');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login';
}

// Новый хук для проверки токена
export function useVerifyToken() {
  return useQuery({
    queryKey: ['token-verification'],
    queryFn: () => apiClient.verifyToken(),
    enabled: !!localStorage.getItem('access_token'),
    retry: false,
    // Проверяем токен каждые 5 минут
    refetchInterval: 5 * 60 * 1000,
  });
}

// Хук для OAuth2 логина (для совместимости со Swagger UI)
export function useTokenLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => 
      apiClient.login(username, password), // Using the same login method
    onSuccess: (response) => {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => toastError(error),
  });
} 