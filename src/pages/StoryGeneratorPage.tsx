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
import { useCurrentUser } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
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
  // Универсальный парсинг мультиагентного результата
  const script: any = story.script ?? story;
  const title = script.title ?? 'Generated Story';
  const scenes: any[] = script.scenes ?? [];
  const styleBlock = story.style?.style ?? story.style ?? null;
  const environmentsBlock = story.environments?.environments ?? story.environments ?? [];
  const charactersBlock = story.characters;
  const characterList = Array.isArray(charactersBlock)
    ? charactersBlock
    : charactersBlock?.characters ?? [];

  // Собираем страницы книги в массив
  const pages = [
    // Обложка
    <div key="cover" className="storybook-page flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-300 p-8 border-4 border-yellow-400 rounded-lg shadow-inner relative">
      <h1 className="text-4xl font-extrabold mb-4 text-yellow-900 drop-shadow-lg fancy-title">{title}</h1>
      <div className="w-40 h-40 bg-gray-200 rounded mb-4 flex items-center justify-center text-gray-400 border-2 border-yellow-300">Плейсхолдер обложки</div>
      <div className="text-lg text-yellow-800 italic">Сказка, сгенерированная ToonzyAI</div>
      <div className="absolute bottom-2 right-4 text-xs text-yellow-700 opacity-60">Обложка</div>
    </div>,
    // Страница с персонажами
    <div key="chars" className="storybook-page bg-gradient-to-br from-blue-50 to-blue-200 p-8 border-4 border-blue-300 rounded-lg shadow-inner relative">
      <h2 className="text-2xl font-bold mb-4 text-blue-900 fancy-title">Персонажи</h2>
      <ul className="space-y-2">
        {characterList.length === 0 && <li className="text-gray-500">Нет персонажей</li>}
        {characterList.map((char: any, idx: number) => (
          <li key={char.name || idx} className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 border-2 border-blue-200">
              <span role="img" aria-label="avatar">👤</span>
            </div>
            <div>
              <div className="font-bold text-blue-800">{char.name || 'Без имени'}</div>
              <div className="text-sm text-blue-700">{char.description || '—'} {char.attire ? `(${char.attire})` : ''}</div>
              {char.role && <div className="text-xs text-blue-500">Роль: {char.role}</div>}
            </div>
          </li>
        ))}
      </ul>
      <div className="absolute bottom-2 right-4 text-xs text-blue-700 opacity-60">Стр. 2</div>
    </div>,
    // Страница со стилем (если есть)
    styleBlock && (
      <div key="style" className="storybook-page bg-gradient-to-br from-pink-50 to-pink-200 p-8 border-4 border-pink-300 rounded-lg shadow-inner relative">
        <h2 className="text-2xl font-bold mb-4 text-pink-900 fancy-title">Визуальный стиль</h2>
        <div className="mb-2"><b>Описание:</b> {styleBlock.summary}</div>
        <div className="mb-2"><b>Ключевые слова:</b> {styleBlock.positive_keywords}</div>
        <div className="mb-2"><b>Избегать:</b> {styleBlock.negative_keywords}</div>
        <div className="absolute bottom-2 right-4 text-xs text-pink-700 opacity-60">Стиль</div>
      </div>
    ),
    // Страницы-сцены или страница "Нет сцен"
    ...(scenes.length === 0
      ? [<div key="no-scenes" className="storybook-page bg-gradient-to-br from-white to-yellow-50 p-8 border-4 border-yellow-200 rounded-lg shadow-inner flex flex-col justify-center items-center relative">
          <div className="text-lg text-gray-500">Нет сцен для отображения</div>
        </div>]
      : scenes.map((scene: any, idx: number) => (
          <div key={scene.id || scene.scene_id || idx} className="storybook-page bg-gradient-to-br from-white to-yellow-50 p-8 border-4 border-yellow-200 rounded-lg shadow-inner flex flex-col justify-between relative">
            <div>
              <div className="w-full h-48 bg-gray-100 rounded mb-4 flex items-center justify-center text-gray-400 border-2 border-yellow-100">Плейсхолдер для картинки</div>
              <div className="text-lg text-gray-800 whitespace-pre-line fancy-text">{scene.description || scene.environment_description || JSON.stringify(scene)}</div>
              {environmentsBlock && environmentsBlock[idx] && environmentsBlock[idx].environment_description && (
                <div className="text-sm text-green-700 mt-2">Окружение: {environmentsBlock[idx].environment_description}</div>
              )}
            </div>
            <div className="absolute bottom-2 right-4 text-xs text-yellow-700 opacity-60">Стр. {idx + 3 + (styleBlock ? 1 : 0)}</div>
          </div>
        ))
    ),
    // Концовка
    <div key="end" className="storybook-page flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-green-200 p-8 border-4 border-green-300 rounded-lg shadow-inner relative">
      <h2 className="text-2xl font-bold mb-4 text-green-900 fancy-title">Конец</h2>
      <div className="w-32 h-32 bg-gray-200 rounded mb-4 flex items-center justify-center text-gray-400 border-2 border-green-200">Плейсхолдер</div>
      <div className="text-lg text-green-800">Спасибо за чтение!</div>
      <div className="absolute bottom-2 right-4 text-xs text-green-700 opacity-60">Конец</div>
    </div>
  ].filter(Boolean); // убираем null/undefined

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
        {pages}
      </HTMLFlipBook>
    </div>
  );
}

export function StoryGeneratorPage() {
  const { data: user, isLoading } = useCurrentUser();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<StoryResult | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [showBook, setShowBook] = useState(false);

  // Новые состояния для структурированных полей
  const [genre, setGenre] = useState('');
  const [style, setStyle] = useState('');
  const [theme, setTheme] = useState('');
  const [bookStyle, setBookStyle] = useState('');
  const [wishes, setWishes] = useState('');
  const [characters, setCharacters] = useState<Array<{ name: string; description?: string; role?: string }>>([
    { name: '', description: '', role: '' },
  ]);

  useEffect(() => {
    if (story) {
      setTimeout(() => setShowBook(true), 400); // плавное появление
    } else {
      setShowBook(false);
    }
  }, [story]);

  if (isLoading) {
    return <Loader text="Проверка авторизации..." />;
  }
  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-xl mx-auto mt-16">
          <CardHeader>
            <CardTitle>Требуется авторизация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-3xl text-amber-500 border border-amber-200 mb-2">🔒</div>
              <div className="text-lg text-amber-800 mb-2 text-center">Чтобы сгенерировать книгу, пожалуйста, войдите в свой аккаунт</div>
              <Button onClick={() => navigate('/login')} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded">Войти</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pollStatus = async (taskId: string) => {
    try {
      const result = await getStoryStatus(taskId);
      if (result.status === 'SUCCESS') {
        setStory(result);
        setIsGenerating(false);
        setError(null);
        // alert('Story generated successfully!'); // Удалено
      } else if (result.status === 'PENDING' || result.status === 'RETRY') {
        setTimeout(() => pollStatus(taskId), POLLING_INTERVAL);
      } else {
        const errorMessage = result.error || 'Failed to generate story.';
        setError(errorMessage);
        setIsGenerating(false);
        // alert(`Error: ${errorMessage}`); // Удалено
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setIsGenerating(false);
      // alert(`Polling Error: ${errorMessage}`); // Удалено
    }
  };

  const handleCharacterChange = (idx: number, field: string, value: string) => {
    setCharacters((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };
  const addCharacter = () => setCharacters((prev) => [...prev, { name: '', description: '', role: '' }]);
  const removeCharacter = (idx: number) => setCharacters((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Собираем объект запроса
    const req = {
      prompt,
      genre,
      style,
      theme,
      book_style: bookStyle,
      wishes,
      characters: characters.filter((c) => c.name.trim()),
    };
    setIsGenerating(true);
    setError(null);
    setStory(null);
    try {
      const { task_id } = await createStory(req);
      console.log(`Task started with ID: ${task_id}`);
      pollStatus(task_id);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setIsGenerating(false);
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
      <Header user={user} onLogout={() => {}} />
      <div className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Создать интерактивную книгу</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <ErrorBlock message={error} />}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Краткий сюжет или идея (prompt)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
              />
              <Input
                placeholder="Жанр (например, сказка, sci-fi)"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              />
              <Input
                placeholder="Стиль или настроение (магический, весёлый, ... )"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              />
              <Input
                placeholder="Тема (дружба, приключения, ... )"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              />
              <Input
                placeholder="Визуальный стиль книги (яркая, винтажная, ... )"
                value={bookStyle}
                onChange={(e) => setBookStyle(e.target.value)}
              />
              <Input
                placeholder="Особые пожелания (опционально)"
                value={wishes}
                onChange={(e) => setWishes(e.target.value)}
              />
              <div>
                <div className="font-semibold mb-2">Персонажи:</div>
                {characters.map((char, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <Input
                      placeholder="Имя персонажа"
                      value={char.name}
                      onChange={(e) => handleCharacterChange(idx, 'name', e.target.value)}
                      className="w-32"
                    />
                    <Input
                      placeholder="Описание"
                      value={char.description}
                      onChange={(e) => handleCharacterChange(idx, 'description', e.target.value)}
                      className="w-48"
                    />
                    <Input
                      placeholder="Роль (главный, друг...)"
                      value={char.role}
                      onChange={(e) => handleCharacterChange(idx, 'role', e.target.value)}
                      className="w-32"
                    />
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeCharacter(idx)} disabled={characters.length === 1}>–</Button>
                  </div>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={addCharacter}>+ Добавить персонажа</Button>
              </div>
              <Button type="submit" disabled={isGenerating} className="w-full">Сгенерировать книгу</Button>
            </form>
            {/* Простой вывод результата */}
            {isGenerating && <Loader text="Генерируем книгу..." />}
            {story && <StoryBook story={story} />}
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