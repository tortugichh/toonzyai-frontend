// Режим разработки
export const IS_DEVELOPMENT = import.meta.env.DEV;
export const IS_PRODUCTION = import.meta.env.PROD;

// Базовый origin бекенда можно переопределить через VITE_API_ORIGIN,
// иначе берём домен .me по умолчанию в продакшене.
// Force local development - never use production API in development
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? '';

// Полный базовый URL всех REST-эндпоинтов
export const API_BASE_URL = `${API_ORIGIN}/api/v1`;

// Настройки изображений
export const IMAGE_CACHE_SIZE_LIMIT = 50; // максимум 50 изображений в кэше
export const IMAGE_LOAD_TIMEOUT = 30000; // 30 секунд таймаут

// Настройки React Query
export const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 минут
export const QUERY_CACHE_TIME = 10 * 60 * 1000; // 10 минут

// Настройки автообновления
export const AVATAR_REFETCH_INTERVAL = 5000; // 5 секунд для аватаров в процессе генерации
export const ANIMATION_REFETCH_INTERVAL = 3000; // 3 секунды для анимаций в процессе

// Лимиты
export const MAX_AVATAR_PROMPT_LENGTH = 500;
export const MAX_ANIMATION_PROMPT_LENGTH = 300;
export const MAX_ANIMATION_SEGMENTS = 10;

// API константы
export const API_VERSION = 'v1'; 