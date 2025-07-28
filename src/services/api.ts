/**
 * ToonzyAI API Client
 * Полная реализация согласно BACKEND_API_DOCUMENTATION.md
 */

import { API_BASE_URL } from '@/constants';
import { secureLogger, sanitizeApiError } from '@/utils/secureLogging';

// Базовый путь API – полноценный URL в продакшене, либо прокси-путь в dev
export const API_BASE = API_BASE_URL || '/api/v1';

// Для медиа-ресурсов также используем тот же origin
const MEDIA_API_BASE = API_BASE_URL || '/api/v1';

// ============ TYPES ============
export interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface Avatar {
  avatar_id: string;
  image_url: string;
  prompt: string;
  status: 'completed';
  user_id: string;
  created_at: string;
  moderation_flags?: string[] | null;
}

export interface AvatarListResponse {
  avatars: Avatar[];
  total: number;
  page: number;
  per_page: number;
}

export type AnimationStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'assembling';

export interface AnimationSegment {
  id: string;
  segment_number: number;
  status: AnimationStatus;
  segment_prompt: string | null;
  start_frame_url: string;
  generated_video_url: string | null;
  video_url: string | null;
  created_at: string;
  updated_at: string;
  progress?: number;
  // Новые поля из расширенного API
  status_description?: string;
  prompts?: {
    active_prompt: string;
    prompt_source: 'custom' | 'project';
    segment_prompt: string | null;
    project_prompt: string;
  };
  generation?: {
    generator: string;
    duration: string;
    quality: string;
    estimated_time: string;
  };
  urls?: {
    start_frame_url: string;
    generated_video_url: string | null;
    video_endpoint: string;
    download_endpoint: string;
  };
  actions?: {
    can_regenerate: boolean;
    can_update_prompt: boolean;
    generate_endpoint: string;
    prompt_endpoint: string;
  };
  timestamps?: {
    created_at: string;
    updated_at: string;
  };
  user_control?: {
    enabled: boolean;
    description: string;
  };
}

// Interfaces for Story Generation
export interface StoryCreateRequest {
  prompt: string;
}

export interface StoryCreateResponse {
  task_id: string;
}

export interface StoryListResponse {
  stories: Array<{
    id: string;
    title: string;
    theme?: string;
    genre?: string;
    style?: string;
    status: string;
    preview_text?: string;
    created_at: string;
    task_id: string;
  }>;
}

export interface StoryScene {
  id: number;
  description: string;
}

export interface StoryStyle {
  summary: string;
  positive_keywords: string;
  negative_keywords: string;
}

export interface StoryCharacter {
  name: string;
  description: string;
  attire: string;
}

export interface StoryEnvironment {
  scene_id: number;
  environment_description: string;
}

export interface StoryIllustration {
  scene_id: number;
  image_prompt: string;
  image_url: string | null;
}

export interface StoryResult {
  title: string;
  scenes: StoryScene[];
  style: { style: StoryStyle };
  characters: { characters: StoryCharacter[] };
  environments: { environments: StoryEnvironment[] };
  illustrations: { illustrations: StoryIllustration[] };
}

export type StoryStatusResponse =
  | {
      task_id: string;
      status: 'PENDING' | 'RETRY' | 'FAILURE';
      error: string | null;
    }
  | ({
      task_id: string;
      status: 'SUCCESS';
      error: null;
    } & StoryResult);

export interface AnimationProject {
  id: string;
  user_id: string;
  source_avatar_id: string;
  name: string; // Название проекта
  total_segments: number;
  animation_prompt: string | null; // Теперь опциональный
  status: AnimationStatus;
  final_video_url: string | null;
  video_url: string | null;
  source_avatar_url: string | null; // URL аватара для отображения
  created_at: string;
  updated_at: string;
  segments: AnimationSegment[];
  animation_type: 'sequential' | 'independent'; // <--- добавлено!
}

export interface GenerateSegmentResponse {
  message: string;
  project_id: string;
  segment_number: number;
  task_id: string;
  status: AnimationStatus;
  prompt_used: string;
  estimated_time: string;
  current_time: string;
  monitoring: {
    status_endpoint: string;
    video_endpoint: string;
    poll_interval_seconds: number;
  };
  details: {
    generator: string;
    duration: string;
    quality: string;
    user_control: boolean;
  };
}

export interface ErrorResponse {
  detail: string;
  error_code?: string;
  field_errors?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}

// ============ API ERROR CLASS ============
export class APIError extends Error {
  status: number;
  statusText: string;
  details: ErrorResponse | string;

  constructor(
    status: number,
    statusText: string,
    details: ErrorResponse | string,
    message?: string
  ) {
    super(message || (typeof details === 'string' ? details : details.detail));
    this.name = 'APIError';
    this.status = status;
    this.statusText = statusText;
    this.details = details;
  }

  static async fromResponse(response: Response): Promise<APIError> {
    let details: ErrorResponse | string;
    try {
      details = await response.json();
    } catch (err) {
      details = await response.text() || response.statusText;
    }
    return new APIError(response.status, response.statusText, details);
  }
}

// ============ TOKEN MANAGER ============
class TokenManager {
  private static instance: TokenManager;
  private isRefreshing = false;
  private failedQueue: Array<(token: string | null) => void> = [];

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.failedQueue.push(resolve);
      });
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearTokens();
      return null;
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const tokens: LoginResponse = await response.json();
        this.setTokens(tokens.access_token, tokens.refresh_token);
        
        // Resolve all queued requests
        this.failedQueue.forEach(resolve => resolve(tokens.access_token));
        this.failedQueue = [];
        
        return tokens.access_token;
      } else {
        throw new Error('Refresh failed');
      }
    } catch (error) {
      secureLogger.error('Token refresh failed:', sanitizeApiError(error));
      this.clearTokens();
      this.failedQueue.forEach(resolve => resolve(null));
      this.failedQueue = [];
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    let token = this.getAccessToken();
    
    if (!token) {
      return null;
    }

    // Try to use the current token first
    try {
      // Quick validation: check if token is expired by trying a simple API call
      const response = await fetch(`${API_BASE}/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return token; // Token is valid
      }

      if (response.status === 401) {
        // Token is expired, try to refresh
        const newToken = await this.refreshAccessToken();
        return newToken;
      }
    } catch (error) {
      secureLogger.error('Token validation failed:', sanitizeApiError(error));
    }

    // If validation failed for other reasons, try refresh anyway
    const newToken = await this.refreshAccessToken();
    return newToken;
  }
}

// ============ API CLIENT ============
class APIClient {
  private tokenManager = TokenManager.getInstance();

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    let token = this.tokenManager.getAccessToken();

    const makeRequest = async (authToken: string | null): Promise<Response> => {
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
          ...options.headers,
        },
      });
    };

    let response = await makeRequest(token);

    // Handle 401 with token refresh
    if (response.status === 401 && token) {
      const newToken = await this.tokenManager.refreshAccessToken();
      if (newToken) {
        response = await makeRequest(newToken);
      } else {
        // Redirect to login if refresh failed
        window.location.href = '/login';
        throw new APIError(401, 'Unauthorized', 'Session expired');
      }
    }

    if (!response.ok) {
      throw await APIError.fromResponse(response);
    }

    // Handle no content responses
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response as unknown as T;
  }

  // ============ AUTH ENDPOINTS ============
  async register(username: string, email: string, password: string): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async login(login: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    });
    
    this.tokenManager.setTokens(response.access_token, response.refresh_token);
    return response;
  }

  async logout(): Promise<{ message: string }> {
    try {
      const response = await this.request<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
      return response;
    } finally {
      this.tokenManager.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async updateProfile(data: Partial<Pick<User, 'username' | 'email'>> & { password?: string }): Promise<User> {
    return this.request<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  async verifyToken(): Promise<{
    valid: boolean;
    user_id: string;
    username: string;
    expires_at: string;
  }> {
    return this.request('/auth/verify-token');
  }

  async verifyEmail(token: string): Promise<any> {
    return this.request('/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    try {
      const response = await this.request<{ message: string }>('/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      return response;
    } catch (error) {
      secureLogger.error('Failed to resend verification email', { error: sanitizeApiError(error) });
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await this.request<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      return response;
    } catch (error) {
      secureLogger.error('Failed to send forgot password email', { error: sanitizeApiError(error) });
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await this.request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      return response;
    } catch (error) {
      secureLogger.error('Failed to reset password', { error: sanitizeApiError(error) });
      throw error;
    }
  }

  // ============ AVATAR ENDPOINTS ============
  async createAvatar(prompt: string): Promise<Avatar> {
    return this.request<Avatar>('/avatars/', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  async getAvatars(page: number = 1, perPage: number = 10): Promise<AvatarListResponse> {
    return this.request<AvatarListResponse>(`/avatars/?page=${page}&per_page=${perPage}`);
  }

  async getAvatar(avatarId: string): Promise<Avatar> {
    return this.request<Avatar>(`/avatars/${avatarId}`);
  }

  getAvatarImageUrl(avatarId: string): string {
    const token = this.tokenManager.getAccessToken();
    return `${MEDIA_API_BASE}/avatars/${avatarId}/image${token ? `?token=${token}` : ''}`;
  }

  // Add new method for fetching images with proper authentication
  async getAvatarImageBlob(avatarId: string): Promise<Blob> {
    const url = `${MEDIA_API_BASE}/avatars/${avatarId}/image`;
    const token = this.tokenManager.getAccessToken();

    const makeRequest = async (authToken: string | null): Promise<Response> => {
      return fetch(url, {
        headers: {
          'Accept': 'image/*',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });
    };

    let response = await makeRequest(token);

    // Handle 401 with token refresh
    if (response.status === 401 && token) {
      const newToken = await this.tokenManager.refreshAccessToken();
      if (newToken) {
        response = await makeRequest(newToken);
      } else {
        // Redirect to login if refresh failed
        window.location.href = '/login';
        throw new APIError(401, 'Unauthorized', 'Session expired');
      }
    }

    if (!response.ok) {
      throw await APIError.fromResponse(response);
    }

    return response.blob();
  }

  async deleteAvatar(avatarId: string): Promise<{ message: string; avatar_id: string }> {
    return this.request(`/avatars/${avatarId}`, {
      method: 'DELETE',
    });
  }

  // ============ ANIMATION ENDPOINTS ============
  async createAnimationProject(
    name: string,
    sourceAvatarId: string,
    totalSegments: number,
    animationPrompt?: string,
    animationType?: 'sequential' | 'independent'
  ): Promise<AnimationProject> {
    return this.request<AnimationProject>('/animations/', {
      method: 'POST',
      body: JSON.stringify({
        name,
        source_avatar_id: sourceAvatarId,
        total_segments: totalSegments,
        animation_prompt: animationPrompt || null,
        animation_type: animationType || 'independent',
      }),
    });
  }

  async getAnimationProjects(): Promise<AnimationProject[]> {
    return this.request<AnimationProject[]>('/animations/');
  }

  async getAnimationProject(projectId: string): Promise<AnimationProject> {
    return this.request<AnimationProject>(`/animations/${projectId}`);
  }

  async deleteAnimationProject(projectId: string): Promise<void> {
    return this.request(`/animations/${projectId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update prompt for a single segment. Backend only exposes a bulk prompt update endpoint:
   *   PUT /api/v1/animations/{project_id}/segments/prompts
   * We therefore proxy the single-segment update by sending a one-element prompts array.
   */
  async updateSegmentPrompt(
    projectId: string,
    segmentNumber: number,
    segmentPrompt: string
  ): Promise<{
    message: string;
    project_id: string;
    updated_segments: Array<{ segment_number: number; prompt: string; status: string }>;
  }> {
    if (segmentPrompt.trim().length < 10) {
      throw new Error('Prompt must be at least 10 characters long');
    }
    return this.request(`/animations/${projectId}/segments/prompts`, {
      method: 'PUT',
      body: JSON.stringify({
        prompts: [{ segment_number: segmentNumber, segment_prompt: segmentPrompt }],
      }),
    });
  }

  // NEW: Bulk update prompts for multiple segments according to BACKEND_ENDPOINTS_OVERVIEW.md
  async updateSegmentPromptsBulk(
    projectId: string,
    prompts: { segment_number: number; segment_prompt: string }[],
  ): Promise<{
    message: string;
    project_id: string;
    updated_segments: Array<{ segment_number: number; prompt: string; status: string }>;
  }> {
    return this.request(`/animations/${projectId}/segments/prompts`, {
      method: 'PUT',
      body: JSON.stringify({ prompts }),
    });
  }

  // Legacy projectId+segmentNumber (kept for backward compatibility)
  async generateSegment(
    projectId: string,
    segmentNumber: number,
    segmentPrompt: string,
  ): Promise<GenerateSegmentResponse> {
    if (!segmentPrompt) {
      throw new Error('segmentPrompt is required');
    }
    return this.request<GenerateSegmentResponse>(
      `/animations/${projectId}/segments/${segmentNumber}/generate`,
      {
        method: 'POST',
        body: JSON.stringify({ segment_prompt: segmentPrompt }),
      }
    );
  }

  async getSegmentDetails(projectId: string, segmentNumber: number): Promise<AnimationSegment> {
    return this.request<AnimationSegment>(`/animations/${projectId}/segments/${segmentNumber}`);
  }

  // New shortcuts by segmentId (from FULL_API_GUIDE)
  // remove generateSegmentById as not used with new spec

  getSegmentVideoUrl(projectId: string, segmentNumber: number): string {
    return `${MEDIA_API_BASE}/animations/${projectId}/segments/${segmentNumber}/video`;
  }

  // Add method for fetching segment video with proper authentication
  async getSegmentVideoBlob(projectId: string, segmentNumber: number): Promise<Blob> {
    const url = `${MEDIA_API_BASE}/animations/${projectId}/segments/${segmentNumber}/video`;
    const token = this.tokenManager.getAccessToken();

    const makeRequest = async (authToken: string | null): Promise<Response> => {
      return fetch(url, {
        headers: {
          'Accept': 'video/*',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });
    };

    let response = await makeRequest(token);

    // Handle 401 with token refresh
    if (response.status === 401 && token) {
      const newToken = await this.tokenManager.refreshAccessToken();
      if (newToken) {
        response = await makeRequest(newToken);
      } else {
        window.location.href = '/login';
        throw new APIError(401, 'Unauthorized', 'Session expired');
      }
    }

    if (!response.ok) {
      throw await APIError.fromResponse(response);
    }

    return response.blob();
  }

  async assembleVideo(projectId: string): Promise<{
    message: string;
    project_id: string;
    status: string;
  }> {
    return this.request(`/animations/${projectId}/assemble`, {
      method: 'POST',
    });
  }

  getFinalVideoUrl(projectId: string): string {
    return `${MEDIA_API_BASE}/animations/${projectId}/video`;
  }

  // Add method for fetching final video with proper authentication
  async getFinalVideoBlob(projectId: string): Promise<Blob> {
    const url = `${MEDIA_API_BASE}/animations/${projectId}/video`;
    const token = this.tokenManager.getAccessToken();

    const makeRequest = async (authToken: string | null): Promise<Response> => {
      return fetch(url, {
        headers: {
          'Accept': 'video/*',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
      });
    };

    let response = await makeRequest(token);

    // Handle 401 with token refresh
    if (response.status === 401 && token) {
      const newToken = await this.tokenManager.refreshAccessToken();
      if (newToken) {
        response = await makeRequest(newToken);
      } else {
        window.location.href = '/login';
        throw new APIError(401, 'Unauthorized', 'Session expired');
      }
    }

    if (!response.ok) {
      throw await APIError.fromResponse(response);
    }

    return response.blob();
  }

  // NEW: Parallel generation of all segments
  async generateAllSegments(
    projectId: string,
    forceRegenerate: boolean = false,
  ): Promise<{
    message: string;
    project_id: string;
    segments_started: number;
    status: string;
    task_ids: string[];
  }> {
    return this.request(`/animations/${projectId}/segments/generate-all`, {
      method: 'POST',
      body: JSON.stringify({ force_regenerate: forceRegenerate }),
    });
  }

  // ============ Story Generation API ============

  async createStory(request: {
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
  }): Promise<StoryCreateResponse> {
    return this.request<StoryCreateResponse>('/stories/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getStoryStatus(taskId: string): Promise<StoryStatusResponse> {
    return this.request<StoryStatusResponse>(`/stories/${taskId}`);
  }

  async getStories(): Promise<StoryListResponse> {
    return this.request<StoryListResponse>('/stories/');
  }

  async generateSegmentById(segmentId: string, segmentPrompt: string) {
    if (!segmentPrompt) {
      throw new Error('segmentPrompt is required');
    }
    return this.request<GenerateSegmentResponse>(
      `/segments/${segmentId}/generate`,
      {
        method: 'POST',
        body: JSON.stringify({ segment_prompt: segmentPrompt }),
      }
    );
  }

  async getSegmentDetailsById(segmentId: string) {
    return this.request<AnimationSegment>(`/segments/${segmentId}`);
  }

  // ============ UTILITY METHODS ============
  // Health check is exposed at the root level (/health) without /api/v1 prefix.
  async checkHealth(): Promise<{ status: string; version?: string }> {
    const response = await fetch('/health');
    if (!response.ok) {
      throw await APIError.fromResponse(response);
    }
    return response.json();
  }

  async getValidAccessToken(): Promise<string | null> {
    return this.tokenManager.getValidAccessToken();
  }
}

// ============ EXPORTS ============
export const apiClient = new APIClient();

// Helper function for error handling
export const getErrorMessage = (error: unknown): string => {
  // Hide backend URLs or technical details
  const hideUrl = (msg: string) =>
    /https?:\/\/|0\.0\.0\.0|localhost|127\.0\.0\.1|\/api\//.test(msg)
      ? 'Connection error. Please try again later.'
      : msg;

  if (error instanceof APIError) {
    switch (error.status) {
      case 401:
        return 'Authentication required. Please log in to continue.';
      case 403:
        return 'Insufficient permissions to perform this operation.';
      case 404:
        return 'Resource not found. It may have been deleted.';
      case 422:
        if (typeof error.details === 'object' && error.details.field_errors) {
          return error.details.field_errors
            .map(fe => `${fe.field}: ${fe.message}`)
            .join(', ');
        }
        return hideUrl(error.message);
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        if (typeof error.details === 'object') {
          const d = error.details as any;
          if (d.detail) return hideUrl(d.detail);
          if (d.field_errors) {
            return d.field_errors.map((fe: any) => `${fe.field}: ${fe.message}`).join(', ');
          }
        }
        return hideUrl(error.message || 'An unexpected error occurred.');
    }
  }
  if (error instanceof Error) {
    return hideUrl(error.message);
  }
  try {
    const msg = JSON.stringify(error);
    return hideUrl(msg);
  } catch {
    return 'An unexpected error occurred.';
  }
};

// Polling utility for async operations
export const createPoller = <T>(
  fetcher: () => Promise<T>,
  shouldContinue: (data: T) => boolean,
  interval: number = 5000,
  maxAttempts: number = 60
) => {
  let attempts = 0;
  let timeoutId: ReturnType<typeof setTimeout>;

  const poll = async (): Promise<T> => {
    try {
      const data = await fetcher();
      
      if (!shouldContinue(data) || attempts >= maxAttempts) {
        return data;
      }
      
      attempts++;
      return new Promise((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await poll();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, interval);
      });
    } catch (error) {
      if (attempts < maxAttempts) {
        attempts++;
        return new Promise((resolve, reject) => {
          timeoutId = setTimeout(async () => {
            try {
              const result = await poll();
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          }, interval * 2); // Exponential backoff on error
        });
      }
      throw error;
    }
  };

  const stopPolling = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return { poll, stop: stopPolling };
}; 