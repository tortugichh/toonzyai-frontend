import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import type { Avatar } from '../model';

interface AvatarImageProps {
  avatar: Pick<Avatar, 'avatar_id' | 'image_url' | 'status'>;
  className?: string;
  showPlaceholder?: boolean;
}

const AvatarImage = ({ avatar, className = '', showPlaceholder = true }: AvatarImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!avatar.avatar_id) return;
      setIsLoading(true);
      setHasError(false);
      try {
        const blob = await apiClient.getAvatarImageBlob(avatar.avatar_id);
        if (blob.size === 0) throw new Error('empty');
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [avatar.avatar_id]);

  const imgUrl = blobUrl || avatar.image_url;
  if ((hasError || isLoading) && showPlaceholder) {
    return <div className={`bg-gray-100 flex items-center justify-center ${className}`}>🎭</div>;
  }
  if (!imgUrl) return null;
  return <img src={imgUrl} alt="avatar" className={className} onLoad={()=>setImageLoaded(true)} style={{display:imageLoaded?'block':'none'}}/>;
};

export default AvatarImage; 