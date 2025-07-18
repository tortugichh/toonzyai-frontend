// Development mode
export const IS_DEVELOPMENT = import.meta.env.DEV;
export const IS_PRODUCTION = import.meta.env.PROD;

// Backend base origin can be overridden via VITE_API_ORIGIN,
// otherwise we use .me domain by default in production.
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? (IS_PRODUCTION ? 'https://api.toonzyai.me' : '');

// Full base URL for all REST endpoints
export const API_BASE_URL = `${API_ORIGIN}/api/v1`;

// Image settings
export const IMAGE_CACHE_SIZE_LIMIT = 50; // maximum 50 images in cache
export const IMAGE_LOAD_TIMEOUT = 30000; // 30 second timeout

// React Query settings
export const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const QUERY_CACHE_TIME = 10 * 60 * 1000; // 10 minutes

// Auto-refresh settings
export const AVATAR_REFETCH_INTERVAL = 5000; // 5 seconds for avatars being generated
export const ANIMATION_REFETCH_INTERVAL = 3000; // 3 seconds for animations in progress

// Limits
export const MAX_AVATAR_PROMPT_LENGTH = 500;
export const MAX_ANIMATION_PROMPT_LENGTH = 300;
export const MAX_ANIMATION_SEGMENTS = 10;

// API constants
export const API_VERSION = 'v1'; 