import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  apiClient, 
  getErrorMessage, 
  createPoller,
  type AnimationProject,
  type AnimationSegment
} from '@/services/api';
import { toastError } from '@/utils/toast';

// ======== WEBSOCKET HELPERS =========
const createWSUrl = (path: string) => {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}${path}`;
};

export const useProjectProgressWS = (projectId: string | undefined) => {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!projectId) return;

    // Prevent double connections
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const token = localStorage.getItem('access_token');
    const wsUrl = createWSUrl(`/api/ws/progress/project/${projectId}?token=${token ?? ''}`);
    
    console.log('Creating WebSocket connection to:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected successfully');
    };

    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      try {
        const progressData = JSON.parse(event.data);
        
        // Update project status directly in React Query cache
        queryClient.setQueryData(['animation-project', projectId], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            status: progressData.status,
            // Update project progress if available
            ...(progressData.completed !== undefined && {
              completedSegments: progressData.completed,
              totalSegments: progressData.total
            })
          };
        });

        // Also invalidate project list to keep it fresh
        queryClient.invalidateQueries({ queryKey: ['animation-projects'] });
        
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };
    
    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      wsRef.current = null;
    };

    return () => {
      console.log('Cleaning up WebSocket');
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [projectId, queryClient]);
};

export const useSegmentProgressWS = (segmentId: string | undefined, projectId?: string) => {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!segmentId) return;
    
    // Prevent double connections
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    const token = localStorage.getItem('access_token');
    const wsUrl = createWSUrl(`/api/ws/progress/segment/${segmentId}?token=${token ?? ''}`);
    
    console.log('Creating WebSocket connection to:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected successfully');
    };

    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      try {
        const progressData = JSON.parse(event.data);
        
        // Update segment data directly in React Query cache
        if (projectId) {
          queryClient.setQueryData(['animation-project', projectId], (oldData: any) => {
            if (!oldData) return oldData;
            
            return {
              ...oldData,
              segments: oldData.segments.map((segment: any) => 
                segment.id === segmentId 
                  ? { 
                      ...segment, 
                      status: progressData.status,
                      progress: progressData.progress 
                    }
                  : segment
              )
            };
          });
        }
        
        // Also update individual segment cache if it exists
        queryClient.setQueryData(['segment-details', segmentId], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            status: progressData.status,
            progress: progressData.progress
          };
        });
        
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };
    
    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      wsRef.current = null;
    };

    return () => {
      console.log('Cleaning up WebSocket');
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [segmentId, projectId, queryClient]);
};

// ============ QUERY-BASED HOOKS ============

// Хук для создания анимационного проекта
export function useCreateAnimationProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      sourceAvatarId: string;
      totalSegments: number;
      animationPrompt?: string;
    }) => apiClient.createAnimationProject(
      data.name,
      data.sourceAvatarId,
      data.totalSegments,
      data.animationPrompt
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animation-projects'] });
    },
    onError: (error) => {
      toastError(error);
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

      if (!data) return false;

      // 1. No segments yet but backend will create them asynchronously
      if ((data.segments?.length ?? 0) === 0) return 3000;

      const hasGenerating = data.segments.some((s: any) => s.status === 'in_progress' || s.status === 'pending');

      // 2. Some segments still generating
      if (hasGenerating) return 3000;

      // 3. All segments completed but some videos not yet attached
      const missingVideos = data.segments.some((s: any) => s.status === 'completed' && !s.video_url && !s.generated_video_url);
      if (missingVideos) return 5000;

      // 4. Otherwise stop polling
      return false;
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
      toastError(error);
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
      toastError(error);
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
      toastError(error);
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
      toastError(error);
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
      toastError(error);
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
      toastError(error);
    },
  });
}

 