import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, getErrorMessage } from '@/services/api';
import { toastError, toastSuccess } from '@/utils/toast';
import type { CreateAvatarRequest } from '@/types/api';

export function useCreateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAvatarRequest) => {
      console.log('🎨 Creating avatar with prompt:', data.prompt);
      
      const result = await apiClient.createAvatar(data.prompt);
      
      console.log('✅ Avatar created successfully:', {
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
      console.log('🔄 Updating avatar cache after creation...');
      queryClient.invalidateQueries({ queryKey: ['avatars'] });
      
      console.log('📊 Created avatar will have status:', data.status);
      // Check status more flexibly as there can be different values
      const statusStr = String(data.status).toLowerCase();
      if (statusStr === 'pending' || statusStr === 'generating' || statusStr === 'in_progress') {
        console.log('⏳ Avatar is being generated. Image will appear in a few minutes.');
      } else if (statusStr === 'completed') {
        console.log('🎉 Avatar is ready!');
      } else {
        console.log('ℹ️ Avatar status:', statusStr);
      }
    },
    onError: (error) => {
      console.error('Create avatar error in hook:', error);
      // DON'T show toast for moderation errors, they are handled in UI
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
      console.log(`📥 Loading avatars: page ${page}, per page ${perPage}`);
      
      const result = await apiClient.getAvatars(page, perPage);
      
      console.log(`📊 Received avatars: ${result.avatars.length} of ${result.total}`);
      
      if (result.avatars.length === 0) {
        console.log('❌ AVATARS NOT FOUND! Possible reasons:');
        console.log('1. No avatars have been created');
        console.log('2. Backend database issues');
        console.log('3. Authentication problems');
        console.log('💡 Try creating an avatar or check backend logs');
      } else {
        console.log('🎭 Avatar details:');
        result.avatars.forEach((avatar, index) => {
          console.log(`  ${index + 1}. ID: ${avatar.avatar_id}`);
          console.log(`     Status: ${avatar.status}`);
          console.log(`     Prompt: ${avatar.prompt.slice(0, 50)}...`);
          console.log(`     Created: ${avatar.created_at}`);
          console.log(`     Image: ${avatar.image_url || 'NONE'}`);
          console.log(`     ---`);
        });
      }
      
      return result;
    },
    refetchInterval: (query) => {
      // Automatically update data every 5 seconds if there are avatars being generated
      const data = query.state.data;
      const hasGenerating = data?.avatars?.some((avatar: any) => {
        const status = String(avatar.status).toLowerCase();
        return status === 'generating' || status === 'pending' || status === 'in_progress';
      });
      
      if (hasGenerating) {
        console.log('⏳ There are avatars being generated, updating every 5 seconds');
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

// Function to get avatar image URL via API
export function getAvatarImageUrl(avatarId: string): string {
  // Add authorization token as query parameter to bypass CORS
  const token = localStorage.getItem('access_token');
  const baseUrl = `/api/v1/avatars/${avatarId}/image`;
  
  // Return URL with token if available
  return token ? `${baseUrl}?token=${token}` : baseUrl;
}

// Hook to get avatar image blob (more reliable method)
export function useAvatarImage(avatarId: string, enabled = true) {
  return useQuery({
    queryKey: ['avatar-image', avatarId],
    queryFn: async () => {
      console.log('Fetching image for avatar:', avatarId);
      
      // Check token before request
      const token = localStorage.getItem('access_token');
      console.log('Token available:', !!token, token ? 'Token length:' + token.length : 'No token');
      
      try {
        // Get image URL with token
        const imageUrl = apiClient.getAvatarImageUrl(avatarId);
        console.log('Avatar image URL:', imageUrl);
        
        // Load image with authorization token
        const response = await fetch(imageUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log('Image response:', response.status, response.headers.get('content-type'));
        
        // Get blob
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
    staleTime: 60000, // Cache for 1 minute
    retry: 2, // Allow 2 retries for reliability
    retryDelay: 1000, // Delay between attempts
  });
} 