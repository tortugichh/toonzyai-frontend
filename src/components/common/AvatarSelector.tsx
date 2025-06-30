import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AvatarImage from './AvatarImage';
import type { Avatar } from '@/services/api';

interface AvatarSelectorProps {
  avatars: Avatar[];
  selectedAvatarId?: string;
  onSelect: (avatarId: string) => void;
  onCreateNew?: () => void;
}

export function AvatarSelector({ 
  avatars, 
  selectedAvatarId, 
  onSelect, 
  onCreateNew 
}: AvatarSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAvatars = avatars.filter(avatar => 
    avatar.prompt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase?.().trim();
    switch (normalizedStatus) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'generating':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    const normalizedStatus = status?.toLowerCase?.().trim();
    switch (normalizedStatus) {
      case 'completed':
        return 'Готов';
      case 'generating':
        return 'Генерируется';
      case 'failed':
        return 'Ошибка';
      case 'pending':
        return 'В очереди';
      default:
        return status;
    }
  };

  const completedCount = avatars.filter(a => a.status?.toLowerCase?.().trim() === 'completed').length;

  if (avatars.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <span className="text-3xl mb-3 block">🎨</span>
        <p className="text-gray-600 mb-2">Нет готовых аватаров</p>
        <p className="text-sm text-gray-500 mb-4">
          Сначала создайте аватар, чтобы его можно было анимировать
        </p>
        {onCreateNew && (
          <Button
            onClick={onCreateNew}
            variant="outline"
            className="text-purple-600 hover:text-purple-700 border-purple-300"
          >
            ✨ Создать аватар
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">ℹ️</span>
          <p className="text-sm text-blue-800">
            {completedCount > 0 ? (
              <>
                Доступно <strong>{completedCount}</strong> готовых аватаров из <strong>{avatars.length}</strong> общих.
                {completedCount < avatars.length && (
                  <span className="text-blue-600"> Некоторые аватары ещё генерируются.</span>
                )}
              </>
            ) : (
              <>
                У вас есть <strong>{avatars.length}</strong> аватаров, но они ещё не готовы для анимации. 
                Дождитесь завершения генерации.
              </>
            )}
            {avatars.length > 3 && ' Используйте поиск для быстрого нахождения нужного аватара.'}
          </p>
        </div>
      </div>

      {/* Search */}
      {avatars.length > 3 && (
        <div className="relative">
          <Input
            type="text"
            placeholder="Поиск по описанию аватара..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      {searchTerm && (
        <p className="text-sm text-gray-600">
          {filteredAvatars.length === 0 
            ? 'Ничего не найдено' 
            : `Найдено ${filteredAvatars.length} из ${avatars.length} аватаров`
          }
        </p>
      )}

      {/* Avatar Grid */}
      {filteredAvatars.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <span className="text-2xl mb-2 block">🔍</span>
          <p className="text-gray-600">Ничего не найдено</p>
          <p className="text-sm text-gray-500">Попробуйте изменить поисковый запрос</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {filteredAvatars.map((avatar) => (
            <div
              key={avatar.avatar_id}
              onClick={() => onSelect(avatar.avatar_id)}
              className={`cursor-pointer rounded-lg border-2 transition-all duration-200 p-4 hover:shadow-md ${
                selectedAvatarId === avatar.avatar_id
                  ? 'border-purple-500 bg-purple-50 shadow-lg ring-2 ring-purple-200'
                  : 'border-gray-200 hover:border-purple-300 bg-white'
              }`}
            >
              <div className="relative">
                <div className="aspect-square rounded-lg overflow-hidden mb-3">
                  <AvatarImage 
                    avatar={avatar}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Selection indicator */}
                {selectedAvatarId === avatar.avatar_id && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                  {avatar.prompt}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {new Date(avatar.created_at).toLocaleDateString('ru-RU')}
                  </p>
                  <span className={`px-2 py-1 ${getStatusColor(avatar.status)} text-xs rounded-full font-medium`}>
                    {getStatusText(avatar.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected avatar info */}
      {selectedAvatarId && (
        <div className={`p-3 rounded-lg border ${
          avatars.find(a => a.avatar_id === selectedAvatarId)?.status?.toLowerCase?.().trim() === 'completed'
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2">
            <span className={
              avatars.find(a => a.avatar_id === selectedAvatarId)?.status?.toLowerCase?.().trim() === 'completed'
                ? 'text-green-600'
                : 'text-yellow-600'
            }>
              {avatars.find(a => a.avatar_id === selectedAvatarId)?.status?.toLowerCase?.().trim() === 'completed' ? '✓' : '⚠️'}
            </span>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                avatars.find(a => a.avatar_id === selectedAvatarId)?.status?.toLowerCase?.().trim() === 'completed'
                  ? 'text-green-800'
                  : 'text-yellow-800'
              }`}>
                Выбран аватар: <strong>
                  {avatars.find(a => a.avatar_id === selectedAvatarId)?.prompt.slice(0, 50)}
                  {avatars.find(a => a.avatar_id === selectedAvatarId)?.prompt.length! > 50 ? '...' : ''}
                </strong>
              </p>
              {avatars.find(a => a.avatar_id === selectedAvatarId)?.status?.toLowerCase?.().trim() !== 'completed' && (
                <p className="text-xs text-yellow-700 mt-1">
                  ⚠️ Этот аватар ещё не готов ({getStatusText(avatars.find(a => a.avatar_id === selectedAvatarId)?.status!)}). 
                  Анимация может не запуститься.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 