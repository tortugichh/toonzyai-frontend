import type {
  StoryCreateResponse,
  StoryStatusResponse,
} from './api';
import { APIError } from './api';

const API_BASE = '/api/v1';

// This is a placeholder for the actual request function from the APIClient instance.
// In a real scenario, you would pass the client's request method to these functions
// or instantiate the client here. For now, we assume a global request function
// for simplicity in this isolated file.
// A proper implementation would involve refactoring api.ts to allow for this.

// Переименовываю функцию request в requestFn
const requestFn = async function<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token');
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  if (options.body) {
    headers.append('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw await APIError.fromResponse(response);
  }
  // For 204 No Content
  if (response.status === 204) {
    return {} as T;
  }
  return response.json();
};


export interface StoryCreateRequest {
  prompt?: string;
  genre?: string;
  style?: string;
  theme?: string;
  book_style?: string;
  characters?: Array<{
    name: string;
    description?: string;
    role?: string;
  }>;
  wishes?: string;
}

export async function createStory(request: StoryCreateRequest): Promise<StoryCreateResponse> {
  return requestFn<StoryCreateResponse>('/stories/', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getStoryStatus(taskId: string): Promise<StoryStatusResponse> {
  return requestFn<StoryStatusResponse>(`/stories/${taskId}`);
}

export interface CreateAnimationProjectPayload {
  name: string;
  source_avatar_id: string;
  total_segments: number;
  animation_prompt?: string | null;
}

export interface AnimationProject {
  id: string;
  total_segments: number;
  status: string;
  final_video_url: string | null;
}

export interface AnimationSegment {
  segment_number: number;
  status: string;
  generated_video_url?: string | null;
  video_url?: string | null;
}

export async function createAnimationProject(payload: CreateAnimationProjectPayload): Promise<AnimationProject> {
  return requestFn<AnimationProject>('/animations/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function generateSegment(projectId: string, segmentNumber: number, segmentPrompt: string) {
  return requestFn(`/animations/${projectId}/segments/${segmentNumber}/generate`, {
    method: 'POST',
    body: JSON.stringify({ segment_prompt: segmentPrompt }),
  });
}

export async function getSegmentDetails(projectId: string, segmentNumber: number): Promise<AnimationSegment> {
  return requestFn<AnimationSegment>(`/animations/${projectId}/segments/${segmentNumber}`);
}

export async function getAnimationProject(projectId: string): Promise<AnimationProject> {
  return requestFn<AnimationProject>(`/animations/${projectId}`);
}

export async function assembleVideo(projectId: string) {
  return requestFn(`/animations/${projectId}/assemble`, { method: 'POST' });
} 