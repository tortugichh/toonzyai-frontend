import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import { toastError, toastSuccess } from '@/utils/toast';
import type { LoginRequest, RegisterRequest } from '@/types/api';
import { secureLogger, sanitizeApiError } from '@/utils/secureLogging';

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
      // After successful registration, user should log in
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
      secureLogger.log('[LOGOUT] Starting logout process...');
      
      // First call API logout, then clear local storage
      try {
        secureLogger.log('[LOGOUT] Calling API logout...');
        await apiClient.logout();
        secureLogger.log('[LOGOUT] API logout successful');
      } catch (error) {
        secureLogger.error('[LOGOUT] API logout failed:', sanitizeApiError(error));
        // Continue logout even if API is unavailable
      }
      
      // Clear data
      secureLogger.log('[LOGOUT] Clearing local storage and cache...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        queryClient.clear();
    },
    onSuccess: () => {
      secureLogger.log('[LOGOUT] Logout mutation completed successfully');
      toastSuccess('You have successfully logged out');
      
        // Redirect to login page
      secureLogger.log('[LOGOUT] Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 500); // Small delay to show toast
    },
    onError: (error) => {
      secureLogger.error('[LOGOUT] Logout mutation failed:', sanitizeApiError(error));
      // Still clear data and redirect
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      queryClient.clear();
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    },
  });
}

// Utility function for simple logout without hooks
export function simpleLogout() {
  secureLogger.log('[SIMPLE_LOGOUT] Performing simple logout...');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login';
}

// New hook for token verification
export function useVerifyToken() {
  return useQuery({
    queryKey: ['token-verification'],
    queryFn: () => apiClient.verifyToken(),
    enabled: !!localStorage.getItem('access_token'),
    retry: false,
    // Check token every 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}

// Hook for OAuth2 login (for Swagger UI compatibility)
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