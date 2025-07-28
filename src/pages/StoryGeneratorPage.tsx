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

// Types for the quiz
interface QuizData {
  prompt: string;
  genre: string;
  style: string;
  theme: string;
  bookStyle: string;
  characters: Array<{ name: string; description?: string; role?: string }>;
  wishes: string;
}

function Loader({ text = 'Generating your book...' }) {
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

// Progress bar for the quiz
function QuizProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>Step {currentStep} of {totalSteps}</span>
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

// Step 1: Main Idea
function Step1({ data, onUpdate, onNext }: {
  data: string;
  onUpdate: (value: string) => void;
  onNext: () => void;
}) {
  const [value, setValue] = useState(data);
  const [error, setError] = useState<string>('');

  const validatePrompt = (prompt: string): string => {
    if (!prompt.trim()) {
      return 'Please enter a story idea';
    }
    if (prompt.trim().length < 10) {
      return 'Story idea must be at least 10 characters long';
    }
    if (prompt.trim().length > 500) {
      return 'Story idea is too long (maximum 500 characters)';
    }
    if (prompt.trim().split(/\s+/).length < 3) {
      return 'Please provide a more detailed story idea (at least 3 words)';
    }
    return '';
  };

  const handleNext = () => {
    const validationError = validatePrompt(value);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    onUpdate(value);
    onNext();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (error) {
      setError('');
    }
  };

  const characterCount = value.length;
  const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">Main Idea of the Story</h2>
        <p className="text-gray-600 text-sm md:text-base">What is your book about? Describe the main plot or idea.</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <textarea
            placeholder="For example: A boy found a magic lamp and went on an amazing journey..."
            value={value}
            onChange={handleInputChange}
            className={`w-full p-4 border rounded-lg h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-500' : characterCount > 0 ? 'border-blue-300' : 'border-gray-300'
            }`}
            required
          />
          
          {/* Character and word count */}
          <div className="flex justify-between items-center mt-2 text-xs">
            <div className="flex space-x-4">
              <span className={`${characterCount < 10 ? 'text-red-500' : characterCount >= 50 ? 'text-green-500' : 'text-gray-500'}`}>
                {characterCount}/500 characters
              </span>
              <span className={`${wordCount < 3 ? 'text-red-500' : wordCount >= 10 ? 'text-green-500' : 'text-gray-500'}`}>
                {wordCount} words
              </span>
            </div>
            {characterCount > 0 && (
              <span className={error ? 'text-red-500' : 'text-green-500'}>
                {error ? '✗ Invalid' : '✓ Valid'}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500">
          The more detailed your story idea, the better the result. Include main characters, setting, and plot points.
        </p>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleNext}
          disabled={!value.trim() || !!error}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

// Step 2: Genre and Style
function Step2({ data, onUpdate, onNext, onBack }: {
  data: { genre: string; style: string };
  onUpdate: (data: { genre: string; style: string }) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [genre, setGenre] = useState(data.genre);
  const [style, setStyle] = useState(data.style);

  const genres = ['Fairy Tale', 'Adventure', 'Sci-Fi', 'Mystery', 'Comedy', 'Drama', 'Fantasy'];
  const styles = ['Cheerful', 'Magical', 'Mysterious', 'Romantic', 'Dynamic', 'Calm', 'Epic'];

  const handleNext = () => {
    onUpdate({ genre, style });
    onNext();
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">🎭 Genre and Style</h2>
        <p className="text-gray-600 text-sm md:text-base">Choose a genre and style for your story</p>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Genre:</label>
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
            placeholder="Or enter your own genre..."
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="mt-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Style:</label>
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
          <Button variant="outline" onClick={onBack} className="w-full sm:w-auto order-2 sm:order-1">← Back</Button>
          <Button onClick={handleNext} className="w-full sm:w-auto order-1 sm:order-2 px-6 py-2">Next →</Button>
        </div>
      </div>
    </div>
  );
}

// Step 3: Story Theme
function Step3({ data, onUpdate, onNext, onBack }: {
  data: { theme: string; bookStyle: string };
  onUpdate: (data: { theme: string; bookStyle: string }) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [theme, setTheme] = useState(data.theme);

  const themes = ['Friendship', 'Family', 'Adventure', 'Love', 'Courage', 'Dreams', 'Nature'];

  const handleNext = () => {
    // Pass an empty bookStyle as this field is no longer used
    onUpdate({ theme, bookStyle: '' });
    onNext();
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">🎨 Story Theme</h2>
        <p className="text-gray-600 text-sm md:text-base">What is the main theme of your story?</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Story Theme:</label>
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
            placeholder="Or enter your own theme..."
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="mt-2"
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
          <Button
            onClick={handleNext}
            className="px-8 py-2"
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
}

// Step 4: Characters
function Step4({ data, onUpdate, onNext, onBack }: {
  data: Array<{ name: string; description?: string; role?: string }>;
  onUpdate: (data: Array<{ name: string; description?: string; role?: string }>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [characters, setCharacters] = useState(data.length > 0 ? data : [{ name: '', description: '', role: '' }]);
  const [errors, setErrors] = useState<Array<{ name?: string; description?: string }>>([]);

  const validateCharacter = (character: { name: string; description?: string; role?: string }, index: number): { name?: string; description?: string } => {
    const errors: { name?: string; description?: string } = {};
    
    if (!character.name.trim()) {
      errors.name = 'Character name is required';
    } else if (character.name.trim().length < 2) {
      errors.name = 'Character name must be at least 2 characters';
    } else if (character.name.trim().length > 50) {
      errors.name = 'Character name is too long (maximum 50 characters)';
    }
    
    if (character.description && character.description.trim().length > 200) {
      errors.description = 'Description is too long (maximum 200 characters)';
    }
    
    return errors;
  };

  const validateAllCharacters = (): boolean => {
    const newErrors = characters.map((char, index) => validateCharacter(char, index));
    setErrors(newErrors);
    return newErrors.every(error => !error.name && !error.description);
  };

  const handleCharacterChange = (idx: number, field: string, value: string) => {
    setCharacters((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
    
    // Clear error for this field when user starts typing
    if (errors[idx]) {
      setErrors(prev => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: undefined };
        return updated;
      });
    }
  };

  const addCharacter = () => {
    setCharacters((prev) => [...prev, { name: '', description: '', role: '' }]);
    setErrors(prev => [...prev, {}]);
  };
  
  const removeCharacter = (idx: number) => {
    setCharacters((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
    setErrors(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  };

  const handleNext = () => {
    if (!validateAllCharacters()) {
      return;
    }
    
    const validCharacters = characters.filter((c) => c.name.trim());
    if (validCharacters.length === 0) {
      // Show error for first character if none are valid
      setErrors([{ name: 'At least one character is required' }]);
      return;
    }
    
    onUpdate(validCharacters);
    onNext();
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">👥 Characters</h2>
        <p className="text-gray-600 text-sm md:text-base">Who are the main characters of your story?</p>
      </div>

      <div className="space-y-4">
        {characters.map((character, idx) => (
          <Card key={idx} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800">Character {idx + 1}</h3>
                {characters.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeCharacter(idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  placeholder="Character name"
                  value={character.name}
                  onChange={(e) => handleCharacterChange(idx, 'name', e.target.value)}
                  className={`${errors[idx]?.name ? 'border-red-500 focus:border-red-500' : character.name.length > 0 ? 'border-blue-300 focus:border-blue-500' : ''}`}
                />
                {errors[idx]?.name && (
                  <p className="text-red-500 text-xs mt-1">{errors[idx].name}</p>
                )}
                {character.name.length > 0 && !errors[idx]?.name && (
                  <p className="text-green-500 text-xs mt-1">✓ Valid name</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  placeholder="Brief description of the character"
                  value={character.description || ''}
                  onChange={(e) => handleCharacterChange(idx, 'description', e.target.value)}
                  className={`w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors[idx]?.description ? 'border-red-500' : (character.description?.length || 0) > 0 ? 'border-blue-300' : 'border-gray-300'
                  }`}
                  rows={2}
                />
                {errors[idx]?.description && (
                  <p className="text-red-500 text-xs mt-1">{errors[idx].description}</p>
                )}
                {character.description && character.description.length > 0 && !errors[idx]?.description && (
                  <p className="text-green-500 text-xs mt-1">✓ Valid description</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {(character.description?.length || 0)}/200 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role (optional)
                </label>
                <Input
                  placeholder="e.g., Hero, Villain, Sidekick"
                  value={character.role || ''}
                  onChange={(e) => handleCharacterChange(idx, 'role', e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addCharacter}
          className="w-full py-2"
        >
          + Add Another Character
        </Button>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={characters.every(c => !c.name.trim())}
          className="px-8 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

// Step 5: Final Touches and Generation
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
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">✨ Final Touches</h2>
        <p className="text-gray-600 text-sm md:text-base">Any special requests for the story? (optional)</p>
      </div>

      <div className="space-y-4">
        <textarea
          placeholder="For example: Add more dialogue, make the ending unexpected, include elements of humor..."
          value={wishes}
          onChange={(e) => setWishes(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">🎉 Ready to Generate!</h4>
          <p className="text-blue-700 text-sm">
            All data has been collected. Click "Create Book" to generate your unique story.
          </p>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} disabled={isGenerating}>
            ← Back
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-8 py-2 bg-green-600 hover:bg-green-700"
          >
            {isGenerating ? 'Creating book...' : '📚 Create Book'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StoryBook({ story }: { story: any }) {
  const bookRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Universal parsing for multi-agent result
  const script: any = story.script ?? story;
  const title = script.title ?? 'Generated Story';
  const scenes: any[] = script.scenes ?? [];
  const styleBlock = story.style?.style ?? story.style ?? null;
  const environmentsBlock = story.environments?.environments ?? story.environments ?? [];
  const charactersBlock = story.characters;
  const characterList = Array.isArray(charactersBlock)
    ? charactersBlock
    : charactersBlock?.characters ?? [];

  // Parse illustrations
  const illustrationsBlock = story.illustrations;
  const illustrationsList = Array.isArray(illustrationsBlock)
    ? illustrationsBlock
    : illustrationsBlock?.illustrations ?? [];

  // Create an illustration map by scene_id for quick lookup
  const illustrationsMap = new Map();
  illustrationsList.forEach((ill: any) => {
    if (ill.scene_id && ill.image_url) {
      illustrationsMap.set(ill.scene_id, ill.image_url);
    }
  });

  // Function to expand scene text
  const expandSceneText = (originalText: string, sceneIndex: number, totalScenes: number): string => {
    if (!originalText || originalText.length < 50) {
      return originalText;
    }

    // Add contextual transitions and details
    const transitions = [
      "Meanwhile", "At the same time", "During this time", "Suddenly", "Abruptly",
      "Unexpectedly", "After that", "Then", "In the next moment"
    ];

    const descriptiveWords = [
      "amazing", "incredible", "magical", "mysterious", "beautiful",
      "enigmatic", "interesting", "captivating", "unusual", "wondrous"
    ];

    let expandedText = originalText;

    // Add transitions between scenes
    if (sceneIndex > 0 && Math.random() > 0.5) {
      const transition = transitions[Math.floor(Math.random() * transitions.length)];
      expandedText = `${transition}, ${expandedText.toLowerCase()}`;
    }

    // Add descriptive details
    if (expandedText.length < 150) {
      const adjective = descriptiveWords[Math.floor(Math.random() * descriptiveWords.length)];
      expandedText += ` It was a truly ${adjective} moment in the story.`;
    }

    // Add emotional depth
    if (sceneIndex === totalScenes - 1) {
      expandedText += " The story was coming to its conclusion, leaving unforgettable memories.";
    } else if (sceneIndex === 0) {
      expandedText = "Our story begins right here. " + expandedText;
    }

    return expandedText;
  };

  // Function to enhance scene text in the interactive book
  const enhanceSceneText = (originalText: string, sceneIndex: number, totalScenes: number, pageNumber: number): string => {
    if (!originalText) return originalText;

    let enhancedText = originalText;

    // Add introductory phrases for the start of a chapter
    if (sceneIndex === 0 && pageNumber > 3) {
      const openings = [
        "In this part of our story",
        "Continuing the tale",
        "The turn of events led to",
        "What happened next was as follows:"
      ];
      const opening = openings[Math.floor(Math.random() * openings.length)];
      enhancedText = `${opening}, ${enhancedText.toLowerCase()}`;
    }

    // Add transitional elements
    if (sceneIndex > 0) {
      const transitions = ["Meanwhile", "After that", "Then", "At that time"];
      if (Math.random() > 0.6) {
        const transition = transitions[Math.floor(Math.random() * transitions.length)];
        enhancedText = `${transition}, ${enhancedText.toLowerCase()}`;
      }
    }

    // Add concluding elements for the last scene of a page
    if (sceneIndex === totalScenes - 1 && totalScenes > 1) {
      enhancedText += " And so the story continued...";
    }

    return enhancedText;
  };

  // PDF download function
  const downloadPDF = async () => {
    if (!bookRef.current) return;

    setIsDownloading(true);

    try {
      // Create a simplified version for PDF without images
      const pdfPages = createBookPages();

      // Create a temporary container with visible styles
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '0';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm';
      tempDiv.style.zIndex = '-1000';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'Times New Roman, serif';
      tempDiv.style.color = '#2c2c2c';

      // Create simple HTML for the PDF
      let pdfContent = '';

      // Title page
      pdfContent += `
         <div style="page-break-after: always; padding: 50px; min-height: 280mm; text-align: center; display: flex; align-items: center; justify-content: center;">
           <div>
             <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 40px; text-transform: uppercase; letter-spacing: 4px; line-height: 1.2;">${title}</h1>
             <div style="font-size: 24px; color: #d4af37; margin: 30px 0; letter-spacing: 3px;">✦ ✦ ✦</div>
             <p style="font-size: 20px; font-style: italic; color: #666; margin-top: 50px;">A story created by ToonzyAI</p>
           </div>
         </div>
       `;

      // Characters page
      if (characterList.length > 0) {
        pdfContent += `
           <div style="page-break-after: always; padding: 50px; min-height: 280mm;">
             <h2 style="font-size: 26px; font-weight: bold; text-align: center; margin-bottom: 40px; text-transform: uppercase; border-bottom: 2px solid #666; padding-bottom: 15px; letter-spacing: 2px;">CHARACTERS</h2>
             ${characterList.map((char: any) => `
               <div style="margin-bottom: 30px; font-size: 18px; border-bottom: 1px dotted #999; padding-bottom: 20px;">
                 <div style="font-weight: bold; font-size: 22px; color: #333;">${char.name || 'Unnamed'}</div>
                 ${char.role ? `<div style="font-style: italic; color: #666; font-size: 18px; margin-top: 5px;">— ${char.role}</div>` : ''}
                 ${char.description ? `<div style="margin-top: 12px; font-style: italic; color: #555; line-height: 1.6; font-size: 16px;">${char.description}</div>` : ''}
               </div>
             `).join('')}
           </div>
         `;
      }

      // Main pages with expanded text
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
               <h2 style="font-size: 22px; text-align: center; margin-bottom: 35px; color: #555; text-transform: uppercase; border-bottom: 2px solid #ddd; padding-bottom: 12px; letter-spacing: 2px;">CHAPTER ${pageIndex + 1}</h2>
               ${pageScenes.length > 0 ? pageScenes.map((scene, sceneIndex) => {
            const sceneText = scene.description || scene.environment_description || '';
            // Expand text for more content
            const expandedText = expandSceneText(sceneText, sceneIndex, pageScenes.length);
            return `
                   <div style="margin-bottom: 40px;">
                     <p style="font-size: 16px; line-height: 1.9; text-align: justify; margin: 0 0 20px 0; text-indent: 30px; color: #333; font-family: 'Times New Roman', serif;">${expandedText}</p>
                     ${sceneIndex < pageScenes.length - 1 ? '<div style="text-align: center; margin: 30px 0; color: #999; font-size: 18px; letter-spacing: 4px;">• • •</div>' : ''}
                   </div>
                 `;
          }).join('') : `
                  <div style="text-align: center; margin-top: 120px; font-style: italic; color: #666;">
                    ${pageNum === 8 ? '<div style="border-top: 2px solid #ddd; padding-top: 30px; margin-top: 60px;"><div style="font-size: 28px; font-weight: bold; color: #333; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 20px;">THE END</div><div style="font-size: 18px; margin-top: 20px; color: #666;">Thanks for reading!</div></div>' : ''}
                  </div>
                `}
                <div style="position: absolute; bottom: 20px; right: 40px; font-size: 10px; color: #666;">[${pageNum}]</div>
              </div>
            `;
        }
      }

      tempDiv.innerHTML = pdfContent;
      document.body.appendChild(tempDiv);

      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // PDF options
      const options = {
        margin: [10, 10, 10, 10],
        filename: `${title.replace(/[^a-zA-Z0-9\s]/g, '_')}.pdf`,
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

      // Remove the temporary element
      document.body.removeChild(tempDiv);

    } catch (error) {
      console.error('Error creating PDF:', error);
      alert('An error occurred while creating the PDF file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };



  // Create the book with exactly 8 pages
  const createBookPages = () => {
    const pages = [];
    const totalPages = 8;

    // Page 1: Title
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
              A story created by ToonzyAI
            </p>
          </div>
        </div>
        <div className="absolute bottom-6 right-8 text-sm text-amber-600">
          [1]
        </div>
      </div>
    );

    // Page 2: Characters (if any)
    if (characterList.length > 0) {
      pages.push(
        <div key="characters" className="w-full h-full bg-gradient-to-b from-blue-50 to-indigo-50 flex flex-col relative border border-blue-200 font-serif p-12">
          <div className="flex-1 overflow-hidden">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 uppercase tracking-wide border-b border-blue-300 pb-4">
              CHARACTERS
            </h2>
            <div className="space-y-6 mt-8">
              {characterList.map((char: any, idx: number) => (
                <div key={char.name || idx} className="border-b border-dotted border-blue-300 pb-6 last:border-b-0">
                  <div className="text-xl font-bold text-gray-800">
                    {char.name || 'Unnamed'}
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

      // Page 3: Prologue
      pages.push(
        <div key="prologue" className="w-full h-full bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col relative border border-purple-200 font-serif p-12">
          <div className="flex-1 overflow-hidden">
            <h2 className="text-3xl font-bold text-center mb-10 text-gray-800 uppercase tracking-wide border-b border-purple-300 pb-4">
              PROLOGUE
            </h2>
            <div className="space-y-8 mt-10">
              <p className="text-xl leading-relaxed text-gray-800 text-justify indent-8 font-serif">
                Our story begins in a wondrous world, where every day brings new discoveries and adventures.
                Here, among familiar and unfamiliar places, events unfold that will change everything forever.
              </p>
              <p className="text-xl leading-relaxed text-gray-800 text-justify indent-8 font-serif">
                This is a tale of courage and friendship, about the importance of believing in your dreams and never giving up.
                Get ready for a journey full of amazing discoveries and unexpected twists!
              </p>
            </div>
          </div>
          <div className="absolute bottom-6 right-8 text-sm text-purple-600">
            [3]
          </div>
        </div>
      );
    } else {
      // If no characters, pages 2-3 are for introduction
      pages.push(
        <div key="intro1" className="w-full h-full bg-gradient-to-b from-blue-50 to-indigo-50 flex flex-col relative border border-blue-200 font-serif p-12">
          <div className="flex-1 overflow-hidden">
            <h2 className="text-3xl font-bold text-center mb-10 text-gray-800 uppercase tracking-wide border-b border-blue-300 pb-4">
              INTRODUCTION
            </h2>
            <div className="space-y-8 mt-10">
              <p className="text-xl leading-relaxed text-gray-800 text-justify indent-8 font-serif">
                Welcome to a world of amazing stories, where imagination knows no bounds,
                and every word is filled with magic and wonder.
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
              CHAPTER ONE
            </h2>
            <div className="space-y-8 mt-10">
              <p className="text-xl leading-relaxed text-gray-800 text-justify indent-8 font-serif">
                The story begins here, in this very place, at this very moment.
                Prepare for an incredible journey...
              </p>
            </div>
          </div>
          <div className="absolute bottom-6 right-8 text-sm text-purple-600">
            [3]
          </div>
        </div>
      );
    }

    // Main story text with illustrations
    if (scenes.length > 0) {
      // Determine the number of pages for the main text
      const contentPagesCount = characterList.length > 0 ? 5 : 5; // Pages 4-8 or 4-8
      const startPageNumber = characterList.length > 0 ? 4 : 4;

      // Create pages, distributing scenes with images
      const scenesPerPage = Math.ceil(scenes.length / contentPagesCount);

      for (let pageIndex = 0; pageIndex < contentPagesCount; pageIndex++) {
        const pageNumber = startPageNumber + pageIndex; // Pages 4-8
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

                    // Enhance text for better readability
                    const enhancedText = enhanceSceneText(sceneText, idx, pageScenes.length, pageNumber);

                    return (
                      <div key={scene.id} className="space-y-6">
                        {isFirstScene && pageNumber > 3 && (
                          <div className="border-b border-dotted border-green-300 pb-4 mb-6">
                            <h3 className="text-2xl font-bold text-center text-gray-800 uppercase tracking-wide">
                              Chapter {pageNumber - 3}
                            </h3>
                          </div>
                        )}
                        {imageUrl && (
                          <div className="text-center mb-6">
                            <img
                              src={imageUrl}
                              alt={`Illustration for scene ${scene.id}`}
                              className="max-w-full h-48 w-auto mx-auto rounded-lg border border-green-300 shadow-lg object-cover"
                              onError={(e) => {
                                // Hide the image if it fails to load
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
          // Empty page if content is insufficient
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
                        THE END
                      </div>
                      <div className="text-lg text-gray-600 italic">
                        Thanks for reading!
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 italic text-lg">
                      The story continues...
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
      // If no content, fill remaining pages with placeholders
      const startPage = characterList.length > 0 ? 4 : 4;
      for (let pageNumber = startPage; pageNumber <= 8; pageNumber++) {
        pages.push(
          <div key={`page-${pageNumber}`} className="w-full h-full bg-gradient-to-b from-yellow-50 to-orange-50 flex flex-col relative border border-yellow-200 font-serif p-12">
            <div className="flex-1 overflow-hidden">
              <h2 className="text-3xl font-bold text-center mb-10 text-gray-800 uppercase tracking-wide border-b border-yellow-300 pb-4">
                CONTENTS
              </h2>
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="space-y-6 text-yellow-700 italic">
                  <p className="text-xl">The story has not been written yet...</p>
                  <p className="text-lg">Try generating the book with a more detailed description.</p>
                  {pageNumber === 8 && (
                    <div className="mt-8 border-t border-yellow-300 pt-6">
                      <p className="text-2xl font-bold text-gray-800 not-italic uppercase">THE END</p>
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
      {/* Download button */}
      <div className="flex justify-center mb-8">
        <Button
          onClick={downloadPDF}
          disabled={isDownloading}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-medium shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 text-lg"
        >
          {isDownloading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              Creating PDF...
            </>
          ) : (
            <>
              📚 Download Book as PDF
            </>
          )}
        </Button>
      </div>

      {/* Book */}
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

  // States for the quiz
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

  // States for generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<StoryResult | null>(null);
  const [showBook, setShowBook] = useState(false);

  // States for viewing existing stories
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null);
  const [viewingExistingStory, setViewingExistingStory] = useState(false);

  // Hooks for working with stories
  const { data: storiesData, isLoading: storiesLoading, refetch: refetchStories } = useStories();
  const { data: selectedStoryData } = useStory(selectedStory?.task_id || '');

  useEffect(() => {
    if (story) {
      setTimeout(() => setShowBook(true), 400); // smooth appearance
    } else {
      setShowBook(false);
    }
  }, [story]);

  // Update selected story data
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
      // Show a notification that the story is not ready yet
      console.log('Story is still generating...');
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    // TODO: Add endpoint for deleting a story
    console.log('Deleting story:', storyId);
    // Refresh the list after deletion
    refetchStories();
  };

  if (isLoading) {
    return <Loader text="Checking authorization..." />;
  }
  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-xl mx-auto mt-16">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-3xl text-amber-500 border border-amber-200 mb-2">🔒</div>
              <div className="text-lg text-amber-800 mb-2 text-center">To generate a book, please log in to your account</div>
              <Button onClick={() => navigate('/login')} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded">Log In</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz functions
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
        // Navigate to the story detail page
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

  // If a book is generated, show it
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
              ← {viewingExistingStory ? 'Back to My Books' : 'Create New Book'}
            </Button>
          </div>
          {showBook && <StoryBook story={story} />}
        </div>
      </>
    );
  }

  // Main quiz
  return (
    <>
      <Header user={user} onLogout={() => {}} />
      <div className="container mx-auto p-4">


        {/* Section for previously created books */}
        {storiesData?.stories && storiesData.stories.length > 0 && (
          <div className="mb-8">
            <Card className="max-w-6xl mx-auto">
              <CardHeader>
                <CardTitle className="text-center">Your Books</CardTitle>
              </CardHeader>
              <CardContent>
                {storiesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading books...</p>
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

        {/* Quiz for creating a new book */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create a New Interactive Book</CardTitle>
          </CardHeader>
          <CardContent>
            <QuizProgress currentStep={currentStep} totalSteps={totalSteps} />

            {error && <ErrorBlock message={error} />}

            {isGenerating && <Loader text="Creating your unique book..." />}

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