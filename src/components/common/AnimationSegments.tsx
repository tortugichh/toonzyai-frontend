import { Card } from '@/components/ui/card';
import type { AnimationSegment } from '@/services/api';
import VideoPreview from '@/components/common/VideoPreview';

interface AnimationSegmentsProps {
  segments: AnimationSegment[];
  totalSegments: number;
}

interface PlaceholderSegment {
  segment_number: number;
  status: 'PENDING';
}

type SegmentOrPlaceholder = AnimationSegment | PlaceholderSegment;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'in_progress':
      return 'bg-yellow-500';
    case 'failed':
      return 'bg-red-500';
    case 'pending':
    case 'PENDING':
      return 'bg-gray-300';
    default:
      return 'bg-gray-300';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Готов';
    case 'in_progress':
      return 'Обработка';
    case 'failed':
      return 'Ошибка';
    case 'pending':
    case 'PENDING':
      return 'Ожидание';
    default:
      return 'Ожидание';
  }
};

// Type guard to check if segment is a full AnimationSegment
const isAnimationSegment = (segment: SegmentOrPlaceholder): segment is AnimationSegment => {
  return 'id' in segment;
};

export default function AnimationSegments({ segments, totalSegments }: AnimationSegmentsProps) {
  // Создаем массив сегментов с заполнением пустых слотов
  const segmentArray: SegmentOrPlaceholder[] = Array.from({ length: totalSegments }, (_, index) => {
    const segment = segments.find(s => s.segment_number === index + 1);
    return segment || { segment_number: index + 1, status: 'PENDING' as const };
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        Сегменты анимации ({segments.length}/{totalSegments})
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segmentArray.map((segment, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-700">
                Сегмент {index + 1}
              </h4>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(segment.status)}`}></div>
            </div>
            
            {/* Prompt preview */}
            {isAnimationSegment(segment) && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-3">
                {segment.segment_prompt || segment.prompts?.active_prompt || segment.prompts?.segment_prompt || segment.prompts?.project_prompt || 'Промпт не задан'}
              </p>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Статус:</span>
                <span className="text-sm font-medium">
                  {getStatusText(segment.status)}
                </span>
              </div>
              
              {isAnimationSegment(segment) && segment.start_frame_url && (
                <div className="mt-2">
                  <img
                    src={segment.start_frame_url}
                    alt={`Стартовый кадр сегмента ${index + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                </div>
              )}
              
              {isAnimationSegment(segment) && segment.status === 'completed' && segment.video_url && (
                <div className="mt-2">
                  <VideoPreview 
                    videoUrl={segment.video_url}
                    segmentNumber={segment.segment_number}
                    projectId={segment.id}
                    segment={segment}
                    title={`Сегмент ${index + 1}`}
                    className="w-full h-24"
                  />
                </div>
              )}
              
              {segment.status === 'in_progress' && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                  <span className="text-xs text-yellow-600">Генерация...</span>
                </div>
              )}
              
              {segment.status === 'failed' && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <span className="text-xs text-red-600">Ошибка генерации</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* List view for detailed information */}
      {segments && segments.length > 0 && (
        <Card className="p-4 bg-gray-50">
          <h5 className="text-xs font-medium text-gray-600 mb-3">Детали сегментов</h5>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {segments.map((segment) => (
              <div
                key={segment.segment_number}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-gray-700">
                  Сегмент {segment.segment_number}
                </span>
                <span className={`px-2 py-1 rounded-full font-medium ${
                  segment.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : segment.status === 'in_progress'
                    ? 'bg-yellow-100 text-yellow-700'
                    : segment.status === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {getStatusText(segment.status)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
} 