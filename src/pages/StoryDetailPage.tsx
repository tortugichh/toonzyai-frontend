import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';
import { useStory } from '@/hooks/useStories';
import { getErrorMessage } from '@/utils/errorHandler';
import type { StoryResult } from '@/services/api';
import HTMLFlipBook from 'react-pageflip';
import html2pdf from 'html2pdf.js';

function StoryDetailPage() {
  const { id: taskId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: storyData, isLoading, error } = useStory(taskId!);
  const logoutMutation = useLogout();
  
  const [showBook, setShowBook] = useState(false);

  // Show book when story is loaded
  useEffect(() => {
    if (storyData?.status === 'SUCCESS') {
      setTimeout(() => setShowBook(true), 400);
    } else {
      setShowBook(false);
    }
  }, [storyData]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <Header user={user} onLogout={handleLogout} isLoggingOut={logoutMutation.isPending} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mx-auto mb-6"></div>
            <div className="text-xl text-amber-700 font-semibold animate-pulse">Загрузка истории...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !storyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <Header user={user} onLogout={handleLogout} isLoggingOut={logoutMutation.isPending} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <svg className="w-16 h-16 text-red-500 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">История не найдена</h2>
            <p className="text-gray-600 mb-6">
              {error ? getErrorMessage(error) : 'История не существует или была удалена'}
            </p>
            <Button onClick={() => navigate('/stories')}>
              ← Вернуться к историям
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (storyData.status === 'PENDING' || storyData.status === 'STARTED' || storyData.status === 'RETRY') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <Header user={user} onLogout={handleLogout} isLoggingOut={logoutMutation.isPending} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/stories')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Назад к историям
            </Button>
          </div>
          
          <Card className="p-8 text-center bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">История генерируется</h2>
            <p className="text-gray-600 mb-6">
              Пожалуйста, подождите. Создание уникальной истории может занять несколько минут.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-700 text-sm">
                💡 Статус: {storyData.status === 'PENDING' ? 'В очереди' : 'Генерируется'}
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (storyData.status === 'FAILURE') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <Header user={user} onLogout={handleLogout} isLoggingOut={logoutMutation.isPending} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/stories')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Назад к историям
            </Button>
          </div>
          
          <Card className="p-8 text-center bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <svg className="w-16 h-16 text-red-500 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка генерации</h2>
            <p className="text-gray-600 mb-6">
              Произошла ошибка при создании истории. Попробуйте создать новую.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/stories')}>
                ← К историям
              </Button>
              <Button onClick={() => navigate('/stories')} className="bg-amber-600 hover:bg-amber-700 text-white">
                Создать новую историю
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Story is ready - show the book
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header user={user} onLogout={handleLogout} isLoggingOut={logoutMutation.isPending} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/stories')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Назад к историям
          </Button>
        </div>
        
        {showBook && storyData.status === 'SUCCESS' && (
          <StoryBook story={storyData} />
        )}
      </div>
    </div>
  );
}

// StoryBook component (restored original from StoryGeneratorPage)
function StoryBook({ story }: { story: StoryResult }) {
  const bookRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Универсальный парсинг мультиагентного результата
  const script: any = (story as any).script ?? story;
  const title = script.title ?? 'Generated Story';
  const scenes: any[] = script.scenes ?? [];
  const styleBlock = (story as any).style?.style ?? (story as any).style ?? null;
  const environmentsBlock = (story as any).environments?.environments ?? (story as any).environments ?? [];
  const charactersBlock = (story as any).characters;
  const characterList = Array.isArray(charactersBlock)
    ? charactersBlock
    : charactersBlock?.characters ?? [];
  
  // Парсинг иллюстраций
  const illustrationsBlock = (story as any).illustrations;
  const illustrationsList = Array.isArray(illustrationsBlock)
    ? illustrationsBlock
    : illustrationsBlock?.illustrations ?? [];
  
  // Создаем карту иллюстраций по scene_id для быстрого поиска
  const illustrationsMap = new Map();
  illustrationsList.forEach((ill: any) => {
    if (ill.scene_id && ill.image_url) {
      illustrationsMap.set(ill.scene_id, ill.image_url);
    }
  });

  // Функция для расширения текста сцен
  const expandSceneText = (originalText: string, sceneIndex: number, totalScenes: number): string => {
    if (!originalText || originalText.length < 50) {
      return originalText;
    }

    // Добавляем контекстные переходы и детали
    const transitions = [
      "Между тем", "Тем временем", "В это время", "Неожиданно", "Вдруг", 
      "Внезапно", "После этого", "Затем", "В следующий момент"
    ];
    
    const descriptiveWords = [
      "удивительный", "невероятный", "волшебный", "таинственный", "прекрасный",
      "загадочный", "интересный", "захватывающий", "необычный", "чудесный"
    ];

    let expandedText = originalText;

    // Добавляем переходы между сценами
    if (sceneIndex > 0 && Math.random() > 0.5) {
      const transition = transitions[Math.floor(Math.random() * transitions.length)];
      expandedText = `${transition}, ${expandedText.toLowerCase()}`;
    }

    // Добавляем описательные детали
    if (expandedText.length < 150) {
      const adjective = descriptiveWords[Math.floor(Math.random() * descriptiveWords.length)];
      expandedText += ` Это был поистине ${adjective} момент в истории.`;
    }

    // Добавляем эмоциональную глубину
    if (sceneIndex === totalScenes - 1) {
      expandedText += " История подходила к своему завершению, оставляя незабываемые воспоминания.";
    } else if (sceneIndex === 0) {
      expandedText = "Наша история начинается именно здесь. " + expandedText;
    }

    return expandedText;
  };

  // Функция для улучшения текста сцен в интерактивной книге
  const enhanceSceneText = (originalText: string, sceneIndex: number, totalScenes: number, pageNumber: number): string => {
    if (!originalText) return originalText;

    let enhancedText = originalText;

    // Добавляем вводные фразы для начала главы
    if (sceneIndex === 0 && pageNumber > 3) {
      const openings = [
        "В этой части нашей истории",
        "Продолжая рассказ",
        "Развитие событий привело к тому, что",
        "Далее происходило следующее:"
      ];
      const opening = openings[Math.floor(Math.random() * openings.length)];
      enhancedText = `${opening} ${enhancedText.toLowerCase()}`;
    }

    // Добавляем переходные элементы
    if (sceneIndex > 0) {
      const transitions = ["Тем временем", "После этого", "Затем", "В это время"];
      if (Math.random() > 0.6) {
        const transition = transitions[Math.floor(Math.random() * transitions.length)];
        enhancedText = `${transition}, ${enhancedText.toLowerCase()}`;
      }
    }

    // Добавляем заключительные элементы для последней сцены страницы
    if (sceneIndex === totalScenes - 1 && totalScenes > 1) {
      enhancedText += " И так история продолжалась дальше...";
    }

    return enhancedText;
  };

  // Функция скачивания PDF
  const downloadPDF = async () => {
    if (!bookRef.current) return;
    
    setIsDownloading(true);
    
    try {
      // Создаем временный контейнер с видимыми стилями
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '0';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm';
      tempDiv.style.zIndex = '-1000';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'Times New Roman, serif';
      tempDiv.style.color = '#2c2c2c';
      
      // Создаем простой HTML для PDF
      let pdfContent = '';
      
      // Титульная страница
      pdfContent += `
        <div style="page-break-after: always; padding: 50px; min-height: 280mm; text-align: center; display: flex; align-items: center; justify-content: center;">
          <div>
            <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 40px; text-transform: uppercase; letter-spacing: 4px; line-height: 1.2;">${title}</h1>
            <div style="font-size: 24px; color: #d4af37; margin: 30px 0; letter-spacing: 3px;">✦ ✦ ✦</div>
            <p style="font-size: 20px; font-style: italic; color: #666; margin-top: 50px;">Сказка, созданная ToonzyAI</p>
          </div>
        </div>
      `;
      
      // Страница персонажей
      if (characterList.length > 0) {
        pdfContent += `
          <div style="page-break-after: always; padding: 50px; min-height: 280mm;">
            <h2 style="font-size: 26px; font-weight: bold; text-align: center; margin-bottom: 40px; text-transform: uppercase; border-bottom: 2px solid #666; padding-bottom: 15px; letter-spacing: 2px;">ПЕРСОНАЖИ</h2>
            ${characterList.map((char: any) => `
              <div style="margin-bottom: 30px; font-size: 18px; border-bottom: 1px dotted #999; padding-bottom: 20px;">
                <div style="font-weight: bold; font-size: 22px; color: #333;">${char.name || 'Безымянный'}</div>
                ${char.role ? `<div style="font-style: italic; color: #666; font-size: 18px; margin-top: 5px;">— ${char.role}</div>` : ''}
                ${char.description ? `<div style="margin-top: 12px; font-style: italic; color: #555; line-height: 1.6; font-size: 16px;">${char.description}</div>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }
      
      // Основные страницы с расширенным текстом
      if (scenes.length > 0) {
        const contentPagesCount = 5;
        const scenesPerPage = Math.max(1, Math.ceil(scenes.length / contentPagesCount));
        
        for (let pageIndex = 0; pageIndex < contentPagesCount; pageIndex++) {
          const pageNum = pageIndex + (characterList.length > 0 ? 3 : 2);
          const sceneStartIndex = pageIndex * scenesPerPage;
          const sceneEndIndex = Math.min(sceneStartIndex + scenesPerPage, scenes.length);
          const pageScenes = scenes.slice(sceneStartIndex, sceneEndIndex);
          
          const isLastPage = pageIndex === contentPagesCount - 1;
          
          pdfContent += `
            <div style="page-break-after: ${isLastPage ? 'avoid' : 'always'}; padding: 50px; min-height: 280mm;">
              <h2 style="font-size: 22px; text-align: center; margin-bottom: 35px; color: #555; text-transform: uppercase; border-bottom: 2px solid #ddd; padding-bottom: 12px; letter-spacing: 2px;">ГЛАВА ${pageIndex + 1}</h2>
              ${pageScenes.length > 0 ? pageScenes.map((scene, sceneIndex) => {
                const sceneText = scene.description || scene.environment_description || '';
                // Расширяем текст для большего содержания
                const expandedText = expandSceneText(sceneText, sceneIndex, pageScenes.length);
                return `
                  <div style="margin-bottom: 40px;">
                    <p style="font-size: 16px; line-height: 1.9; text-align: justify; margin: 0 0 20px 0; text-indent: 30px; color: #333; font-family: 'Times New Roman', serif;">${expandedText}</p>
                    ${sceneIndex < pageScenes.length - 1 ? '<div style="text-align: center; margin: 30px 0; color: #999; font-size: 18px; letter-spacing: 4px;">• • •</div>' : ''}
                  </div>
                `;
               }).join('') : `
                 <div style="text-align: center; margin-top: 120px; font-style: italic; color: #666;">
                   ${pageNum === 8 ? '<div style="border-top: 2px solid #ddd; padding-top: 30px; margin-top: 60px;"><div style="font-size: 28px; font-weight: bold; color: #333; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 20px;">КОНЕЦ</div><div style="font-size: 18px; margin-top: 20px; color: #666;">Спасибо за чтение!</div></div>' : ''}
                 </div>
               `}
               <div style="position: absolute; bottom: 20px; right: 40px; font-size: 10px; color: #666;">[${pageNum}]</div>
             </div>
           `;
        }
      }
      
      tempDiv.innerHTML = pdfContent;
      document.body.appendChild(tempDiv);
      
      // Ждем немного для рендеринга
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Настройки для PDF
      const options = {
        margin: [10, 10, 10, 10],
        filename: `${title.replace(/[^a-zA-Z0-9\u0400-\u04FF\s]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: false,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait'
        }
      };
      
      await html2pdf().from(tempDiv).set(options).save();
      
      // Убираем временный элемент
      document.body.removeChild(tempDiv);
      
    } catch (error) {
      console.error('Ошибка при создании PDF:', error);
      alert('Произошла ошибка при создании PDF файла. Попробуйте еще раз.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Создаем книгу строго на 8 страниц
  const createBookPages = () => {
    const pages = [];

    // Страница 1: Титульная
    pages.push(
      <div key="title" className="w-full h-full bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col relative border border-amber-200 font-serif shadow-inner">
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="max-w-lg space-y-10">
            <h1 className="text-5xl font-bold text-gray-800 tracking-widest uppercase leading-tight">
              {title}
            </h1>
            <div className="text-3xl text-amber-600 font-light tracking-wider">
              ✦ ✦ ✦
            </div>
            <p className="text-2xl italic text-amber-700 mt-10">
              Сказка, созданная ToonzyAI
            </p>
          </div>
        </div>
        <div className="absolute bottom-6 right-8 text-lg text-amber-600">
          [1]
        </div>
      </div>
    );

    // Страница 2: Персонажи (если есть)
    if (characterList.length > 0) {
      pages.push(
        <div key="characters" className="w-full h-full bg-gradient-to-b from-blue-50 to-indigo-50 flex flex-col relative border border-blue-200 font-serif p-8">
          <div className="flex-1 overflow-hidden">
            <h2 className="text-4xl font-bold text-center mb-10 text-gray-800 uppercase tracking-wide border-b border-blue-300 pb-6">
              ПЕРСОНАЖИ
            </h2>
            <div className="space-y-8 mt-10">
              {characterList.map((char: any, idx: number) => (
                <div key={char.name || idx} className="border-b border-dotted border-blue-300 pb-8 last:border-b-0">
                  <div className="text-2xl font-bold text-gray-800">
                    {char.name || 'Безымянный'}
                    {char.role && <span className="text-xl italic text-blue-600 font-normal"> — {char.role}</span>}
                  </div>
                  {char.description && (
                    <div className="mt-4 text-xl text-gray-600 italic leading-relaxed">
                      {char.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-6 right-8 text-lg text-blue-600">
            [2]
          </div>
        </div>
      );

      // Страница 3: Пролог/Введение
      pages.push(
        <div key="prologue" className="w-full h-full bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col relative border border-purple-200 font-serif p-8">
          <div className="flex-1 overflow-hidden">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800 uppercase tracking-wide border-b border-purple-300 pb-6">
              ПРОЛОГ
            </h2>
            <div className="space-y-10 mt-12">
              <p className="text-2xl leading-relaxed text-gray-800 text-justify indent-10 font-serif">
                Наша история начинается в удивительном мире, где каждый день приносит новые открытия и приключения. 
                Здесь, среди знакомых и незнакомых мест, разворачиваются события, которые изменят всё навсегда.
              </p>
              <p className="text-2xl leading-relaxed text-gray-800 text-justify indent-10 font-serif">
                Это рассказ о храбрости и дружбе, о том, как важно верить в свои мечты и никогда не сдаваться. 
                Приготовьтесь к путешествию, полному удивительных открытий и неожиданных поворотов!
              </p>
            </div>
          </div>
          <div className="absolute bottom-6 right-8 text-lg text-purple-600">
            [3]
          </div>
        </div>
      );
    } else {
      // Если нет персонажей, страницы 2-3 для введения
      pages.push(
        <div key="intro1" className="w-full h-full bg-gradient-to-b from-blue-50 to-indigo-50 flex flex-col relative border border-blue-200 font-serif p-8">
          <div className="flex-1 overflow-hidden">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800 uppercase tracking-wide border-b border-blue-300 pb-6">
              ВВЕДЕНИЕ
            </h2>
            <div className="space-y-10 mt-12">
              <p className="text-2xl leading-relaxed text-gray-800 text-justify indent-10 font-serif">
                Добро пожаловать в мир удивительных историй, где фантазия не знает границ, 
                а каждое слово наполнено магией и чудесами.
              </p>
            </div>
          </div>
          <div className="absolute bottom-6 right-8 text-lg text-blue-600">
            [2]
          </div>
        </div>
      );

      pages.push(
        <div key="intro2" className="w-full h-full bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col relative border border-purple-200 font-serif p-8">
          <div className="flex-1 overflow-hidden">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800 uppercase tracking-wide border-b border-purple-300 pb-6">
              ГЛАВА ПЕРВАЯ
            </h2>
            <div className="space-y-10 mt-12">
              <p className="text-2xl leading-relaxed text-gray-800 text-justify indent-10 font-serif">
                История начинается здесь, в этом самом месте, в этот самый момент. 
                Приготовьтесь к невероятному путешествию...
              </p>
            </div>
          </div>
          <div className="absolute bottom-6 right-8 text-lg text-purple-600">
            [3]
          </div>
        </div>
      );
    }

    // Основной текст истории с иллюстрациями
    if (scenes.length > 0) {
      // Определяем количество страниц для основного текста
      const contentPagesCount = 5; // Страницы 4-8
      const startPageNumber = 4;
      
      // Создаем страницы, распределяя сцены с изображениями
      const scenesPerPage = Math.ceil(scenes.length / contentPagesCount);
      
      for (let pageIndex = 0; pageIndex < contentPagesCount; pageIndex++) {
        const pageNumber = startPageNumber + pageIndex; // Страницы 4-8
        const sceneStartIndex = pageIndex * scenesPerPage;
        const sceneEndIndex = Math.min(sceneStartIndex + scenesPerPage, scenes.length);
        const pageScenes = scenes.slice(sceneStartIndex, sceneEndIndex);
        
        if (pageScenes.length > 0) {
          pages.push(
            <div key={`page-${pageNumber}`} className="w-full h-full bg-gradient-to-b from-green-50 to-emerald-50 flex flex-col relative border border-green-200 font-serif p-6">
              <div className="flex-1 overflow-hidden">
                <h2 className="text-xl text-center mb-6 text-green-700 uppercase tracking-widest border-b border-green-300 pb-3">
                  {title.toUpperCase()}
                </h2>
                <div className="space-y-6 h-full overflow-hidden">
                  {pageScenes.map((scene, idx) => {
                    const sceneText = scene.description || scene.environment_description || '';
                    const imageUrl = illustrationsMap.get(scene.id);
                    const isFirstScene = idx === 0;
                    const isLastScene = idx === pageScenes.length - 1;
                    
                    // Расширяем текст для лучшего чтения
                    const enhancedText = enhanceSceneText(sceneText, idx, pageScenes.length, pageNumber);
                    
                    return (
                      <div key={scene.id} className="space-y-4">
                        {isFirstScene && pageNumber > 3 && (
                          <div className="border-b border-dotted border-green-300 pb-3 mb-4">
                            <h3 className="text-3xl font-bold text-center text-gray-800 uppercase tracking-wide">
                              Глава {pageNumber - 3}
                            </h3>
                          </div>
                        )}
                        {imageUrl && (
                          <div className="text-center mb-4">
                            <img 
                              src={imageUrl} 
                              alt={`Иллюстрация к сцене ${scene.id}`}
                              className="max-w-full h-64 w-auto mx-auto rounded-lg border border-green-300 shadow-lg object-cover"
                              onError={(e) => {
                                // Скрываем изображение если оно не загрузилось
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-2xl leading-relaxed text-gray-800 text-justify indent-10 font-serif mb-4">
                            {enhancedText}
                          </p>
                          {!isLastScene && pageScenes.length > 1 && (
                            <div className="text-center text-green-600 text-xl tracking-widest my-4">
                              • • •
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="absolute bottom-6 right-8 text-lg text-green-600">
                [{pageNumber}]
              </div>
            </div>
          );
        } else {
          // Пустая страница, если контента недостаточно
          pages.push(
            <div key={`page-${pageNumber}`} className="w-full h-full bg-gradient-to-b from-gray-50 to-slate-50 flex flex-col relative border border-gray-200 font-serif p-8">
              <div className="flex-1 overflow-hidden">
                <h2 className="text-xl text-center mb-10 text-gray-600 uppercase tracking-widest border-b border-gray-300 pb-4">
                  {title.toUpperCase()}
                </h2>
                <div className="flex-1 flex items-center justify-center">
                  {pageNumber === 8 ? (
                    <div className="text-center border-t border-gray-300 pt-10 mt-24">
                      <div className="text-4xl font-bold text-gray-800 uppercase tracking-wide mb-6">
                        КОНЕЦ
                      </div>
                      <div className="text-2xl text-gray-600 italic">
                        Спасибо за чтение!
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 italic text-2xl">
                      История продолжается...
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute bottom-6 right-8 text-lg text-gray-600">
                [{pageNumber}]
              </div>
            </div>
          );
        }
      }
    } else {
      // Если нет контента, заполняем оставшиеся страницы заглушками
      const startPage = characterList.length > 0 ? 4 : 4;
      for (let pageNumber = startPage; pageNumber <= 8; pageNumber++) {
        pages.push(
          <div key={`page-${pageNumber}`} className="w-full h-full bg-gradient-to-b from-yellow-50 to-orange-50 flex flex-col relative border border-yellow-200 font-serif p-8">
            <div className="flex-1 overflow-hidden">
              <h2 className="text-4xl font-bold text-center mb-12 text-gray-800 uppercase tracking-wide border-b border-yellow-300 pb-6">
                СОДЕРЖАНИЕ
              </h2>
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="space-y-8 text-yellow-700 italic">
                  <p className="text-2xl">История ещё не написана...</p>
                  <p className="text-xl">Попробуйте сгенерировать книгу с более подробным описанием.</p>
                  {pageNumber === 8 && (
                    <div className="mt-10 border-t border-yellow-300 pt-8">
                      <p className="text-3xl font-bold text-gray-800 not-italic uppercase">КОНЕЦ</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute bottom-6 right-8 text-lg text-yellow-600">
              [{pageNumber}]
            </div>
          </div>
        );
      }
    }

    return pages;
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-8">
      {/* Кнопка скачивания */}
      <div className="flex justify-center mb-8">
        <Button
          onClick={downloadPDF}
          disabled={isDownloading}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-medium shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 text-lg"
        >
          {isDownloading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              Создание PDF...
            </>
          ) : (
            <>
              📚 Скачать книгу PDF
            </>
          )}
        </Button>
      </div>

      {/* Книга */}
      <div ref={bookRef} className="flex justify-center my-8 transform-gpu perspective-1000 animate-fadeIn">
        <HTMLFlipBook
          width={600}
          height={750}
          minWidth={300}
          maxWidth={650}
          minHeight={400}
          maxHeight={800}
          className="filter drop-shadow-2xl rounded-xl overflow-hidden"
          style={{}}
          startPage={0}
          size="fixed"
          drawShadow={true}
          flippingTime={1200}
          useMouseEvents={true}
          showCover={false}
          mobileScrollSupport={true}
          usePortrait={false}
          startZIndex={1}
          autoSize={false}
          maxShadowOpacity={0.5}
          showPageCorners={true}
          disableFlipByClick={false}
          swipeDistance={30}
          clickEventForward={true}
        >
          {createBookPages()}
        </HTMLFlipBook>
      </div>
    </div>
  );
}

export default StoryDetailPage; 