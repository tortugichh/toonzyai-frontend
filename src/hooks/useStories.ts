import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

export interface StoryItem {
  id: string;
  title: string;
  theme?: string;
  genre?: string;
  style?: string;
  status: string;
  preview_text?: string;
  created_at: string;
  task_id: string;
}

export interface StoryListResponse {
  stories: StoryItem[];
}

// Get list of user stories
export const useStories = () => {
  return useQuery<StoryListResponse>({
    queryKey: ['stories'],
    queryFn: async () => {
      // Use apiClient instead of direct fetch for proper error handling and token management
      return await apiClient.getStories();
    },
  });
};

// Get individual story by task ID (for checking completion status)
export const useStory = (taskId: string) => {
  return useQuery({
    queryKey: ['story', taskId],
    queryFn: async () => {
      // Use apiClient instead of direct fetch for proper error handling and token management
      return await apiClient.getStoryStatus(taskId);
    },
    enabled: !!taskId,
    refetchInterval: (data) => {
      // Stop polling if completed or failed
      const query = data as any;
      if (query?.state?.data?.status === 'SUCCESS' || query?.state?.data?.status === 'FAILURE') {
        return false;
      }
      return 3000; // Poll every 3 seconds if still in progress
    },
  });
}; 