/**
 * ToonzyAI API Client
 * Полная реализация согласно BACKEND_API_DOCUMENTATION.md
 */

const API_BASE = '/api/v1';

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

export interface AnimationProject {
  id: string;
  user_id: string;
  source_avatar_id: string;
  total_segments: number;
  animation_prompt: string;
  status: AnimationStatus;
  final_video_url: string | null;
  video_url: string | null;
  created_at: string;
  updated_at: string;
  segments: AnimationSegment[];
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
    } catch {
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
      console.error('Token refresh failed:', error);
      this.clearTokens();
      this.failedQueue.forEach(resolve => resolve(null));
      this.failedQueue = [];
      return null;
    } finally {
      this.isRefreshing = false;
    }
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

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
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
    return `${API_BASE}/avatars/${avatarId}/image${token ? `?token=${token}` : ''}`;
  }

  // Add new method for fetching images with proper authentication
  async getAvatarImageBlob(avatarId: string): Promise<Blob> {
    const url = `${API_BASE}/avatars/${avatarId}/image`;
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
    sourceAvatarId: string,
    totalSegments: number,
    animationPrompt: string
  ): Promise<AnimationProject> {
    return this.request<AnimationProject>('/animations/', {
      method: 'POST',
      body: JSON.stringify({
        source_avatar_id: sourceAvatarId,
        total_segments: totalSegments,
        animation_prompt: animationPrompt,
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

  async updateSegmentPrompt(
    projectId: string,
    segmentNumber: number,
    segmentPrompt: string
  ): Promise<{
    message: string;
    project_id: string;
    segment_number: number;
    new_prompt: string;
  }> {
    return this.request(`/animations/${projectId}/segments/${segmentNumber}/prompt`, {
      method: 'PUT',
      body: JSON.stringify({ segment_prompt: segmentPrompt }),
    });
  }

  async generateSegment(
    projectId: string,
    segmentNumber: number,
    segmentPrompt?: string
  ): Promise<GenerateSegmentResponse> {
    return this.request<GenerateSegmentResponse>(
      `/animations/${projectId}/segments/${segmentNumber}/generate`,
      {
        method: 'POST',
        body: JSON.stringify(segmentPrompt ? { segment_prompt: segmentPrompt } : {}),
      }
    );
  }

  async getSegmentDetails(projectId: string, segmentNumber: number): Promise<AnimationSegment> {
    return this.request<AnimationSegment>(`/animations/${projectId}/segments/${segmentNumber}`);
  }

  getSegmentVideoUrl(projectId: string, segmentNumber: number): string {
    const token = this.tokenManager.getAccessToken();
    return `${API_BASE}/animations/${projectId}/segments/${segmentNumber}/video${token ? `?token=${token}` : ''}`;
  }

  // Add method for fetching segment video with proper authentication
  async getSegmentVideoBlob(projectId: string, segmentNumber: number): Promise<Blob> {
    const url = `${API_BASE}/animations/${projectId}/segments/${segmentNumber}/video`;
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
    const token = this.tokenManager.getAccessToken();
    return `${API_BASE}/animations/${projectId}/video${token ? `?token=${token}` : ''}`;
  }

  // Add method for fetching final video with proper authentication
  async getFinalVideoBlob(projectId: string): Promise<Blob> {
    const url = `${API_BASE}/animations/${projectId}/video`;
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

  // ============ UTILITY METHODS ============
  async checkHealth(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

// ============ EXPORTS ============
export const apiClient = new APIClient();

// Helper function for error handling
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof APIError) {
    switch (error.status) {
      case 401:
        return 'Требуется авторизация. Пожалуйста, войдите в систему.';
      case 403:
        return 'Недостаточно прав для выполнения операции.';
      case 404:
        return 'Ресурс не найден. Возможно, он был удален.';
      case 422:
        if (typeof error.details === 'object' && error.details.field_errors) {
          return error.details.field_errors
            .map(fe => `${fe.field}: ${fe.message}`)
            .join(', ');
        }
        return error.message;
      case 429:
        return 'Слишком много запросов. Попробуйте позже.';
      case 500:
        return 'Ошибка сервера. Попробуйте позже.';
      default:
        return error.message || 'Произошла неизвестная ошибка.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Произошла неожиданная ошибка.';
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