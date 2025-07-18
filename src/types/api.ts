// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface TokenVerificationResponse {
  valid: boolean;
  user_id: string;
  username: string;
  expires_at: string;
}

// Avatar types
export interface CreateAvatarRequest {
  prompt: string;
}

export type AvatarStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface Avatar {
  avatar_id: string;
  image_url: string;
  prompt: string;
  status: AvatarStatus;
  user_id: string;
  created_at: string;
  moderation_flags?: string[] | null;
}

export interface AvatarsResponse {
  avatars: Avatar[];
  total: number;
  page: number;
  per_page: number;
}

// Animation types
export interface CreateAnimationRequest {
  source_avatar_id: string;
  animation_prompt: string;
  total_segments: number;
}

export type AnimationStatus = 'pending' | 'in_progress' | 'assembling' | 'completed' | 'failed';
export type SegmentStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'assembling';

export interface AnimationSegment {
  id: string;
  segment_number: number;
  status: SegmentStatus;
  status_description?: string;
  segment_prompt: string | null;
  start_frame_url: string;
  generated_video_url: string | null;
  video_url: string | null;
  created_at: string;
  updated_at: string;
  // New structured data from updated API
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
  segments?: AnimationSegment[];
}

// Для списка анимаций - возвращается просто массив согласно документации
export type AnimationsResponse = AnimationProject[];

export interface AssembleVideoResponse {
  message: string;
  project_id: string;
  status: string;
}

// Error types
export interface ApiError {
  detail: string;
}

// Новые типы для работы с сегментами
export interface UpdateSegmentPromptRequest {
  segment_prompt: string;
}

export interface UpdateSegmentPromptResponse {
  message: string;
  project_id: string;
  segment_number: number;
  new_prompt: string;
}

export interface GenerateSegmentRequest {
  segment_prompt?: string; // Опциональный override текущего промпта
}

export interface GenerateSegmentResponse {
  message: string;
  project_id: string;
  segment_number: number;
  task_id: string;
  status: string;
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

export interface SegmentDetailsResponse {
  id: string;
  segment_number: number;
  status: SegmentStatus;
  segment_prompt: string | null;
  project_prompt: string; // Общий промпт проекта
  start_frame_url: string;
  generated_video_url: string | null;
  video_url: string | null;
  created_at: string;
  updated_at: string;
} 