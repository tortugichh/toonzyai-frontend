import axios from 'axios';
import type { AxiosResponse } from 'axios';

/**
 * Загружает изображение аватара как blob
 */
export async function loadAvatarImageAsBlob(avatarId: string): Promise<string> {
  console.log('Loading avatar image as blob for ID:', avatarId);
  
  try {
    const response: AxiosResponse<Blob> = await axios.get(`/api/v1/avatars/${avatarId}/image`, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    console.log('Blob loaded:', {
      size: response.data.size,
      type: response.data.type,
      avatarId: avatarId
    });
    
    // Проверим, что получили действительно изображение
    if (!response.data.type.startsWith('image/')) {
      throw new Error(`Invalid content type: ${response.data.type}. Expected image/*`);
    }

    // Проверим размер
    if (response.data.size === 0) {
      throw new Error('Empty blob received');
    }

    const blobUrl = URL.createObjectURL(response.data);
    console.log('Created blob URL:', blobUrl);
    
    // Дополнительная проверка - убеждаемся, что blob URL действительно создался
    if (!blobUrl || !blobUrl.startsWith('blob:')) {
      throw new Error('Failed to create blob URL');
    }

    return blobUrl;
  } catch (error: any) {
    console.error('Error loading avatar image:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      
      if (error.response.status === 404) {
        throw new Error('Avatar image not found');
      } else if (error.response.status === 403) {
        throw new Error('Access denied to avatar image');
      } else if (error.response.status === 401) {
        throw new Error('Authentication required');
      }
    }
    
    throw error;
  }
}

/**
 * Очищает blob URL для предотвращения утечек памяти
 */
export function cleanupBlobUrl(blobUrl: string): void {
  if (blobUrl && blobUrl.startsWith('blob:')) {
    console.log('Cleaning up blob URL:', blobUrl);
    URL.revokeObjectURL(blobUrl);
  }
}

/**
 * Предзагружает изображение аватара в кэш
 */
export async function preloadAvatarImage(avatarId: string): Promise<void> {
  try {
    await avatarImageCache.get(avatarId);
    console.log('Preloaded avatar image:', avatarId);
  } catch (error) {
    console.error('Failed to preload avatar image:', avatarId, error);
  }
}

/**
 * Кэш для хранения blob URLs изображений аватаров
 */
class AvatarImageCache {
  private cache = new Map<string, string>();
  private loadingPromises = new Map<string, Promise<string>>();
  private readonly maxSize = 50; // Максимальное количество изображений в кэше

  /**
   * Получает изображение из кэша или загружает его
   */
  async get(avatarId: string): Promise<string> {
    console.log('Loading new image for avatar:', avatarId);
    console.log('Current cache state:', {
      cacheSize: this.cache.size,
      loadingPromises: this.loadingPromises.size,
      hasCached: this.cache.has(avatarId),
      hasLoading: this.loadingPromises.has(avatarId)
    });

    // Если изображение уже в кэше, возвращаем его
    if (this.cache.has(avatarId)) {
      const cachedUrl = this.cache.get(avatarId)!;
      console.log('Found cached image for avatar:', avatarId, 'URL:', cachedUrl);
      
      // Проверим, что blob URL всё ещё валидный
      try {
        const testImage = new Image();
        const isValid = await new Promise((resolve) => {
          testImage.onload = () => resolve(true);
          testImage.onerror = () => resolve(false);
          testImage.src = cachedUrl;
        });
        
        if (isValid) {
          console.log('Cached blob URL is still valid for avatar:', avatarId);
          return cachedUrl;
        } else {
          console.log('Cached blob URL is invalid, removing from cache:', avatarId);
          cleanupBlobUrl(cachedUrl);
          this.cache.delete(avatarId);
        }
      } catch (error) {
        console.log('Error checking cached blob URL, removing from cache:', avatarId, error);
        cleanupBlobUrl(cachedUrl);
        this.cache.delete(avatarId);
      }
    }

    // Если загрузка уже в процессе, ожидаем её завершения
    if (this.loadingPromises.has(avatarId)) {
      console.log('Image loading already in progress for avatar:', avatarId);
      return this.loadingPromises.get(avatarId)!;
    }

    // Создаём новый промис загрузки
    const loadingPromise = this.loadImage(avatarId);
    this.loadingPromises.set(avatarId, loadingPromise);

    try {
      const blobUrl = await loadingPromise;
      console.log('Successfully loaded and cached image for avatar:', avatarId, 'URL:', blobUrl);
      
      // Сохраняем в кэш
      this.cache.set(avatarId, blobUrl);
      
      // Проверяем размер кэша и очищаем старые записи при необходимости
      this.enforceMaxSize();
      
      return blobUrl;
    } catch (error) {
      console.error('Failed to load image for avatar:', avatarId, error);
      throw error;
    } finally {
      // Удаляем промис загрузки
      this.loadingPromises.delete(avatarId);
    }
  }

  /**
   * Загружает изображение
   */
  private async loadImage(avatarId: string): Promise<string> {
    console.log('Starting image load for avatar:', avatarId);
    
    try {
      const blobUrl = await loadAvatarImageAsBlob(avatarId);
      console.log('Image load completed for avatar:', avatarId, 'Created blob URL:', blobUrl);
      return blobUrl;
    } catch (error) {
      console.error('Image load failed for avatar:', avatarId, error);
      throw error;
    }
  }

  /**
   * Удаляет изображение из кэша
   */
  remove(avatarId: string): void {
    if (this.cache.has(avatarId)) {
      const blobUrl = this.cache.get(avatarId)!;
      cleanupBlobUrl(blobUrl);
      this.cache.delete(avatarId);
      console.log('Removed avatar from cache:', avatarId);
    }
  }

  /**
   * Очищает весь кэш
   */
  clear(): void {
    console.log('Clearing entire image cache, current size:', this.cache.size);
    for (const [, blobUrl] of this.cache) {
      cleanupBlobUrl(blobUrl);
    }
    this.cache.clear();
    this.loadingPromises.clear();
    console.log('Image cache cleared');
  }

  /**
   * Контролирует размер кэша
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.maxSize) {
      return;
    }

    console.log('Cache size exceeded, cleaning up old entries');
    const entries = Array.from(this.cache.entries());
    const toRemove = entries.slice(0, entries.length - this.maxSize);

    toRemove.forEach(([avatarId, blobUrl]) => {
      cleanupBlobUrl(blobUrl);
      this.cache.delete(avatarId);
    });

    console.log(`Removed ${toRemove.length} old entries from cache`);
  }

  /**
   * Получает информацию о кэше для отладки
   */
  getDebugInfo() {
    return {
      cacheSize: this.cache.size,
      loadingPromises: this.loadingPromises.size,
      maxSize: this.maxSize,
      cachedAvatars: Array.from(this.cache.keys()),
      loadingAvatars: Array.from(this.loadingPromises.keys())
    };
  }
}

// Создаём единственный экземпляр кэша
export const avatarImageCache = new AvatarImageCache();

/**
 * Хук для очистки кэша при размонтировании компонентов
 */
export function useImageCleanup() {
  return {
    cleanup: avatarImageCache.clear.bind(avatarImageCache),
    remove: avatarImageCache.remove.bind(avatarImageCache)
  };
} 