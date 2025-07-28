import type { Avatar } from '../model';
import { Card, Button } from '@shared/ui';
import { ActionIcon, ContentIcon } from '@/components/ui/icons';
import { useNavigate } from 'react-router-dom';
import AvatarImage from './AvatarImage';
import Modal from '@/components/ui/Modal';
import { useState } from 'react';

interface AvatarCardProps {
  avatar: Avatar;
  onDelete: (avatarId: string) => void;
  isDeleting?: boolean;
}

export function AvatarCard({ avatar, onDelete, isDeleting = false }: AvatarCardProps) {
  const navigate = useNavigate();
  const [isModalOpen, setModalOpen] = useState(false);

  const handleDelete = () => {
    setModalOpen(true);
  };

  const confirmDelete = () => {
    onDelete(avatar.avatar_id);
  };

  const handleAnimate = () => {
    navigate('/animations', { 
      state: { 
        selectedAvatarId: avatar.avatar_id,
        selectedAvatar: avatar
      } 
    });
  };

  const normalizedStatus = avatar.status?.toString().toLowerCase().trim();

  const getStatusColor = (status?: string) => {
    const s = status?.toLowerCase().trim();
    switch (s) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'generating': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Ready';
      case 'generating': return 'Processing';
      case 'failed': return 'Error';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  return (
    <Card className="relative bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-visible">
      {/* Delete cross */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 text-gray-500 z-10"
        aria-label="Удалить аватар"
        disabled={isDeleting}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <Modal
        open={isModalOpen}
        title="Удалить аватар?"
        description="Вы уверены, что хотите удалить этот аватар? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={confirmDelete}
        onClose={() => setModalOpen(false)}
      />
      <div className="relative aspect-square w-full bg-gray-100">
        <AvatarImage avatar={avatar} className="absolute inset-0 w-full h-full object-cover z-0" showPlaceholder />
      </div>
      <div className="p-6 relative z-20">
        <p className="font-medium text-gray-900 mb-2 line-clamp-2">{avatar.prompt}</p>
        <div className="flex items-center justify-between mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(avatar.status)}`}>{getStatusText(avatar.status)}</span>
          <p className="text-xs text-gray-500">{new Date(avatar.created_at).toLocaleDateString('ru-RU')}</p>
        </div>
        <div className="flex">
          {normalizedStatus === 'completed' ? (
            <Button onClick={handleAnimate} className="flex-1 bg-gradient-to-r from-[#FFA657] via-[#FF8800] to-[#CC6E00] text-white text-sm py-2 font-medium transform-gpu transition-transform duration-300 hover:scale-105">
              <ContentIcon type="video" className="w-4 h-4 mr-2" />
              Создать анимацию
            </Button>
          ) : (
                          <div className="flex-1 bg-gray-100 text-gray-600 text-sm py-2 px-4 rounded-md text-center flex items-center justify-center">
                {normalizedStatus === 'generating' ? (
                  <>
                    <ActionIcon action="loading" className="w-4 h-4 mr-2" animate />
                    Генерируется...
                  </>
                ) : normalizedStatus === 'failed' ? (
                  <>
                    <ActionIcon action="delete" className="w-4 h-4 mr-2" />
                    <div className="text-red-600 text-sm font-medium">
                      Generation Error
                    </div>
                  </>
                ) : (
                  <>
                    <ActionIcon action="loading" className="w-4 h-4 mr-2" />
                    В очереди...
                  </>
                )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
} 