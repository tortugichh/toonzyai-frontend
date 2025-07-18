import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ContentIcon } from '@/components/ui/icons';
import { ActionIcon } from '@/components/ui/icons';
import AvatarImage from './AvatarImage';
import Modal from '@/components/ui/Modal';
import { useNavigate } from 'react-router-dom';
import type { Avatar } from '@/types/api';

interface AvatarCardProps {
  avatar: Avatar;
  onDelete?: (avatarId: string) => void;
  isDeleting?: boolean;
}

export function AvatarCard({ avatar, onDelete, isDeleting = false }: AvatarCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();

  const handleAnimate = () => {
    navigate('/animations', { state: { selectedAvatar: avatar } });
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(avatar.avatar_id);
      setShowDeleteModal(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Ready';
      case 'generating': return 'Generating';
      case 'failed': return 'Error';
      default: return 'Pending';
    }
  };

  const normalizedStatus = avatar.status;

  return (
    <>
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border-0">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Delete button */}
        {onDelete && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="absolute top-2 right-2 z-30 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
            disabled={isDeleting}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Avatar image */}
        <div className="relative">
          <AvatarImage avatar={avatar} />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {normalizedStatus === 'completed' && (
                <Button
                  onClick={handleAnimate}
                  className="bg-white/90 text-gray-900 hover:bg-white px-4 py-2 rounded-lg shadow-lg"
                >
                  <ContentIcon type="video" className="w-4 h-4 mr-2" />
                  Create Animation
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 relative z-20">
          <p className="font-medium text-gray-900 mb-2 line-clamp-2">
            {avatar.prompt}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(avatar.status)}`}>
              {getStatusText(avatar.status)}
            </span>
            <p className="text-xs text-gray-500">
              {new Date(avatar.created_at).toLocaleDateString('en-US')}
            </p>
          </div>
          
          <div className="flex">
            {normalizedStatus === 'completed' ? (
                <Button
                  onClick={handleAnimate}
              className="flex-1 bg-gradient-to-r from-[#FFA657] via-[#FF8800] to-[#CC6E00] text-white text-sm py-2 font-medium transform-gpu transition-transform duration-300 hover:scale-105"
              >
                <ContentIcon type="video" className="w-4 h-4 mr-2" />
                Create Animation
              </Button>
            ) : normalizedStatus === 'generating' ? (
                <div className="flex-1 bg-yellow-100 text-yellow-700 text-sm py-2 px-4 rounded-md text-center flex items-center justify-center">
                  <ActionIcon action="loading" className="w-4 h-4 mr-2" animate />
                  Generating...
                </div>
            ) : normalizedStatus === 'failed' ? (
                <div className="flex-1 bg-red-100 text-red-700 text-sm py-2 px-4 rounded-md text-center flex items-center justify-center">
                  <ActionIcon action="delete" className="w-4 h-4 mr-2" />
                  Generation Error
                </div>
            ) : (
                <div className="flex-1 bg-gray-100 text-gray-600 text-sm py-2 px-4 rounded-md text-center flex items-center justify-center">
                  <ActionIcon action="loading" className="w-4 h-4 mr-2" />
                  In Queue...
                </div>
            )}
          </div>
        </div>
      </Card>

      <Modal
        open={showDeleteModal}
        title="Delete Avatar"
        description="Are you sure you want to delete this avatar? This action cannot be undone."
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
} 