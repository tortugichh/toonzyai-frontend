import { useState, useEffect } from 'react';
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
import { Header } from '@/components/layout/Header';
import HTMLFlipBook from 'react-pageflip';

const POLLING_INTERVAL = 3000; // 3 seconds

function Loader({ text = 'Генерируем книгу...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-6"></div>
      <div className="text-xl text-blue-700 font-semibold animate-pulse">{text}</div>
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4 text-center">
      {message}
    </div>
  );
}

function StoryBook({ story }: { story: any }) {
  const script: any = story.script ?? story;
  const title = script.title ?? 'Generated Story';
  const scenes: any[] = script.scenes ?? [];
  const charactersBlock = story.characters;
  const characterList = Array.isArray(charactersBlock)
    ? charactersBlock
    : charactersBlock?.characters ?? [];

  return (
    <div className="storybook-container flex justify-center my-8 fade-in">
      <HTMLFlipBook
        width={400}
        height={600}
        minWidth={300}
        maxWidth={600}
        minHeight={400}
        maxHeight={800}
        className="storybook-flipbook shadow-2xl rounded-lg"
        style={{}}
        startPage={0}
        size="fixed"
        drawShadow={true}
        flippingTime={600}
        useMouseEvents={true}
        showCover={true}
        mobileScrollSupport={true}
        usePortrait={true}
        startZIndex={1}
        autoSize={false}
        maxShadowOpacity={0.5}
        showPageCorners={true}
        disableFlipByClick={false}
        swipeDistance={30}
        clickEventForward={true}
      >
        {/* Обложка */}
        <div className="storybook-page flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-300 p-8 border-4 border-yellow-400 rounded-lg shadow-inner relative">
          <h1 className="text-4xl font-extrabold mb-4 text-yellow-900 drop-shadow-lg fancy-title">{title}</h1>
          <div className="w-40 h-40 bg-gray-200 rounded mb-4 flex items-center justify-center text-gray-400 border-2 border-yellow-300">Плейсхолдер обложки</div>
          <div className="text-lg text-yellow-800 italic">Сказка, сгенерированная ToonzyAI</div>
          <div className="absolute bottom-2 right-4 text-xs text-yellow-700 opacity-60">Обложка</div>
        </div>
        {/* Страница с персонажами */}
        <div className="storybook-page bg-gradient-to-br from-blue-50 to-blue-200 p-8 border-4 border-blue-300 rounded-lg shadow-inner relative">
          <h2 className="text-2xl font-bold mb-4 text-blue-900 fancy-title">Персонажи</h2>
          <ul className="space-y-2">
            {characterList.length === 0 && <li className="text-gray-500">Нет персонажей</li>}
            {characterList.map((char: any, idx: number) => (
              <li key={char.name || idx} className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 border-2 border-blue-200">IMG</div>
                <div>
                  <div className="font-bold text-blue-800">{char.name}</div>
                  <div className="text-sm text-blue-700">{char.description || '—'} {char.attire ? `(${char.attire})` : ''}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="absolute bottom-2 right-4 text-xs text-blue-700 opacity-60">Стр. 2</div>
        </div>
        {/* Страницы-сцены */}
        {scenes.map((scene: any, idx: number) => (
          <div key={scene.id || scene.scene_id || idx} className="storybook-page bg-gradient-to-br from-white to-yellow-50 p-8 border-4 border-yellow-200 rounded-lg shadow-inner flex flex-col justify-between relative">
            <div>
              <div className="w-full h-48 bg-gray-100 rounded mb-4 flex items-center justify-center text-gray-400 border-2 border-yellow-100">Плейсхолдер для картинки</div>
              <div className="text-lg text-gray-800 whitespace-pre-line fancy-text">{scene.description || scene.environment_description || JSON.stringify(scene)}</div>
            </div>
            <div className="absolute bottom-2 right-4 text-xs text-yellow-700 opacity-60">Стр. {idx + 3}</div>
          </div>
        ))}
        {/* Концовка */}
        <div className="storybook-page flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-green-200 p-8 border-4 border-green-300 rounded-lg shadow-inner relative">
          <h2 className="text-2xl font-bold mb-4 text-green-900 fancy-title">Конец</h2>
          <div className="w-32 h-32 bg-gray-200 rounded mb-4 flex items-center justify-center text-gray-400 border-2 border-green-200">Плейсхолдер</div>
          <div className="text-lg text-green-800">Спасибо за чтение!</div>
          <div className="absolute bottom-2 right-4 text-xs text-green-700 opacity-60">Конец</div>
        </div>
      </HTMLFlipBook>
    </div>
  );
}

export function StoryGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<StoryResult | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [showBook, setShowBook] = useState(false);

  useEffect(() => {
    if (story) {
      setTimeout(() => setShowBook(true), 400); // плавное появление
    } else {
      setShowBook(false);
    }
  }, [story]);

  const pollStatus = async (taskId: string) => {
    try {
      const result = await getStoryStatus(taskId);
      if (result.status === 'SUCCESS') {
        setStory(result);
        setIsLoading(false);
        setError(null);
        // alert('Story generated successfully!'); // Удалено
      } else if (result.status === 'PENDING' || result.status === 'RETRY') {
        setTimeout(() => pollStatus(taskId), POLLING_INTERVAL);
      } else {
        const errorMessage = result.error || 'Failed to generate story.';
        setError(errorMessage);
        setIsLoading(false);
        // alert(`Error: ${errorMessage}`); // Удалено
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setIsLoading(false);
      // alert(`Polling Error: ${errorMessage}`); // Удалено
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
      // alert(`Submission Error: ${errorMessage}`); // Удалено
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
          // alert('Avatar generation is taking too long. Please try again later.'); // Удалено
          setError('Avatar generation is taking too long. Please try again later.');
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
      // alert(`Error starting video generation: ${errorMessage}`); // Удалено
      setError(`Error starting video generation: ${errorMessage}`);
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
      // alert(e.message || 'Ошибка сборки видео'); // Удалено
      setError(e.message || 'Ошибка сборки видео');
    }
  };

  return (
    <>
      <Header user={undefined} onLogout={() => {}} />
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
                {isLoading ? 'Генерируем...' : 'Сгенерировать историю'}
              </Button>
            </form>

            {error && <ErrorBlock message={error} />}

            {isLoading && <Loader text="Генерируем книгу..." />}

            {story && showBook && (
              <StoryBook story={story} />
            )}

            {story && !projectId && !isLoading && (
              <Button className="mt-4" onClick={startVideoGeneration}>Сгенерировать видео</Button>
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
      <style>{`
        .storybook-page {
          font-family: 'Georgia', 'Times New Roman', serif;
          box-shadow: 0 2px 12px 0 rgba(0,0,0,0.08);
          transition: box-shadow 0.3s;
        }
        .storybook-page .fancy-title {
          font-family: 'Caveat', 'Pacifico', cursive;
          letter-spacing: 1px;
        }
        .storybook-page .fancy-text {
          font-size: 1.15rem;
          line-height: 1.7;
        }
        .storybook-flipbook {
          background: repeating-linear-gradient(135deg, #f9f6f2 0 10px, #f3e9d2 10px 20px);
        }
        .fade-in {
          animation: fadeInBook 0.7s ease;
        }
        @keyframes fadeInBook {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </>
  );
}

// Export default for convenience along with named export
export default StoryGeneratorPage; 