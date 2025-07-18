import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { 
  getSegmentVideoUrls, 
  checkVideoAvailability,
  getVideoInfo
} from '../../utils/videoUtils';
import type { AnimationSegment } from '../../types/api';

interface VideoDebugPanelProps {
  projectId: string;
  segment: AnimationSegment;
  onClose?: () => void;
}

interface DiagnosticResult {
  url: string;
  status: 'checking' | 'available' | 'unavailable' | 'error';
  error?: string;
  httpStatus?: number;
  videoInfo?: {
    size?: number;
    format?: string;
  };
}

const VideoDebugPanel: React.FC<VideoDebugPanelProps> = ({
  projectId,
  segment,
  onClose
}) => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [summary, setSummary] = useState<string>('');

  const runDiagnostics = async () => {
    setIsChecking(true);
    setResults([]);

    try {
      const urls = getSegmentVideoUrls(projectId, segment.segment_number, segment);
      const diagnosticResults: DiagnosticResult[] = [];

      for (const url of urls) {
        console.log(`🔍 Testing URL: ${url}`);
        
        const availability = await checkVideoAvailability(url);
        const videoInfo = await getVideoInfo(url);
        
        diagnosticResults.push({
          url,
          status: availability.available ? 'available' : 'unavailable',
          error: availability.error,
          httpStatus: availability.status,
          videoInfo: videoInfo.error ? undefined : {
            size: videoInfo.size,
            format: videoInfo.format
          }
        });
      }

      setResults(diagnosticResults);
      
      // Create summary
      const availableCount = diagnosticResults.filter(r => r.status === 'available').length;
      const totalCount = diagnosticResults.length;
      
      if (availableCount > 0) {
        setSummary(`✅ Найдено ${availableCount} рабочих URL из ${totalCount}. Видео должно загружаться!`);
      } else {
        setSummary(`❌ Все ${totalCount} URL недоступны. Проблема с авторизацией или файлы отсутствуют.`);
      }
    } catch (error) {
      console.error('Diagnostic error:', error);
      setSummary(`❌ Ошибка диагностики: ${error}`);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'checking': return '⏳';
      case 'available': return '✅';
      case 'unavailable': return '❌';
      case 'error': return '🚫';
      default: return '❓';
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'checking': return 'text-blue-600 bg-blue-50';
      case 'available': return 'text-green-600 bg-green-50';
      case 'unavailable': return 'text-red-600 bg-red-50';
      case 'error': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Неизвестно';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">
          🔧 Диагностика видео - Сегмент {segment.segment_number}
        </h3>
        {onClose && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-gray-600"
          >
            ✕ Закрыть
          </Button>
        )}
      </div>

      {/* Информация о сегменте */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Данные сегмента:</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Статус:</span> {segment.status}
          </div>
          <div>
            <span className="font-medium">video_url:</span> {segment.video_url || 'отсутствует'}
          </div>
          <div>
            <span className="font-medium">generated_video_url:</span> {segment.generated_video_url || 'отсутствует'}
          </div>
          <div>
            <span className="font-medium">urls.video_endpoint:</span> {segment.urls?.video_endpoint || 'отсутствует'}
          </div>
        </div>
      </div>

      {/* Кнопка запуска диагностики */}
      <div className="mb-6">
        <Button
          onClick={runDiagnostics}
          disabled={isChecking}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isChecking ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Проверка...</span>
            </div>
          ) : (
            '🚀 Запустить диагностику'
          )}
        </Button>
      </div>

      {/* Результаты диагностики */}
      {results.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-4">Результаты проверки URL:</h4>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{getStatusIcon(result.status)}</span>
                  <div className="flex-1">
                    <div className="font-mono text-sm break-all">
                      {result.url}
                    </div>
                    {result.error && (
                      <div className="text-sm mt-1 text-red-600">
                        Ошибка: {result.error}
                      </div>
                    )}
                    {result.httpStatus && (
                      <div className="text-sm mt-1 text-gray-600">
                        HTTP Status: {result.httpStatus}
                      </div>
                    )}
                    {result.videoInfo && (
                      <div className="text-sm mt-1 text-green-600">
                        Размер: {formatFileSize(result.videoInfo.size)} | 
                        Формат: {result.videoInfo.format || 'неизвестен'}
                      </div>
                    )}
                  </div>
                  {result.status === 'available' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(result.url, '_blank')}
                      className="text-blue-600"
                    >
                      🔗 Открыть
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Итоговый отчет */}
      {summary && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium mb-2">💡 Итог диагностики:</h4>
          <p className="text-sm text-blue-800">{summary}</p>
        </div>
      )}

      {/* Рекомендации */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium mb-2">🛠️ Возможные решения:</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Проверьте, авторизованы ли вы (access_token в localStorage)</li>
          <li>• Убедитесь, что видео файл действительно существует в bucket</li>
          <li>• Проверьте правильность настроек CORS для видео endpoints</li>
          <li>• Обратитесь к разработчику если все URL недоступны</li>
        </ul>
      </div>
    </Card>
  );
};

export default VideoDebugPanel; 