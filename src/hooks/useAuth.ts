import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
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
      // Сначала вызываем API logout, затем очищаем локальное хранилище
      try {
        await apiClient.logout();
      } finally {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        queryClient.clear();
      }
    },
  });
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
  });
} 