import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import VideoPreview from './VideoPreview';
import VideoDebugPanel from './VideoDebugPanel';
import { findWorkingVideoUrl, getSegmentVideoUrls } from '../../utils/videoUtils';
import { toastError } from '@/utils/toast';

const VideoTestComponent: React.FC = () => {
  const [testProjectId, setTestProjectId] = useState('');
  const [testSegmentNumber, setTestSegmentNumber] = useState(1);
  const [testResults, setTestResults] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  const runVideoTest = async () => {
    if (!testProjectId) {
      toastError('Please enter a project ID');
      return;
    }

    try {
      console.log(`🧪 Testing video for project ${testProjectId}, segment ${testSegmentNumber}`);
      
      // Get available URLs
      const urls = getSegmentVideoUrls(testProjectId, testSegmentNumber);
      console.log('Available URLs:', urls);

      // Try to find working URL
      const result = await findWorkingVideoUrl(testProjectId, testSegmentNumber);
      
      setTestResults({
        urls,
        workingUrl: result.url,
        checkedUrls: result.checkedUrls,
        success: !!result.url
      });

    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
  };

  const mockSegment = testProjectId ? {
    id: `${testProjectId}-segment-${testSegmentNumber}`,
    segment_number: testSegmentNumber,
    status: 'COMPLETED' as const,
    segment_prompt: 'Test segment',
    start_frame_url: '',
    generated_video_url: null,
    video_url: `/api/v1/animations/${testProjectId}/segments/${testSegmentNumber}/video`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } : undefined;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">🧪 Video Testing Tool</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project ID:</label>
            <Input
              value={testProjectId}
              onChange={(e) => setTestProjectId(e.target.value)}
              placeholder="Enter project ID..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Segment Number:</label>
            <Input
              type="number"
              value={testSegmentNumber}
              onChange={(e) => setTestSegmentNumber(parseInt(e.target.value) || 1)}
              min={1}
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button onClick={runVideoTest} disabled={!testProjectId}>
            🔍 Test Video URLs
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowDebug(!showDebug)}
            disabled={!testProjectId}
          >
            {showDebug ? 'Hide' : 'Show'} Debug Panel
          </Button>
        </div>

        {testResults && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </Card>

      {testProjectId && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Video Preview Test</h3>
                     <VideoPreview
             projectId={testProjectId}
             segmentNumber={testSegmentNumber}
             segment={mockSegment as any}
             title={`Test - Segment ${testSegmentNumber}`}
             className="max-w-md"
             onError={(error) => console.error('Video preview error:', error)}
           />
        </Card>
      )}

             {showDebug && mockSegment && (
         <VideoDebugPanel
           projectId={testProjectId}
           segment={mockSegment as any}
           onClose={() => setShowDebug(false)}
         />
       )}
    </div>
  );
};

export default VideoTestComponent; 