import { useState, useEffect, useRef } from 'react';
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
import html2pdf from 'html2pdf.js';
import { useStories, useStory, type StoryItem } from '@/hooks/useStories';
import { StoryCard } from '@/components/common/StoryCard';

const POLLING_INTERVAL = 3000; // 3 seconds

// Типы для квиза
interface QuizData {
  prompt: string;
  genre: string;
  style: string;
  theme: string;
  bookStyle: string;
  characters: Array<{ name: string; description?: string; role?: string }>;
  wishes: string;
}

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

// Прогресс-бар для квиза
function QuizProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>Шаг {currentStep} из {totalSteps}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

// Шаг 1: Основная идея
function Step1({ data, onUpdate, onNext }: { 
  data: string; 
  onUpdate: (value: string) => void; 
  onNext: () => void; 
}) {
  const [value, setValue] = useState(data);

  const handleNext = () => {
    if (value.trim()) {
      onUpdate(value);
      onNext();
    }
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">📖 Основная идея истории</h2>
        <p className="text-gray-600 text-sm md:text-base">Расскажите, о чём будет ваша книга? Опишите основной сюжет или идею.</p>
      </div>
      
      <div className="space-y-4">
        <textarea
          placeholder="Например: Мальчик нашёл волшебную лампу и отправился в удивительное путешествие..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        
        <div className="flex justify-end">
          <Button 
            onClick={handleNext}
            disabled={!value.trim()}
            className="px-8 py-2"
          >
            Далее →
          </Button>
        </div>
      </div>
    </div>
  );
}

// Шаг 2: Жанр и стиль
function Step2({ data, onUpdate, onNext, onBack }: { 
  data: { genre: string; style: string }; 
  onUpdate: (data: { genre: string; style: string }) => void; 
  onNext: () => void;
  onBack: () => void;
}) {
  const [genre, setGenre] = useState(data.genre);
  const [style, setStyle] = useState(data.style);

  const genres = ['Сказка', 'Приключения', 'Фантастика', 'Детектив', 'Комедия', 'Драма', 'Фэнтези'];
  const styles = ['Весёлый', 'Магический', 'Загадочный', 'Романтический', 'Динамичный', 'Спокойный', 'Эпический'];

  const handleNext = () => {
    onUpdate({ genre, style });
    onNext();
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">🎭 Жанр и стиль</h2>
        <p className="text-gray-600 text-sm md:text-base">Выберите жанр и стиль для вашей истории</p>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Жанр:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {genres.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenre(g)}
                className={`p-2 md:p-3 border rounded-lg text-xs md:text-sm transition-all w-full ${
                  genre === g 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <Input
            placeholder="Или введите свой жанр..."
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="mt-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Стиль:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {styles.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                className={`p-2 md:p-3 border rounded-lg text-xs md:text-sm transition-all w-full ${
                  style === s 
                    ? 'bg-green-500 text-white border-green-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between gap-2 mt-4">
          <Button variant="outline" onClick={onBack} className="w-full sm:w-auto order-2 sm:order-1">← Назад</Button>
          <Button onClick={handleNext} className="w-full sm:w-auto order-1 sm:order-2 px-6 py-2">Далее →</Button>
        </div>
      </div>
    </div>
  );
}

// Шаг 3: Тема истории  
function Step3({ data, onUpdate, onNext, onBack }: { 
  data: { theme: string; bookStyle: string }; 
  onUpdate: (data: { theme: string; bookStyle: string }) => void; 
  onNext: () => void;
  onBack: () => void;
}) {
  const [theme, setTheme] = useState(data.theme);

  const themes = ['Дружба', 'Семья', 'Приключения', 'Любовь', 'Мужество', 'Мечты', 'Природа'];

  const handleNext = () => {
    // Передаем пустой bookStyle, так как это поле больше не используется
    onUpdate({ theme, bookStyle: '' });
    onNext();
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">🎨 Тема истории</h2>
        <p className="text-gray-600 text-sm md:text-base">Какая основная тема вашей истории?</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Тема истории:</label>
          <div className="grid grid-cols-2 gap-2">
            {themes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`p-3 border rounded-lg text-sm transition-all ${
                  theme === t 
                    ? 'bg-purple-500 text-white border-purple-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Input
            placeholder="Или введите свою тему..."
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="mt-2"
          />
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            ← Назад
          </Button>
          <Button 
            onClick={handleNext}
            className="px-8 py-2"
          >
            Далее →
          </Button>
        </div>
      </div>
    </div>
  );
}

// Шаг 4: Персонажи
function Step4({ data, onUpdate, onNext, onBack }: { 
  data: Array<{ name: string; description?: string; role?: string }>; 
  onUpdate: (data: Array<{ name: string; description?: string; role?: string }>) => void; 
  onNext: () => void;
  onBack: () => void;
}) {
  const [characters, setCharacters] = useState(data.length > 0 ? data : [{ name: '', description: '', role: '' }]);

  const handleCharacterChange = (idx: number, field: string, value: string) => {
    setCharacters((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const addCharacter = () => setCharacters((prev) => [...prev, { name: '', description: '', role: '' }]);
  const removeCharacter = (idx: number) => setCharacters((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const handleNext = () => {
    onUpdate(characters.filter((c) => c.name.trim()));
    onNext();
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">👥 Персонажи</h2>
        <p className="text-gray-600 text-sm md:text-base">Кто будет главными героями вашей истории?</p>
      </div>
      
      <div className="space-y-4">
        {characters.map((char, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-700">Персонаж {idx + 1}</h4>
              {characters.length > 1 && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => removeCharacter(idx)}
                >
                  Удалить
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Имя персонажа"
                value={char.name}
                onChange={(e) => handleCharacterChange(idx, 'name', e.target.value)}
              />
              <Input
                placeholder="Роль (главный, друг...)"
                value={char.role}
                onChange={(e) => handleCharacterChange(idx, 'role', e.target.value)}
              />
              <Input
                placeholder="Описание"
                value={char.description}
                onChange={(e) => handleCharacterChange(idx, 'description', e.target.value)}
              />
            </div>
          </div>
        ))}
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={addCharacter}
          className="w-full"
        >
          + Добавить персонажа
        </Button>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            ← Назад
          </Button>
          <Button 
            onClick={handleNext}
            className="px-8 py-2"
          >
            Далее →
          </Button>
        </div>
      </div>
    </div>
  );
}

// Шаг 5: Финальные пожелания и генерация
function Step5({ data, onUpdate, onGenerate, onBack, isGenerating }: { 
  data: string; 
  onUpdate: (value: string) => void; 
  onGenerate: (wishes: string) => void;
  onBack: () => void;
  isGenerating: boolean;
}) {
  const [wishes, setWishes] = useState(data);

  const handleGenerate = () => {
    onUpdate(wishes);
    onGenerate(wishes);
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">✨ Финальные пожелания</h2>
        <p className="text-gray-600 text-sm md:text-base">Есть ли особые пожелания к истории? (необязательно)</p>
      </div>
      
      <div className="space-y-4">
        <textarea
          placeholder="Например: Добавьте больше диалогов, сделайте концовку неожиданной, включите элементы юмора..."
          value={wishes}
          onChange={(e) => setWishes(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">🎉 Готово к генерации!</h4>
          <p className="text-blue-700 text-sm">
            Все данные собраны. Нажмите "Создать книгу" для генерации вашей уникальной истории.
          </p>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} disabled={isGenerating}>
            ← Назад
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-8 py-2 bg-green-600 hover:bg-green-700"
          >
            {isGenerating ? 'Создаём книгу...' : '📚 Создать книгу'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StoryBook({ story }: { story: any }) {
  const bookRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
  
  // Парсинг иллюстраций
  const illustrationsBlock = story.illustrations;
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
      // Создаем упрощенную версию для PDF без изображений
      const pdfPages = createBookPages();
      
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
      
      console.log('Generating PDF with content:', tempDiv.innerHTML.substring(0, 200));
      
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
    const totalPages = 8;

    // Страница 1: Титульная
    pages.push(
      <div key="title" className="w-full h-full bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col relative border border-amber-200 font-serif shadow-inner">
        <div className="flex-1 flex items-center justify-center p-12 text-center">
          <div className="max-w-sm space-y-8">
            <h1 className="text-4xl font-bold text-gray-800 tracking-widest uppercase leading-tight">
              {title}
            </h1>
            <div className="text-2xl text-amber-600 font-light tracking-wider">
              ✦ ✦ ✦
            </div>
            <p className="text-lg italic text-amber-700 mt-8">
              Сказка, созданная ToonzyAI
            </p>
          </div>
        </div>
        <div className="absolute bottom-6 right-8 text-sm text-amber-600">
          [1]
        </div>
      </div>
    );

    // Страница 2: Персонажи (если есть)
    if (characterList.length > 0) {
      pages.push(
        <div key="characters" className="w-full h-full bg-gradient-to-b from-blue-50 to-indigo-50 flex flex-col relative border border-blue-200 font-serif p-12">
          <div className="flex-1 overflow-hidden">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 uppercase tracking-wide border-b border-blue-300 pb-4">
              ПЕРСОНАЖИ
            </h2>
            <div className="space-y-6 mt-8">
              {characterList.map((char: any, idx: number) => (
                <div key={char.name || idx} className="border-b border-dotted border-blue-300 pb-6 last:border-b-0">
                  <div className="text-xl font-bold text-gray-800">
                    {char.name || 'Безымянный'}
                    {char.role && <span className="text-lg italic text-blue-600 font-normal"> — {char.role}</span>}
                  </div>
                  {char.description && (
                    <div className="mt-3 text-lg text-gray-600 italic leading-relaxed">
                      {char.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-6 right-8 text-sm text-blue-600">
            [2]
          </div>
        </div>
      );

                // Страница 3: Пролог/Введение
      pages.push(
        <div key="prologue" className="w-full h-full bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col relative border border-purple-200 font-serif p-12">
          <div className="flex-1 overflow-hidden">
            <h2 className="text-3xl font-bold text-center mb-10 text-gray-800 uppercase tracking-wide border-b border-purple-300 pb-4">
              ПРОЛОГ
            </h2>
            <div className="space-y-8 mt-10">
              <p className="text-xl leading-relaxed text-gray-800 text-justify indent-8 font-serif">
                Наша история начинается в удивительном мире, где каждый день приносит новые открытия и приключения. 
                Здесь, среди знакомых и незнакомых мест, разворачиваются события, которые изменят всё навсегда.
              </p>
              <p className="text-xl leading-relaxed text-gray-800 text-justify indent-8 font-serif">
                Это рассказ о храбрости и дружбе, о том, как важно верить в свои мечты и никогда не сдаваться. 
                Приготовьтесь к путешествию, полному удивительных открытий и неожиданных поворотов!
              </p>
            </div>
          </div>
          <div className="absolute bottom-6 right-8 text-sm text-purple-600">
            [3]
          </div>
        </div>
      );
    } else {
      // Если нет персонажей, страницы 2-3 для введения
      pages.push(
        <div key="intro1" className="w-full h-full bg-gradient-to-b from-blue-50 to-indigo-50 flex flex-col relative border border-blue-200 font-serif p-12">
          <div className="flex-1 overflow-hidden">
            <h2 className="text-3xl font-bold text-center mb-10 text-gray-800 uppercase tracking-wide border-b border-blue-300 pb-4">
              ВВЕДЕНИЕ
            </h2>
            <div className="space-y-8 mt-10">
              <p className="text-xl leading-relaxed text-gray-800 text-justify indent-8 font-serif">
                Добро пожаловать в мир удивительных историй, где фантазия не знает границ, 
                а каждое слово наполнено магией и чудесами.
              </p>
            </div>
          </div>
          <div className="absolute bottom-6 right-8 text-sm text-blue-600">
            [2]
          </div>
        </div>
      );

      pages.push(
        <div key="intro2" className="w-full h-full bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col relative border border-purple-200 font-serif p-12">
          <div className="flex-1 overflow-hidden">
            <h2 className="text-3xl font-bold text-center mb-10 text-gray-800 uppercase tracking-wide border-b border-purple-300 pb-4">
              ГЛАВА ПЕРВАЯ
            </h2>
            <div className="space-y-8 mt-10">
              <p className="text-xl leading-relaxed text-gray-800 text-justify indent-8 font-serif">
                История начинается здесь, в этом самом месте, в этот самый момент. 
                Приготовьтесь к невероятному путешествию...
              </p>
            </div>
          </div>
          <div className="absolute bottom-6 right-8 text-sm text-purple-600">
            [3]
          </div>
        </div>
      );
    }

    // Основной текст истории с иллюстрациями
    if (scenes.length > 0) {
      // Определяем количество страниц для основного текста
      const contentPagesCount = characterList.length > 0 ? 5 : 5; // Страницы 4-8 или 4-8
      const startPageNumber = characterList.length > 0 ? 4 : 4;
      
      // Создаем страницы, распределяя сцены с изображениями
      const scenesPerPage = Math.ceil(scenes.length / contentPagesCount);
      
      for (let pageIndex = 0; pageIndex < contentPagesCount; pageIndex++) {
        const pageNumber = startPageNumber + pageIndex; // Страницы 4-8
        const sceneStartIndex = pageIndex * scenesPerPage;
        const sceneEndIndex = Math.min(sceneStartIndex + scenesPerPage, scenes.length);
        const pageScenes = scenes.slice(sceneStartIndex, sceneEndIndex);
        
        if (pageScenes.length > 0) {
          pages.push(
            <div key={`page-${pageNumber}`} className="w-full h-full bg-gradient-to-b from-green-50 to-emerald-50 flex flex-col relative border border-green-200 font-serif p-10">
              <div className="flex-1 overflow-hidden">
                <h2 className="text-lg text-center mb-8 text-green-700 uppercase tracking-widest border-b border-green-300 pb-3">
                  {title.toUpperCase()}
                </h2>
                <div className="space-y-8 h-full overflow-hidden">
                  {pageScenes.map((scene, idx) => {
                    const sceneText = scene.description || scene.environment_description || '';
                    const imageUrl = illustrationsMap.get(scene.id);
                    const isFirstScene = idx === 0;
                    const isLastScene = idx === pageScenes.length - 1;
                    
                    // Расширяем текст для лучшего чтения
                    const enhancedText = enhanceSceneText(sceneText, idx, pageScenes.length, pageNumber);
                    
                    return (
                      <div key={scene.id} className="space-y-6">
                        {isFirstScene && pageNumber > 3 && (
                          <div className="border-b border-dotted border-green-300 pb-4 mb-6">
                            <h3 className="text-2xl font-bold text-center text-gray-800 uppercase tracking-wide">
                              Глава {pageNumber - 3}
                            </h3>
                          </div>
                        )}
                        {imageUrl && (
                          <div className="text-center mb-6">
                            <img 
                              src={imageUrl} 
                              alt={`Иллюстрация к сцене ${scene.id}`}
                              className="max-w-full h-48 w-auto mx-auto rounded-lg border border-green-300 shadow-lg object-cover"
                              onError={(e) => {
                                // Скрываем изображение если оно не загрузилось
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-xl leading-relaxed text-gray-800 text-justify indent-8 font-serif mb-6">
                            {enhancedText}
                          </p>
                          {!isLastScene && pageScenes.length > 1 && (
                            <div className="text-center text-green-600 text-lg tracking-widest my-6">
                              • • •
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="absolute bottom-6 right-8 text-sm text-green-600">
                [{pageNumber}]
              </div>
            </div>
          );
        } else {
          // Пустая страница, если контента недостаточно
          pages.push(
            <div key={`page-${pageNumber}`} className="w-full h-full bg-gradient-to-b from-gray-50 to-slate-50 flex flex-col relative border border-gray-200 font-serif p-10">
              <div className="flex-1 overflow-hidden">
                <h2 className="text-lg text-center mb-8 text-gray-600 uppercase tracking-widest border-b border-gray-300 pb-3">
                  {title.toUpperCase()}
                </h2>
                <div className="flex-1 flex items-center justify-center">
                  {pageNumber === 8 ? (
                    <div className="text-center border-t border-gray-300 pt-8 mt-20">
                      <div className="text-3xl font-bold text-gray-800 uppercase tracking-wide mb-4">
                        КОНЕЦ
                      </div>
                      <div className="text-lg text-gray-600 italic">
                        Спасибо за чтение!
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 italic text-lg">
                      История продолжается...
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute bottom-6 right-8 text-sm text-gray-600">
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
          <div key={`page-${pageNumber}`} className="w-full h-full bg-gradient-to-b from-yellow-50 to-orange-50 flex flex-col relative border border-yellow-200 font-serif p-12">
            <div className="flex-1 overflow-hidden">
              <h2 className="text-3xl font-bold text-center mb-10 text-gray-800 uppercase tracking-wide border-b border-yellow-300 pb-4">
                СОДЕРЖАНИЕ
              </h2>
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="space-y-6 text-yellow-700 italic">
                  <p className="text-xl">История ещё не написана...</p>
                  <p className="text-lg">Попробуйте сгенерировать книгу с более подробным описанием.</p>
                  {pageNumber === 8 && (
                    <div className="mt-8 border-t border-yellow-300 pt-6">
                      <p className="text-2xl font-bold text-gray-800 not-italic uppercase">КОНЕЦ</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute bottom-6 right-8 text-sm text-yellow-600">
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
          width={550}
          height={750}
          minWidth={400}
          maxWidth={700}
          minHeight={600}
          maxHeight={900}
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

export function StoryGeneratorPage() {
  const { data: user, isLoading } = useCurrentUser();
  const navigate = useNavigate();
  
  // Состояния для квиза
  const [currentStep, setCurrentStep] = useState(1);
  const [quizData, setQuizData] = useState<QuizData>({
    prompt: '',
    genre: '',
    style: '',
    theme: '',
    bookStyle: '',
    characters: [{ name: '', description: '', role: '' }],
    wishes: ''
  });

  // Состояния для генерации
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<StoryResult | null>(null);
  const [showBook, setShowBook] = useState(false);

  // Состояния для просмотра существующих историй
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null);
  const [viewingExistingStory, setViewingExistingStory] = useState(false);

  // Hooks для работы с историями
  const { data: storiesData, isLoading: storiesLoading, refetch: refetchStories } = useStories();
  const { data: selectedStoryData } = useStory(selectedStory?.task_id || '');

  useEffect(() => {
    if (story) {
      setTimeout(() => setShowBook(true), 400); // плавное появление
    } else {
      setShowBook(false);
    }
  }, [story]);

  // Обновляем данные выбранной истории
  useEffect(() => {
    if (selectedStoryData?.status === 'SUCCESS' && selectedStory) {
      setStory(selectedStoryData);
      setViewingExistingStory(true);
      setShowBook(true);
    }
  }, [selectedStoryData, selectedStory]);

  const handleOpenStory = (storyItem: StoryItem) => {
    if (storyItem.status === 'completed') {
      setSelectedStory(storyItem);
    } else {
      // Показать уведомление о том, что история еще не готова
      console.log('История еще генерируется...');
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    // TODO: Добавить endpoint для удаления истории
    console.log('Удаление истории:', storyId);
    // После удаления обновить список
    refetchStories();
  };

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

  // Функции для квиза
  const totalSteps = 5;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateQuizData = (field: keyof QuizData, value: any) => {
    setQuizData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pollStatus = async (taskId: string) => {
    try {
      const result = await getStoryStatus(taskId);
      if (result.status === 'SUCCESS') {
        setStory(result);
        setIsGenerating(false);
        setError(null);
        // Навигация на детальную страницу истории
        navigate(`/stories/${taskId}`);
      } else if (result.status === 'PENDING' || result.status === 'RETRY') {
        setTimeout(() => pollStatus(taskId), POLLING_INTERVAL);
      } else {
        const errorMessage = result.error || 'Failed to generate story.';
        setError(errorMessage);
        setIsGenerating(false);
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setIsGenerating(false);
    }
  };

  const generateBook = async (wishes: string) => {
    const req = {
      prompt: quizData.prompt,
      genre: quizData.genre,
      style: quizData.style,
      theme: quizData.theme,
      book_style: quizData.bookStyle,
      wishes: wishes,
      characters: quizData.characters.filter((c) => c.name.trim()),
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

  const startNewQuiz = () => {
    setCurrentStep(1);
    setQuizData({
      prompt: '',
      genre: '',
      style: '',
      theme: '',
      bookStyle: '',
      characters: [{ name: '', description: '', role: '' }],
      wishes: ''
    });
    setStory(null);
    setError(null);
    setSelectedStory(null);
    setViewingExistingStory(false);
  };

  // Если книга сгенерирована, показываем её
  if (story) {
    return (
      <>
        <Header user={user} onLogout={() => {}} />
        <div className="container mx-auto p-4">
          <div className="text-center mb-6">
            <Button 
              onClick={startNewQuiz}
              variant="outline"
              className="mb-4"
            >
              ← {viewingExistingStory ? 'К списку книг' : 'Создать новую книгу'}
            </Button>
          </div>
          {showBook && <StoryBook story={story} />}
        </div>
      </>
    );
  }

  // Основной квиз
  return (
    <>
      <Header user={user} onLogout={() => {}} />
      <div className="container mx-auto p-4">
       

        {/* Секция ранее созданных книг */}
        {storiesData?.stories && storiesData.stories.length > 0 && (
          <div className="mb-8">
            <Card className="max-w-6xl mx-auto">
              <CardHeader>
                <CardTitle className="text-center">📚 Ваши книги</CardTitle>
              </CardHeader>
              <CardContent>
                {storiesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Загрузка книг...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {storiesData.stories.map((storyItem) => (
                      <StoryCard
                        key={storyItem.id}
                        story={storyItem}
                        onOpen={handleOpenStory}
                        onDelete={handleDeleteStory}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Квиз для создания новой книги */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>✨ Создать новую интерактивную книгу</CardTitle>
          </CardHeader>
          <CardContent>
            <QuizProgress currentStep={currentStep} totalSteps={totalSteps} />
            
            {error && <ErrorBlock message={error} />}

            {isGenerating && <Loader text="Создаём вашу уникальную книгу..." />}

            {!isGenerating && (
              <>
                {currentStep === 1 && (
                  <Step1
                    data={quizData.prompt}
                    onUpdate={(value) => updateQuizData('prompt', value)}
                    onNext={nextStep}
                  />
                )}

                {currentStep === 2 && (
                  <Step2
                    data={{ genre: quizData.genre, style: quizData.style }}
                    onUpdate={(data) => {
                      updateQuizData('genre', data.genre);
                      updateQuizData('style', data.style);
                    }}
                    onNext={nextStep}
                    onBack={prevStep}
                  />
                )}

                {currentStep === 3 && (
                  <Step3
                    data={{ theme: quizData.theme, bookStyle: quizData.bookStyle }}
                    onUpdate={(data) => {
                      updateQuizData('theme', data.theme);
                      updateQuizData('bookStyle', data.bookStyle);
                    }}
                    onNext={nextStep}
                    onBack={prevStep}
                  />
                )}

                {currentStep === 4 && (
                  <Step4
                    data={quizData.characters}
                    onUpdate={(data) => updateQuizData('characters', data)}
                    onNext={nextStep}
                    onBack={prevStep}
                  />
                )}

                {currentStep === 5 && (
                  <Step5
                    data={quizData.wishes}
                    onUpdate={(value) => updateQuizData('wishes', value)}
                    onGenerate={generateBook}
                    onBack={prevStep}
                    isGenerating={isGenerating}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Export default for convenience along with named export
export default StoryGeneratorPage; 