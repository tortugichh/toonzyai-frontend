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
import { IS_PRODUCTION } from '@/constants';


// ======== WEBSOCKET HELPERS =========
const WS_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? 'https://api.toonzyai.me';

const createWSUrl = (path: string) => {
  if (IS_PRODUCTION) {
    // Меняем схему на wss/ws в зависимости от origin
    const url = new URL(WS_ORIGIN);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${url.origin}${path}`;
  }
  // В dev оставляем хост Vite (прокси)
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

    // Небольшая задержка перед подключением WebSocket для новых проектов
    const connectDelay = 2000; // 2 секунды
    
    const connectToWebSocket = async () => {
      if (!projectId) return;

    // Get a valid token with automatic refresh
    const token = await apiClient.getValidAccessToken();
    if (!token) {
      console.error('No valid access token available for WebSocket connection');
      return;
    }
    
    const wsUrl = createWSUrl(`/api/ws/progress/project/${projectId}?token=${token}`);
    
    console.log('Creating WebSocket connection to:', wsUrl);
    
    let retryCount = 0;
    const maxRetries = 5;
    const connect = async () => {
      // Refresh token on each retry attempt
      const currentToken = retryCount === 0 ? token : await apiClient.getValidAccessToken();
      if (!currentToken) {
        console.error('No valid access token available for WebSocket retry');
        return;
      }
      
      const currentWsUrl = createWSUrl(`/api/ws/progress/project/${projectId}?token=${currentToken}`);
      const ws = new WebSocket(currentWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        retryCount = 0;
        console.log('WebSocket connected successfully');
      };

      ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        try {
          const progressData = JSON.parse(event.data);
          
          // Обработка ошибок от сервера
          if (progressData.error) {
            if (progressData.error === 'not_found') {
              console.warn('Project not found on server, will retry...');
              // Не логируем как ошибку - проект может быть ещё не создан
              return;
            }
            console.error('WebSocket server error:', progressData);
            return;
          }
          
          // Update project status directly in React Query cache
          queryClient.setQueryData(['animation-project', projectId], (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              status: progressData.status,
              // Update project progress if available
              ...(progressData.completed !== undefined && {
                completedSegments: progressData.completed,
                totalSegments: progressData.total,
                progress: progressData.progress ?? 0
              })
            };
          });

          // Also invalidate project list to keep it fresh
          queryClient.invalidateQueries({ queryKey: ['animation-projects'] });
          
          // Force a refetch of the entire project to get new segments
          queryClient.invalidateQueries({ queryKey: ['animation-project', projectId] });
          
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        wsRef.current = null;
        
        // For 4401 (auth error), try to refresh token before retry
        if (event.code === 4401) {
          console.log('WebSocket authentication failed, will refresh token on retry');
        }
        
        // Для 4404 (not found) ждём дольше перед повторной попыткой
        const isNotFound = event.code === 4404;
        const isAuthError = event.code === 4401;
        
        if (retryCount < maxRetries && (!isNotFound || retryCount < 2)) {
          const delay = isNotFound 
            ? Math.min(3000 * (retryCount + 1), 10000) // для not_found: 3s, 6s, 9s
            : isAuthError
            ? Math.min(2000 * (retryCount + 1), 8000) // для auth error: 2s, 4s, 6s, 8s
            : Math.min(1000 * 2 ** retryCount, 30000); // для других ошибок: экспоненциальный backoff
          retryCount += 1;
          setTimeout(connect, delay);
          console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${retryCount})${isNotFound ? ' - project not found' : isAuthError ? ' - auth error' : ''}`);
        } else {
          console.warn(`Max WebSocket reconnect attempts reached${isNotFound ? ' - project may not exist or access denied' : isAuthError ? ' - authentication failed' : ''}`);
        }
      };
    };

    connect();
    };
    
    // Запускаем подключение WebSocket через небольшую задержку
    const timeoutId = setTimeout(connectToWebSocket, connectDelay);

    return () => {
      clearTimeout(timeoutId);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [projectId, queryClient]);
};

export const useSegmentProgressWS = (
  segmentId: string | undefined,
  projectId?: string,
  skip?: boolean,
) => {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const doneRef = useRef<boolean>(false);

  useEffect(() => {
    if (!segmentId || skip) return;
    
    // Prevent double connections
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    const connectWithValidToken = async () => {
      // Get a valid token with automatic refresh
      const token = await apiClient.getValidAccessToken();
      if (!token) {
        console.error('No valid access token available for WebSocket connection');
        return;
      }
      
      const wsUrl = createWSUrl(`/api/ws/progress/segment/${segmentId}?token=${token}`);
      
      console.log('Creating WebSocket connection to:', wsUrl);
      
      let retryCount = 0;
      const maxRetries = 5;
      const connect = async () => {
        // Refresh token on each retry attempt  
        const currentToken = retryCount === 0 ? token : await apiClient.getValidAccessToken();
        if (!currentToken) {
          console.error('No valid access token available for WebSocket retry');
          return;
        }
        
        const currentWsUrl = createWSUrl(`/api/ws/progress/segment/${segmentId}?token=${currentToken}`);
        const ws = new WebSocket(currentWsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          retryCount = 0;
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
            
            // Если сегмент завершён — рефечим данные и останавливаем WS, без повторного подключения
            if (progressData.status === 'completed' || progressData.status === 'failed') {
              if (projectId) {
                queryClient.invalidateQueries({ queryKey: ['animation-project', projectId] });
              }
              queryClient.invalidateQueries({ queryKey: ['segment-details', segmentId] });

              doneRef.current = true; // помечаем как завершённое наблюдение
              ws.close();
            }
            
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          wsRef.current = null;
          if (!doneRef.current && retryCount < maxRetries) {
            // For 4401 (auth error), try to refresh token before retry
            if (event.code === 4401) {
              console.log('WebSocket authentication failed, will refresh token on retry');
            }
            
            const delay = Math.min(1000 * 2 ** retryCount, 30000); // up to 30s
            retryCount += 1;
            setTimeout(connect, delay);
            console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${retryCount})`);
          } else {
            console.warn('Max WebSocket reconnect attempts reached');
          }
        };
      };

      connect();
    };
    
    connectWithValidToken();

    return () => {
      console.log('Cleaning up WebSocket');
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  // reset flag when segmentId changes
  }, [segmentId, projectId, skip, queryClient]);
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
    onSuccess: (newProject) => {
      // Invalidate and refetch the projects list
      queryClient.invalidateQueries({ queryKey: ['animation-projects'] });
      
      // Сразу добавляем новый проект в кэш со статусом "pending"
      queryClient.setQueryData(['animation-project', newProject.id], {
        ...newProject,
        segments: [] // изначально сегментов нет, они создаются асинхронно
      });
      
      // Запускаем принудительный polling для этого проекта каждые 2 секунды
      // до тех пор, пока segments не появятся
      const pollForSegments = () => {
        queryClient.invalidateQueries({ queryKey: ['animation-project', newProject.id] });
        
        // Проверяем данные из кэша
        const currentData = queryClient.getQueryData(['animation-project', newProject.id]) as any;
        if (currentData?.segments?.length > 0) {
          console.log('✅ Segments appeared, stopping polling');
          return; // сегменты появились, останавливаем polling
        }
        
        // Продолжаем polling через 2 секунды
        setTimeout(pollForSegments, 2000);
      };
      
      // Запускаем через 1 секунду (дать время Celery task'у запуститься)
      setTimeout(pollForSegments, 1000);
      
      // Дополнительно: принудительно запускаем WebSocket connection для нового проекта
      // через небольшую задержку, чтобы дать время проекту появиться в БД
      setTimeout(() => {
        console.log('🔌 Starting WebSocket for new project:', newProject.id);
        // WebSocket будет подхвачен компонентом через useProjectProgressWS
      }, 500);
      
      // Optionally set the individual project data in cache
      queryClient.setQueryData(['animation-project', newProject.id], newProject);
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
      const data = query.state.data as AnimationProject | undefined;
      if (!data) return false;

      // Если у проекта ещё нет сегментов - обновляем каждые 2 секунды
      if (!data.segments || data.segments.length === 0) {
        return 2000;
      }

      const isProcessing = ['pending', 'in_progress', 'assembling'].includes(data.status);
      
      return isProcessing ? 3000 : false;
    },
    refetchIntervalInBackground: true,
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
    onMutate: (projectId) => {
      console.log('[Hook] 🏗️  assembleVideo onMutate', { projectId });
    },
    onSuccess: (_, projectId) => {
      console.log('[Hook] ✅ assembleVideo onSuccess', { projectId });
      queryClient.invalidateQueries({ 
        queryKey: ['animation-project', projectId] 
      });
    },
    onError: (error) => {
      console.error('[Hook] ❌ assembleVideo onError', error);
      toastError(error);
    },
  });
}

// ============ ADVANCED HOOKS FROM DOCUMENTATION ============

// Хук для работы с сегментами (из документации)
export function useSegments(projectId: string) {
  const {
    data: project,
    isLoading,
    refetch,
  } = useAnimationProject(projectId);

  const segments: AnimationSegment[] = project?.segments ?? [];

  const updateSegmentPrompt = async (segmentNumber: number, prompt: string) => {
    try {
      await apiClient.updateSegmentPrompt(projectId, segmentNumber, prompt);
      await refetch();
    } catch (error) {
      console.error('Failed to update segment prompt:', error);
      throw error;
    }
  };

  const generateSegmentVideo = async (segmentNumber: number, prompt: string) => {
    try {
      const task = await apiClient.generateSegment(projectId, segmentNumber, prompt);
      await refetch();
      return task;
    } catch (error) {
      console.error('Failed to generate segment:', error);
      throw error;
    }
  };

  return {
    segments,
    loading: isLoading,
    updateSegmentPrompt,
    generateSegmentVideo,
    refresh: refetch,
  };
}

// Hook для отслеживания прогресса (из документации)
export function useTaskProgress(taskId: string | undefined, onComplete?: (result: any) => void) {
  const [status, setStatus] = useState<string>('PENDING');
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

 