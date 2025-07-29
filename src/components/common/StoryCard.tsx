import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { StoryItem } from '@/hooks/useStories';

interface StoryCardProps {
  story: StoryItem;
  onOpen?: (story: StoryItem) => void;
  onDelete?: (storyId: string) => void;
  isDeleting?: boolean;
}

export function StoryCard({ story, onDelete, isDeleting }: StoryCardProps) {
  const navigate = useNavigate();

  const handleOpen = () => {
    if (isDeleting) return; // Prevent opening if being deleted
    navigate(`/stories/${story.task_id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
      case 'pending':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'Generating';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card className={`group hover:shadow-lg transition-shadow relative ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Delete button */}
      {onDelete && story.status !== 'in_progress' && story.status !== 'pending' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(story.id);
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-lg hover:scale-110"
          title="Delete story"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      )}

      <div className="p-6 cursor-pointer" onClick={handleOpen}>
        {/* Story Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Icon */}
          <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-xl">📖</span>
          </div>

          {/* Story Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
              {story.title}
            </h3>

            <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
              {story.genre && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {story.genre}
                </span>
              )}
              {story.style && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {story.style}
                </span>
              )}
            </div>

            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                story.status
              )}`}
            >
              {getStatusText(story.status)}
            </span>
          </div>
        </div>

        {/* Preview Text */}
        {story.preview_text && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-3">
              {story.preview_text}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{formatDate(story.created_at)}</span>

          {story.status === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpen();
              }}
            >
              Open
            </Button>
          )}
        </div>

        {/* Theme badge */}
        {story.theme && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">💡 {story.theme}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
