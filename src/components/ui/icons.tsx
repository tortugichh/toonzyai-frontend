import { 
  IconCircleCheck, 
  IconCircleX, 
  IconClock, 
  IconRotateClockwise, 
  IconTool, 
  IconQuestionMark,
  IconAlertTriangle,
  IconInfoCircle,
  IconBan,
  IconSettings,
  IconSparkles,
  IconPlayerPlay,
  IconEdit,
  IconTrash,
  IconPalette,
  IconVideo,
  IconDownload,
  IconRefresh,
  IconPlayerPause,
  IconPhoto,
  IconMovie,
  IconUser,
  IconLoader2
} from '@tabler/icons-react';

export const StatusIcons = {
  completed: IconCircleCheck,
  failed: IconCircleX,
  pending: IconClock,
  inProgress: IconRotateClockwise,
  assembling: IconTool,
  unknown: IconQuestionMark,
  warning: IconAlertTriangle,
  info: IconInfoCircle,
  blocked: IconBan,
};

export const ActionIcons = {
  play: IconPlayerPlay,
  pause: IconPlayerPause,
  edit: IconEdit,
  delete: IconTrash,
  create: IconSparkles,
  download: IconDownload,
  refresh: IconRefresh,
  settings: IconSettings,
  loading: IconLoader2,
};

export const ContentIcons = {
  avatar: IconUser,
  animation: IconVideo,
  image: IconPhoto,
  video: IconMovie,
  palette: IconPalette,
};

// Status icon component with consistent styling
export function StatusIcon({ 
  status, 
  className = "w-4 h-4",
  showText = false 
}: { 
  status: keyof typeof StatusIcons; 
  className?: string;
  showText?: boolean;
}) {
  const Icon = StatusIcons[status] || StatusIcons.unknown;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-gray-600';
      case 'inProgress': return 'text-blue-600';
      case 'assembling': return 'text-orange-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-500';
      case 'blocked': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Завершен';
      case 'failed': return 'Ошибка';
      case 'pending': return 'Ожидание';
      case 'inProgress': return 'В процессе';
      case 'assembling': return 'Сборка';
      case 'warning': return 'Предупреждение';
      case 'info': return 'Информация';
      case 'blocked': return 'Заблокировано';
      default: return 'Неизвестно';
    }
  };

  return (
    <span className={`inline-flex items-center ${getStatusColor(status)}`}>
      <Icon className={className} />
      {showText && <span className="ml-1 text-sm">{getStatusText(status)}</span>}
    </span>
  );
}

// Action icon component with consistent styling
export function ActionIcon({ 
  action, 
  className = "w-4 h-4",
  animate = false 
}: { 
  action: keyof typeof ActionIcons; 
  className?: string;
  animate?: boolean;
}) {
  const Icon = ActionIcons[action] || ActionIcons.settings;
  
  return (
    <Icon 
      className={`${className} ${animate && action === 'loading' ? 'animate-spin' : ''} ${animate && action === 'refresh' ? 'animate-spin' : ''}`} 
    />
  );
}

// Content icon component
export function ContentIcon({ 
  type, 
  className = "w-4 h-4" 
}: { 
  type: keyof typeof ContentIcons; 
  className?: string;
}) {
  const Icon = ContentIcons[type] || ContentIcons.image;
  
  return <Icon className={className} />;
} 