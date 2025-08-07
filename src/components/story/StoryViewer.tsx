import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { StoryStatusResponse, StoryResult } from '@/services/api';
import HTMLFlipBook from 'react-pageflip';

interface StoryViewerProps {
  story: StoryStatusResponse;
  onBack?: () => void;
}

export function StoryViewer({ story, onBack }: StoryViewerProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [story]);

  if (!story) {
    return null;
  }

  const status = story.status.toLowerCase();

  // For completed stories, show content immediately
  if (status === 'success' || status === 'completed') {
    // Type guard to check if story has script property
    const storyWithScript = story as StoryStatusResponse & StoryResult;
    
    return (
      <div className="max-w-4xl mx-auto p-4">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="mb-6"
          >
            ← Back to Stories
          </Button>
        )}
        
        <div className="bg-white rounded-lg shadow-card p-6">
          <h1 className="text-2xl font-bold mb-4">{storyWithScript.title || 'Generated Story'}</h1>
          
          {storyWithScript.scenes && storyWithScript.scenes.length > 0 && (
            <div className="flex justify-center mt-8">
              <HTMLFlipBook 
                width={550}
                height={733}
                size="stretch"
                minWidth={315}
                maxWidth={1000}
                minHeight={400}
                maxHeight={1533}
                maxShadowOpacity={0.5}
                showCover={true}
                className="story-book"
                style={{}}
                startPage={0}
                drawShadow={true}
                flippingTime={1200}
                useMouseEvents={true}
                mobileScrollSupport={true}
                usePortrait={false}
                startZIndex={1}
                autoSize={false}
                showPageCorners={true}
                disableFlipByClick={false}
                swipeDistance={30}
                clickEventForward={true}
              >
                {storyWithScript.scenes.map((scene, index) => (
                  <div key={index} className="story-page">
                    <div className="page-content">
                      <h3 className="text-xl font-semibold mb-4">Scene {index + 1}</h3>
                      <p className="text-gray-700">{scene.description}</p>
                    </div>
                  </div>
                ))}
              </HTMLFlipBook>
            </div>
          )}
        </div>
      </div>
    );
  }

  // For failed stories
  if (status === 'failure' || status === 'failed') {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-xl mb-4">❌</div>
        <p className="text-red-600 mb-4">Story generation failed. Please try again.</p>
        {story.error && (
          <p className="text-sm text-red-500">{story.error}</p>
        )}
        {onBack && (
          <Button onClick={onBack} variant="outline" className="mt-4">
            ← Back to Stories
          </Button>
        )}
      </div>
    );
  }

  // For in-queue or pending stories
  return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-light mx-auto mb-4"></div>
      <p className="text-gray-600">Please wait. It can take several minutes to create a unique story.</p>
      {onBack && (
        <Button onClick={onBack} variant="outline" className="mt-4">
          ← Back to Stories
        </Button>
      )}
    </div>
  );
}
