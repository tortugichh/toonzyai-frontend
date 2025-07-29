import type {
  StoryCreateResponse,
  StoryStatusResponse,
} from './api';
import { apiClient } from './api';


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
  return apiClient.createStory(request);
}

export async function getStoryStatus(taskId: string): Promise<StoryStatusResponse> {
  return apiClient.getStoryStatus(taskId);
}

export async function deleteStory(storyId: string): Promise<{ message: string; story_id: string }> {
  return apiClient.deleteStory(storyId);
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
  return apiClient.createAnimationProject(
    payload.name,
    payload.source_avatar_id,
    payload.total_segments,
    payload.animation_prompt || undefined
  );
}

export async function generateSegment(projectId: string, segmentNumber: number, segmentPrompt: string) {
  return apiClient.generateSegment(projectId, segmentNumber, segmentPrompt);
}

export async function getSegmentDetails(projectId: string, segmentNumber: number): Promise<AnimationSegment> {
  return apiClient.getSegmentDetails(projectId, segmentNumber);
}

export async function getAnimationProject(projectId: string): Promise<AnimationProject> {
  return apiClient.getAnimationProject(projectId);
}

export async function assembleVideo(projectId: string) {
  return apiClient.assembleVideo(projectId);
} 