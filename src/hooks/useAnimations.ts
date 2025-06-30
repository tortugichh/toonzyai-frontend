/**
 * useAnimations Hook
 * Полная реализация для работы с ToonzyAI Animation API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  apiClient, 
  getErrorMessage, 
  createPoller,
  type AnimationProject
} from '@/services/api';

// ============ MAIN ANIMATIONS HOOK ============
export const useAnimations = () => {
  const [projects, setProjects] = useState<AnimationProject[]>([]);
  const [currentProject, setCurrentProject] = useState<AnimationProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Polling refs
  const pollersRef = useRef<Map<string, { poll: () => Promise<AnimationProject>; stop: () => void }>>(new Map());

  const clearError = useCallback(() => setError(null), []);

  // ============ PROJECT MANAGEMENT ============
  const createProject = useCallback(async (
    avatarId: string, 
    totalSegments: number, 
    prompt: string
  ): Promise<AnimationProject | null> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Creating animation project:', { avatarId, totalSegments, prompt });
      
      const project = await apiClient.createAnimationProject(avatarId, totalSegments, prompt);
      
      console.log('✅ Project created:', project.id);
      
      // Add to projects list
      setProjects(prev => [project, ...prev]);
      setCurrentProject(project);
      
      // Start polling for segment creation
      startProjectPolling(project.id);
      
      return project;
    } catch (err) {
      const message = getErrorMessage(err);
      console.error('❌ Create project error:', message);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📋 Fetching animation projects...');
      
      const projectsList = await apiClient.getAnimationProjects();
      
      console.log('✅ Projects fetched:', projectsList.length);
      setProjects(projectsList);
    } catch (err) {
      const message = getErrorMessage(err);
      console.error('❌ Fetch projects error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProject = useCallback(async (projectId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📄 Fetching project:', projectId);
      
      const project = await apiClient.getAnimationProject(projectId);
      
      console.log('✅ Project fetched:', {
        id: project.id,
        status: project.status,
        segments: project.segments.length
      });
      
      setCurrentProject(project);
      
      // Update in projects list
      setProjects(prev => 
        prev.map(p => p.id === projectId ? project : p)
      );
      
      // Start polling if needed
      const needsPolling = project.segments.some(s => 
        s.status === 'pending' || s.status === 'in_progress'
      ) || project.status === 'assembling';
      
      if (needsPolling) {
        startProjectPolling(projectId);
      }
    } catch (err) {
      const message = getErrorMessage(err);
      console.error('❌ Fetch project error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Deleting project:', projectId);
      
      await apiClient.deleteAnimationProject(projectId);
      
      // Stop polling
      const poller = pollersRef.current.get(projectId);
      if (poller) {
        poller.stop();
        pollersRef.current.delete(projectId);
      }
      
      // Remove from state
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
      
      console.log('✅ Project deleted successfully');
      return true;
    } catch (err) {
      const message = getErrorMessage(err);
      console.error('❌ Delete project error:', message);
      setError(message);
      return false;
    }
  }, [currentProject]);

  const assembleVideo = useCallback(async (projectId: string): Promise<boolean> => {
    try {
      console.log('🎬 Assembling video for project:', projectId);
      
      const result = await apiClient.assembleVideo(projectId);
      
      console.log('✅ Video assembly started:', result.status);
      
      // Start polling for assembly completion
      startProjectPolling(projectId);
      
      return true;
    } catch (err) {
      const message = getErrorMessage(err);
      console.error('❌ Assemble video error:', message);
      setError(message);
      return false;
    }
  }, []);

  // ============ POLLING SYSTEM ============
  const startProjectPolling = useCallback((projectId: string) => {
    // Stop existing poller
    const existingPoller = pollersRef.current.get(projectId);
    if (existingPoller) {
      existingPoller.stop();
    }

    // Create new poller
    const poller = createPoller(
      () => apiClient.getAnimationProject(projectId),
      (project) => {
        // Continue polling if there are active processes
        const hasActiveSegments = project.segments.some(s => 
          s.status === 'pending' || s.status === 'in_progress'
        );
        const isAssembling = project.status === 'assembling';
        
        return hasActiveSegments || isAssembling;
      },
      5000, // 5 seconds interval
      120   // 10 minutes max
    );

    // Store poller
    pollersRef.current.set(projectId, poller);

    // Start polling with updates
    poller.poll()
      .then((finalProject) => {
        console.log('🏁 Polling completed for project:', projectId, {
          status: finalProject.status,
          segments: finalProject.segments.map(s => ({ 
            num: s.segment_number, 
            status: s.status 
          }))
        });

        setCurrentProject(finalProject);
        setProjects(prev => 
          prev.map(p => p.id === projectId ? finalProject : p)
        );
      })
      .catch((err) => {
        console.error('❌ Polling error for project:', projectId, err);
      })
      .finally(() => {
        pollersRef.current.delete(projectId);
      });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pollersRef.current.forEach(poller => poller.stop());
      pollersRef.current.clear();
    };
  }, []);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    currentProject,
    loading,
    error,
    createProject,
    fetchProjects,
    fetchProject,
    deleteProject,
    assembleVideo,
    clearError,
    setCurrentProject,
  };
};

// ============ LEGACY HOOKS FOR COMPATIBILITY ============
export const useUpdateSegmentPrompt = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePrompt = useCallback(async (
    projectId: string,
    segmentNumber: number,
    prompt: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.updateSegmentPrompt(projectId, segmentNumber, prompt);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updatePrompt, loading, error };
};

export const useGenerateSegment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSegment = useCallback(async (
    projectId: string,
    segmentNumber: number,
    prompt?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.generateSegment(projectId, segmentNumber, prompt);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generateSegment, loading, error };
};

// ============ LEGACY COMPATIBILITY HOOKS ============
export const useCreateAnimation = () => {
  const { createProject } = useAnimations();
  return {
    mutateAsync: async (data: { source_avatar_id: string; animation_prompt: string; total_segments: number }) => {
      return createProject(data.source_avatar_id, data.total_segments, data.animation_prompt);
    },
    isPending: false,
    error: null
  };
};

export const useDeleteAnimation = () => {
  const { deleteProject } = useAnimations();
  return {
    mutateAsync: deleteProject,
    isPending: false
  };
};

export const useAssembleVideo = () => {
  const { assembleVideo } = useAnimations();
  return {
    mutateAsync: assembleVideo,
    isPending: false
  };
};

export const useAnimation = (id: string) => {
  const { currentProject, fetchProject, loading, error } = useAnimations();
  
  useEffect(() => {
    if (id) {
      fetchProject(id);
    }
  }, [id, fetchProject]);
  
  return {
    data: currentProject,
    isLoading: loading,
    error,
    refetch: () => fetchProject(id)
  };
}; 