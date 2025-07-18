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
  const [isExpanded, setIsExpanded] = useState(false);

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
        setSummary(`✅ Found ${availableCount} working URLs out of ${totalCount}. Video should load!`);
      } else {
        setSummary(`❌ All ${totalCount} URLs are unavailable. Authentication problem or files missing.`);
      }
    } catch (error) {
      console.error('Diagnostic error:', error);
      setSummary(`❌ Diagnostic error: ${error}`);
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

  const getSegmentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'assembling': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Video Debug Info</h3>
        <Button 
          onClick={() => setIsExpanded(!isExpanded)} 
          variant="outline" 
          size="sm"
        >
          {isExpanded ? 'Hide' : 'Show'} Details
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`text-sm font-medium ${getSegmentStatusColor(segment.status)}`}>
            {getStatusText(segment.status)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Segment:</span>
          <span className="text-sm font-medium">{segment.segment_number}</span>
        </div>
        
        {segment.video_url && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Video URL:</span>
            <span className="text-sm font-mono text-blue-600 truncate max-w-xs">
              {segment.video_url}
            </span>
          </div>
        )}
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium mb-2">Raw Data:</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(segment, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
};

export default VideoDebugPanel; 