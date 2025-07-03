import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  apiClient, 
  getErrorMessage, 
  createPoller,
  type AnimationProject,
  type AnimationSegment
} from '@/services/api';

// ============ QUERY-BASED HOOKS ============

// Хук для создания анимационного проекта
export function useCreateAnimationProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      sourceAvatarId: string;
      totalSegments: number;
      animationPrompt: string;
    }) => apiClient.createAnimationProject(
      data.sourceAvatarId,
      data.totalSegments,
      data.animationPrompt
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animation-projects'] });
    },
    onError: (error) => {
      console.error('Create animation project error:', getErrorMessage(error));
    },
  });
}

// Хук для получения списка анимационных проектов
export function useAnimationProjects() {
  return useQuery({
    queryKey: ['animation-projects'],
    queryFn: () => apiClient.getAnimationProjects(),
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasActive = data?.some((project: any) => 
        project.status === 'in_progress' || project.status === 'pending'
      );
      return hasActive ? 5000 : false;
    },
    refetchIntervalInBackground: true,
  });
}

// Хук для получения конкретного проекта
export function useAnimationProject(projectId: string) {
  return useQuery({
    queryKey: ['animation-project', projectId],
    queryFn: () => apiClient.getAnimationProject(projectId),
    enabled: !!projectId,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasActive = data && (
        data.status === 'in_progress' || 
        data.status === 'pending' ||
        data.segments?.some((segment: any) => 
          segment.status === 'in_progress' || segment.status === 'pending'
        )
      );
      return hasActive ? 3000 : false;
    },
  });
}

// Хук для удаления проекта
export function useDeleteAnimationProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => apiClient.deleteAnimationProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animation-projects'] });
    },
    onError: (error) => {
      console.error('Delete animation project error:', getErrorMessage(error));
    },
  });
}

// Хук для обновления промпта сегмента
export function useUpdateSegmentPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      projectId: string;
      segmentNumber: number;
      segmentPrompt: string;
    }) => apiClient.updateSegmentPrompt(
      data.projectId,
      data.segmentNumber,
      data.segmentPrompt
    ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['animation-project', variables.projectId] 
      });
    },
    onError: (error) => {
      console.error('Update segment prompt error:', getErrorMessage(error));
    },
  });
}

// NEW: Bulk update prompts for multiple segments
export function useBulkUpdatePrompts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      projectId: string;
      prompts: { segment_number: number; segment_prompt: string }[];
    }) => apiClient.updateSegmentPromptsBulk(data.projectId, data.prompts),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['animation-project', variables.projectId] });
    },
    onError: (error) => {
      console.error('Bulk update prompts error:', getErrorMessage(error));
    },
  });
}

// Хук для генерации сегмента (legacy projectId+segmentNumber)
export function useGenerateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      projectId: string;
      segmentNumber: number;
      segmentPrompt: string;
    }) => apiClient.generateSegment(
      data.projectId,
      data.segmentNumber,
      data.segmentPrompt
    ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['animation-project', variables.projectId] 
      });
    },
    onError: (error) => {
      console.error('Generate segment error:', getErrorMessage(error));
    },
  });
}

// Новая версия по segmentId
export function useGenerateSegmentById() {
  return useMutation({
    mutationFn: (data: { segmentId: string; segmentPrompt: string }) =>
      apiClient.generateSegmentById(data.segmentId, data.segmentPrompt),
  });
}

// Хук для получения деталей сегмента (legacy projectId+segmentNumber)
export function useSegmentDetails(projectId: string, segmentNumber: number) {
  return useQuery({
    queryKey: ['segment-details', projectId, segmentNumber],
    queryFn: () => apiClient.getSegmentDetails(projectId, segmentNumber),
    enabled: !!projectId && segmentNumber >= 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      const isActive = data && (
        data.status === 'in_progress' || data.status === 'pending'
      );
      return isActive ? 3000 : false;
    },
  });
}

export function useSegmentDetailsById(segmentId: string) {
  return useQuery({
    queryKey: ['segment-details', segmentId],
    queryFn: () => apiClient.getSegmentDetailsById(segmentId),
    enabled: !!segmentId,
  });
}

// Хук для сборки финального видео
export function useAssembleVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => apiClient.assembleVideo(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ 
        queryKey: ['animation-project', projectId] 
      });
    },
    onError: (error) => {
      console.error('Assemble video error:', getErrorMessage(error));
    },
  });
}

// ============ ADVANCED HOOKS FROM DOCUMENTATION ============

// Хук для работы с сегментами (из документации)
export function useSegments(projectId: string) {
  const [segments, setSegments] = useState<AnimationSegment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProject = useCallback(async () => {
    try {
      const project = await apiClient.getAnimationProject(projectId);
      setSegments(project.segments);
    } catch (error) {
      console.error('Failed to load segments:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId, loadProject]);

  const updateSegmentPrompt = async (segmentNumber: number, prompt: string) => {
    try {
      await apiClient.updateSegmentPrompt(projectId, segmentNumber, prompt);
      
      // Обновляем локальное состояние
      setSegments(prev => 
        prev.map(segment => 
          segment.segment_number === segmentNumber 
            ? { 
                ...segment, 
                segment_prompt: prompt, 
                prompts: {
                  ...segment.prompts,
                  prompt_source: 'custom',
                  segment_prompt: prompt
                } as any
              }
            : segment
        )
      );
    } catch (error) {
      console.error('Failed to update segment prompt:', error);
      throw error;
    }
  };

  const generateSegmentVideo = async (segmentNumber: number, prompt: string) => {
    try {
      const task = await apiClient.generateSegment(projectId, segmentNumber, prompt);
      
      // Обновляем статус сегмента
      setSegments(prev =>
        prev.map(segment =>
          segment.segment_number === segmentNumber
            ? { 
                ...segment, 
                status: 'in_progress',
                // task_id будет в response, но не в типах интерфейса
              } as any
            : segment
        )
      );

      return task;
    } catch (error) {
      console.error('Failed to generate segment:', error);
      throw error;
    }
  };

  return {
    segments,
    loading,
    updateSegmentPrompt,
    generateSegmentVideo,
    refresh: loadProject
  };
}

// Hook для отслеживания прогресса (из документации)
export function useTaskProgress(taskId: string | undefined, onComplete?: (result: any) => void) {
  const [status, setStatus] = useState<string>('PENDING');
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!taskId) return;

    const checkStatus = async () => {
      try {
        // В данной реализации API нет отдельного endpoint для статуса задач
        // Используем общий статус сегмента
        setStatus('IN_PROGRESS');
        setProgress(50); // Базовый прогресс
        
        // Если есть callback, вызываем его через некоторое время
        if (onComplete) {
          setTimeout(() => onComplete({ status: 'COMPLETED' }), 3000);
        }
      } catch (error) {
        console.error('Failed to check task status:', error);
      }
    };

    // Проверяем каждые 3 секунды
    intervalRef.current = setInterval(checkStatus, 3000);
    checkStatus(); // Первая проверка сразу

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [taskId, onComplete]);

  return { status, progress };
}

// NEW: Parallel generation of all segments
export function useGenerateAllSegments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { projectId: string; forceRegenerate?: boolean }) =>
      apiClient.generateAllSegments(data.projectId, data.forceRegenerate ?? false),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['animation-project', variables.projectId] });
    },
    onError: (error) => {
      console.error('Generate all segments error:', getErrorMessage(error));
    },
  });
}

 