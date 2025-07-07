import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createStory, getStoryStatus, createAnimationProject, assembleVideo } from '@/services/storyApi';
import { apiClient } from '@/services/api';
import type { StoryStatusResponse, StoryResult, StoryCharacter } from '@/services/api';
import { getErrorMessage } from '@/utils/errorHandler';
import type { AnimationSegment } from '@/services/storyApi';
import { SegmentEditor } from '@/components/common/SegmentEditor';
import { useAnimationProject, useProjectProgressWS, useAssembleVideo } from '@/hooks/useAnimations';

const POLLING_INTERVAL = 3000; // 3 seconds

export function StoryGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<StoryResult | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);

  const pollStatus = async (taskId: string) => {
    try {
      const result = await getStoryStatus(taskId);
      if (result.status === 'SUCCESS') {
        setStory(result);
        setIsLoading(false);
        setError(null);
        alert('Story generated successfully!');
      } else if (result.status === 'PENDING' || result.status === 'RETRY') {
        setTimeout(() => pollStatus(taskId), POLLING_INTERVAL);
      } else {
        const errorMessage = result.error || 'Failed to generate story.';
        setError(errorMessage);
        setIsLoading(false);
        alert(`Error: ${errorMessage}`);
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setIsLoading(false);
      alert(`Polling Error: ${errorMessage}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setIsLoading(true);
    setError(null);
    setStory(null);

    try {
      const { task_id } = await createStory(prompt);
      console.log(`Task started with ID: ${task_id}`);
      pollStatus(task_id);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setIsLoading(false);
      alert(`Submission Error: ${errorMessage}`);
    }
  };

  const startVideoGeneration = async () => {
    if (!story) return;
    const scenes: any[] = (story as any).script?.scenes ?? story.scenes ?? [];
    const envs: any[] = (story as any).environments?.environments ?? (story as any).environments ?? [];
    const total = scenes.length;

    // Fetch user's avatars to obtain a valid source_avatar_id
    try {
      let avatarId: string;

      // Fetch first page of avatars
      const avatarResp = await apiClient.getAvatars(1, 1);

      if (!avatarResp.avatars || avatarResp.avatars.length === 0) {
        // No avatars – create one automatically
        const createPrompt = 'A friendly realistic human avatar portrait';
        const newAvatar = await apiClient.createAvatar(createPrompt);
        avatarId = newAvatar.avatar_id;

        // Wait until avatar generation is completed
        let attempts = 0;
        const maxAttempts = 30; // ~2 minutes (30 * 4s)
        while (attempts < maxAttempts) {
          const avatarDetails = await apiClient.getAvatar(avatarId);
          if (avatarDetails.status === 'completed') {
            break;
          }
          await new Promise((res) => setTimeout(res, 4000));
          attempts += 1;
        }

        if (attempts === maxAttempts) {
          alert('Avatar generation is taking too long. Please try again later.');
          return;
        }
      } else {
        avatarId = avatarResp.avatars[0].avatar_id;
      }

      const proj = await createAnimationProject({
        name: story.title ?? 'Story Project',
        source_avatar_id: avatarId,
        total_segments: total,
        animation_prompt: prompt,
      });
      setProjectId(proj.id);

      // Segments will be created asynchronously by backend. We now rely on SegmentEditor UI for individual generation.
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      alert(`Error starting video generation: ${errorMessage}`);
    }
  };

  // ===== Animation Project hooks =====
  const { data: projectData, refetch: refetchProject } = useAnimationProject(projectId ?? '');

  useProjectProgressWS(projectId ?? undefined);

  const assembleMutation = useAssembleVideo();

  const handleAssemble = async () => {
    if (!projectId) return;
    try {
      await assembleMutation.mutateAsync(projectId);
      // poll until final video available
      const intervalId = setInterval(async () => {
        const updated = await refetchProject();
        if (updated.data?.final_video_url) {
          setFinalUrl(updated.data.final_video_url);
          clearInterval(intervalId);
        }
      }, 5000);
    } catch (e: any) {
      alert(e.message || 'Ошибка сборки видео');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Story Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Enter a prompt for your story..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Story'}
            </Button>
          </form>

          {error && <p className="text-red-500 mt-4">{error}</p>}

          {story && (() => {
            const script: any = (story as any).script ?? story;
            const title = script.title ?? 'Generated Story';
            const scenes: any[] = script.scenes ?? [];
            const styleSummary = (story as any).style?.style?.summary ?? (story as any).style?.summary ?? '';
            const charactersBlock = (story as any).characters;
            const characterList = Array.isArray(charactersBlock)
              ? charactersBlock
              : charactersBlock?.characters ?? [];
            const environmentsBlock = (story as any).environments;
            const environmentList = Array.isArray(environmentsBlock)
              ? environmentsBlock
              : environmentsBlock?.environments ?? [];
            return (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold">Style Summary</h3>
                      <p>{styleSummary}</p>
                    </div>
                    <div>
                      <h3 className="font-bold">Scenes</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {scenes.map((scene) => (
                          <li key={scene.id || scene.scene_id}>{scene.description || scene.environment_description || JSON.stringify(scene)}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-bold">Characters</h3>
                      {(() => {
                        const typedList = characterList as StoryCharacter[];
                        return (
                          <ul className="list-disc pl-5 space-y-2">
                            {typedList.map((char, idx) => (
                              <li key={char.name || idx}>
                                <strong>{char.name}:</strong> {char.description || '—'} {char.attire ? `(${char.attire})` : ''}
                              </li>
                            ))}
                          </ul>
                        );
                      })()}
                    </div>
                    {environmentList.length > 0 && (
                      <div>
                        <h3 className="font-bold">Environments</h3>
                        <ul className="list-disc pl-5 space-y-2">
                          {environmentList.map((env: any, idx: number) => (
                            <li key={env.scene_id || idx}>{env.environment_description || JSON.stringify(env)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <details className="mt-4">
                      <summary className="cursor-pointer font-medium text-sm text-gray-600">Raw JSON</summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded max-h-96 overflow-auto">
                        {JSON.stringify(story, null, 2)}
                      </pre>
                    </details>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {story && !projectId && (
            <Button className="mt-4" onClick={startVideoGeneration}>Generate Video</Button>
          )}

          {projectData && (
            <div className="mt-6 space-y-4">
              <h3 className="font-bold text-lg">Сегменты видео</h3>
              {projectData.segments.map((seg: any) => (
                <SegmentEditor 
                  key={seg.segment_number}
                  projectId={projectId!}
                  segment={seg}
                  onUpdate={refetchProject}
                />
              ))}

              {/* Assemble */}
              {projectData.segments.length > 0 && projectData.segments.every((s: any) => s.status === 'completed') && !finalUrl && (
                <Button onClick={handleAssemble} className="mt-4">📽️ Собрать финальное видео</Button>
              )}

              {finalUrl && (
                <div className="mt-4">
                  <h3 className="font-bold">Финальное видео</h3>
                  <video src={finalUrl} controls className="w-full" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Export default for convenience along with named export
export default StoryGeneratorPage; 