/**
 * Video Utilities for ToonzyAI Animation API
 * Обеспечивает правильную работу с видео endpoints с авторизацией
 */

import { apiClient } from '../services/api';

export interface VideoUrlConfig {
  baseUrl: string;
  token?: string;
}

/**
 * Создает авторизованный URL для видео
 */
export const createAuthenticatedVideoUrl = (config: VideoUrlConfig): string => {
  const { baseUrl, token } = config;
  
  if (!baseUrl) {
    console.warn('⚠️ No base URL provided for video');
    return '';
  }

  const authToken = token || localStorage.getItem('access_token');
  if (!authToken) {
    console.warn('⚠️ No authentication token available for video request');
    return baseUrl;
  }

  try {
    // Если это уже полный URL
    if (baseUrl.startsWith('http')) {
      const url = new URL(baseUrl);
      url.searchParams.set('token', authToken);
      return url.toString();
    }

    // Если это относительный путь
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}token=${authToken}`;
  } catch (error) {
    console.error('❌ Error creating authenticated video URL:', error);
    return baseUrl;
  }
};

/**
 * Получает все возможные URL'ы для видео сегмента
 */
export const getSegmentVideoUrls = (
  projectId: string,
  segmentNumber: number,
  segment?: {
    video_url?: string | null;
    generated_video_url?: string | null;
    urls?: {
      video_endpoint?: string;
      download_endpoint?: string;
    };
  }
): string[] => {
  const urls: string[] = [];
  const token = localStorage.getItem('access_token');

  // 1. Новый API endpoint (приоритетный)
  if (segment?.urls?.video_endpoint) {
    urls.push(createAuthenticatedVideoUrl({
      baseUrl: segment.urls.video_endpoint,
      token: token || undefined,
    }));
  }

  // 2. Стандартный endpoint
  const MEDIA_API_BASE = import.meta.env.DEV ? 'http://0.0.0.0:8000/api/v1' : '/api/v1';
  const standardEndpoint = `${MEDIA_API_BASE}/animations/${projectId}/segments/${segmentNumber}/video`;
  urls.push(createAuthenticatedVideoUrl({
    baseUrl: standardEndpoint,
    token: token || undefined,
  }));

  // 3. Прямой URL из базы данных
  if (segment?.video_url) {
    urls.push(createAuthenticatedVideoUrl({
      baseUrl: segment.video_url,
      token: token || undefined,
    }));
  }

  // 4. Legacy URL
  if (segment?.generated_video_url) {
    urls.push(createAuthenticatedVideoUrl({
      baseUrl: segment.generated_video_url,
      token: token || undefined,
    }));
  }

  // 5. Download endpoint (если доступен)
  if (segment?.urls?.download_endpoint) {
    urls.push(createAuthenticatedVideoUrl({
      baseUrl: segment.urls.download_endpoint,
      token: token || undefined,
    }));
  }

  return urls.filter(url => url.length > 0);
};

/**
 * Проверяет доступность видео по URL
 */
export const checkVideoAvailability = async (
  url: string,
  timeoutMs: number = 5000
): Promise<{ available: boolean; error?: string; status?: number }> => {
  const token = localStorage.getItem('access_token');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return {
      available: response.ok,
      status: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { available: false, error: 'Timeout: запрос превысил время ожидания' };
    }
    return { available: false, error: error.message || 'Network error' };
  }
};

/**
 * Пытается найти рабочий URL для видео сегмента
 */
export const findWorkingVideoUrl = async (
  projectId: string,
  segmentNumber: number,
  segment?: Parameters<typeof getSegmentVideoUrls>[2]
): Promise<{ url: string | null; checkedUrls: Array<{ url: string; available: boolean; error?: string }> }> => {
  const urls = getSegmentVideoUrls(projectId, segmentNumber, segment);
  const checkedUrls: Array<{ url: string; available: boolean; error?: string }> = [];

  console.log(`🔍 Checking ${urls.length} video URLs for segment ${segmentNumber}:`);

  for (const url of urls) {
    console.log(`   Testing: ${url}`);
    const result = await checkVideoAvailability(url);
    
    checkedUrls.push({
      url,
      available: result.available,
      error: result.error
    });

    if (result.available) {
      console.log(`✅ Found working video URL: ${url}`);
      return { url, checkedUrls };
    } else {
      console.log(`❌ URL not available: ${result.error}`);
    }
  }

  console.log(`❌ No working video URL found for segment ${segmentNumber}`);
  return { url: null, checkedUrls };
};

/**
 * Скачивает видео с правильной авторизацией
 */
export const downloadVideo = async (
  url: string,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; error?: string }> => {
  const token = localStorage.getItem('access_token');

  try {
    console.log(`📥 Starting download: ${filename}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLength = response.headers.get('Content-Length');
    const total = contentLength ? parseInt(contentLength) : 0;
    let loaded = 0;

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      loaded += value.length;
      
      if (total > 0 && onProgress) {
        onProgress((loaded / total) * 100);
      }
    }

    const blob = new Blob(chunks as BlobPart[], { type: 'video/mp4' });
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    
    console.log(`✅ Download completed: ${filename}`);
    return { success: true };
  } catch (error: any) {
    console.error(`❌ Download failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Получает информацию о видео файле
 */
export const getVideoInfo = async (url: string): Promise<{
  duration?: number;
  size?: number;
  format?: string;
  dimensions?: { width: number; height: number };
  error?: string;
}> => {
  const token = localStorage.getItem('access_token');
  
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const contentLength = response.headers.get('Content-Length');
    const contentType = response.headers.get('Content-Type');

    return {
      size: contentLength ? parseInt(contentLength) : undefined,
      format: contentType || undefined,
    };
  } catch (error: any) {
    return { error: error.message };
  }
};

/**
 * Дебаггинг функция для диагностики проблем с видео
 */
export const debugVideoIssues = async (
  projectId: string,
  segmentNumber: number,
  segment?: Parameters<typeof getSegmentVideoUrls>[2]
): Promise<void> => {
  console.group(`🔧 VIDEO DEBUG: Segment ${segmentNumber}`);
  
  // 1. Проверяем наличие токена
  const token = localStorage.getItem('access_token');
  console.log('🔑 Auth token:', token ? `Present (${token.length} chars)` : 'Missing');
  
  // 2. Проверяем данные сегмента
  console.log('📊 Segment data:', {
    video_url: segment?.video_url,
    generated_video_url: segment?.generated_video_url,
    urls: segment?.urls,
  });
  
  // 3. Получаем все возможные URL'ы
  const urls = getSegmentVideoUrls(projectId, segmentNumber, segment);
  console.log(`🔗 Found ${urls.length} potential URLs:`, urls);
  
  // 4. Проверяем доступность каждого URL
  const results = await findWorkingVideoUrl(projectId, segmentNumber, segment);
  console.log('✅ Working URL:', results.url);
  console.log('📋 All checks:', results.checkedUrls);
  
  console.groupEnd();
};

/**
 * Создает blob URL для видео сегмента с правильной аутентификацией
 */
export const createSegmentVideoBlobUrl = async (
  projectId: string,
  segmentNumber: number
): Promise<string | null> => {
  try {
    console.log(`📹 Creating blob URL for segment ${segmentNumber}`);
    const blob = await apiClient.getSegmentVideoBlob(projectId, segmentNumber);
    const blobUrl = URL.createObjectURL(blob);
    console.log(`✅ Segment video blob URL created: ${blobUrl}`);
    return blobUrl;
  } catch (error) {
    console.error(`❌ Failed to create segment video blob URL:`, error);
    return null;
  }
};

/**
 * Создает blob URL для финального видео с правильной аутентификацией
 */
export const createFinalVideoBlobUrl = async (
  projectId: string
): Promise<string | null> => {
  try {
    console.log(`📹 Creating blob URL for final video`);
    const blob = await apiClient.getFinalVideoBlob(projectId);
    const blobUrl = URL.createObjectURL(blob);
    console.log(`✅ Final video blob URL created: ${blobUrl}`);
    return blobUrl;
  } catch (error) {
    console.error(`❌ Failed to create final video blob URL:`, error);
    return null;
  }
}; 