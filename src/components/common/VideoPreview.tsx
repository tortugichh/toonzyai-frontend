import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { 
  createAuthenticatedVideoUrl, 
  findWorkingVideoUrl 
} from '../../utils/videoUtils';
import type { AnimationSegment } from '../../services/api';

interface VideoPreviewProps {
  videoUrl?: string | null;
  posterUrl?: string;
  segmentNumber?: number;
  projectId?: string;
  segment?: AnimationSegment;
  title?: string;
  className?: string;
  onError?: (error: string) => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  posterUrl,
  segmentNumber,
  projectId,
  segment,
  title = 'Video',
  className = '',
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let mounted = true;
    let retryTimer: NodeJS.Timeout;

    const initializeVideoUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let workingUrl: string | null = null;

        if (projectId && segmentNumber !== undefined && segment) {
          console.log(`🎥 Finding video URL for segment ${segmentNumber}`);
          const result = await findWorkingVideoUrl(projectId, segmentNumber, segment);
          workingUrl = result.url;
          if (!workingUrl) {
            console.warn(`❌ No valid video URLs for segment ${segmentNumber}`);
          }
        } else if (videoUrl) {
          workingUrl = createAuthenticatedVideoUrl({ baseUrl: videoUrl });
        }

        if (workingUrl) {
          if (!mounted) return;
          setCurrentVideoUrl(
            workingUrl + (workingUrl.includes('?') ? '&' : '?') + `ts=${Date.now()}`
          );
          console.log(`✅ Using video URL: ${workingUrl}`);
        } else {
          throw new Error('No available video URL found');
        }
      } catch (err: any) {
        console.error('❌ Error initializing video URL:', err);
        if (!mounted) return;
        setError(err.message || 'Failed to load video');
        onError?.(err.message || 'Failed to load video');

        retryTimer = setTimeout(initializeVideoUrl, 5000);
      } finally {
        setIsLoading(false);
      }
    };

    initializeVideoUrl();

    return () => {
      mounted = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [videoUrl, projectId, segmentNumber, segment, onError]);

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setError(null);
    setRetryCount(0);
  };

  const handleError = () => {
    const errorMessage = `Failed to load video: ${title}`;
    setError(errorMessage);
    setIsLoading(false);
    onError?.(errorMessage);

    if (retryCount < 2 && projectId && segmentNumber !== undefined) {
      setRetryCount(prev => prev + 1);
      setCurrentVideoUrl(null);
    }
  };

  const handleDownload = async () => {
    if (!currentVideoUrl) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(currentVideoUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      onError?.(`Download failed: ${error.message}`);
    }
  };

  const handleOpenInNewTab = () => {
    if (currentVideoUrl) window.open(currentVideoUrl, '_blank');
  };

  if (error && !currentVideoUrl) {
    return (
      <div className={`relative rounded-lg overflow-hidden bg-red-50 border border-red-200 ${className}`}>
        <div className="p-6 text-center">
          <div className="text-4xl mb-2">❌</div>
          <h4 className="font-medium text-red-800 mb-2">{title}</h4>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          {projectId && segmentNumber !== undefined && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setError(null);
                setRetryCount(0);
                setCurrentVideoUrl(null);
              }}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              🔄 Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading video...</p>
            <p className="text-xs text-gray-500 mt-1">{title}</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src={currentVideoUrl || undefined}
        poster={posterUrl}
        controls
        preload="metadata"
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
        className="w-full h-auto rounded-lg"
        style={{ minHeight: '120px' }}
      >
        <source src={currentVideoUrl || undefined} type="video/mp4" />
        <p className="text-red-600 text-sm p-4">
          Your browser does not support video playback.
        </p>
      </video>

      {!isLoading && !error && currentVideoUrl && (
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            📥 Download
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenInNewTab}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            🔗 Open
          </Button>
        </div>
      )}

      {error && currentVideoUrl && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          ⚠️ {error} {retryCount > 0 && `(attempt ${retryCount + 1})`}
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
