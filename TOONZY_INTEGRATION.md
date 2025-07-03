# 🎬 ToonzyAI Frontend Integration

Это руководство описывает интеграцию фронтенда с ToonzyAI API для создания анимаций с помощью ИИ.

## 🚀 Быстрый старт

### 1. Аутентификация

```tsx
import { useLogin, useCurrentUser } from '@/hooks/useAuth';

function LoginForm() {
  const loginMutation = useLogin();
  
  const handleLogin = async (username: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ username, password });
      // Автоматическое перенаправление
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
}
```

### 2. Создание аватара

```tsx
import { useCreateAvatar } from '@/hooks/useAvatars';

function CreateAvatarForm() {
  const createAvatar = useCreateAvatar();
  
  const handleCreate = async (prompt: string) => {
    try {
      const avatar = await createAvatar.mutateAsync({ prompt });
      console.log('Avatar created:', avatar.avatar_id);
    } catch (error) {
      console.error('Failed to create avatar:', error);
    }
  };
}
```

### 3. Создание анимационного проекта

```tsx
import { useCreateAnimationProject } from '@/hooks/useAnimations';

function CreateProjectForm() {
  const createProject = useCreateAnimationProject();
  
  const handleCreate = async () => {
    try {
      const project = await createProject.mutateAsync({
        sourceAvatarId: 'avatar-uuid',
        totalSegments: 5,
        animationPrompt: 'A cat performing various activities'
      });
      console.log('Project created:', project.id);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };
}
```

### 4. Работа с сегментами

```tsx
import { 
  useUpdateSegmentPrompt, 
  useGenerateSegment,
  useSegments 
} from '@/hooks/useAnimations';

function SegmentEditor({ projectId }: { projectId: string }) {
  const { segments, loading, refresh } = useSegments(projectId);
  const updatePrompt = useUpdateSegmentPrompt();
  const generateSegment = useGenerateSegment();
  
  const handleUpdatePrompt = async (segmentNumber: number, prompt: string) => {
    try {
      await updatePrompt.mutateAsync({
        projectId,
        segmentNumber,
        segmentPrompt: prompt
      });
      refresh();
    } catch (error) {
      console.error('Failed to update prompt:', error);
    }
  };
  
  const handleGenerate = async (segmentNumber: number) => {
    try {
      await generateSegment.mutateAsync({
        projectId,
        segmentNumber
      });
      refresh();
    } catch (error) {
      console.error('Failed to generate segment:', error);
    }
  };
}
```

## 📦 Основные компоненты

### AnimationProject
Главный компонент для редактирования анимационного проекта с сегментами.

```tsx
import { AnimationProject } from '@/components/common';

<AnimationProject 
  projectId="project-uuid"
  onBack={() => setCurrentProject(null)}
/>
```

### CreateProject
Форма создания нового анимационного проекта.

```tsx
import { CreateProject } from '@/components/common';

<CreateProject 
  onProjectCreated={(project) => setCurrentProject(project)}
  onCancel={() => setShowForm(false)}
/>
```

### SegmentEditor
Редактор для индивидуальной настройки каждого сегмента.

```tsx
import { SegmentEditor } from '@/components/common';

<SegmentEditor 
  projectId="project-uuid"
  segment={segment}
  onUpdate={() => refresh()}
/>
```

### ErrorBoundary
Компонент для отлова и красивого отображения ошибок.

```tsx
import { ErrorBoundary } from '@/components/common';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## 🎣 Основные хуки

### Аутентификация
- `useLogin()` - Вход в систему
- `useRegister()` - Регистрация
- `useCurrentUser()` - Текущий пользователь
- `useLogout()` - Выход

### Аватары
- `useCreateAvatar()` - Создание аватара
- `useAvatars()` - Список аватаров
- `useDeleteAvatar()` - Удаление аватара

### Анимации
- `useCreateAnimationProject()` - Создание проекта
- `useAnimationProjects()` - Список проектов
- `useAnimationProject(id)` - Получение проекта
- `useUpdateSegmentPrompt()` - Обновление промпта сегмента
- `useGenerateSegment()` - Генерация сегмента
- `useAssembleVideo()` - Сборка финального видео

## 🎯 Особенности

### Автоматическое отслеживание прогресса
Хуки автоматически обновляют данные при активных процессах генерации:

```tsx
// Автоматически опрашивает сервер каждые 3-5 секунд
const { data: project } = useAnimationProject(projectId);

// Показывает актуальный статус сегментов
project.segments.forEach(segment => {
  console.log(`Segment ${segment.segment_number}: ${segment.status}`);
});
```

### Обработка ошибок
Централизованная обработка ошибок с красивым UI:

```tsx
import { ErrorDisplay, useErrorHandler } from '@/utils/errorHandler';

function MyComponent() {
  const { handleError } = useErrorHandler();
  
  try {
    // ... some async operation
  } catch (error) {
    handleError(error, 'MyComponent');
    return <ErrorDisplay error={error} retry={retryFunction} />;
  }
}
```

### Кэширование и оптимизация
React Query автоматически кэширует запросы и оптимизирует производительность:

```tsx
// Кэширование на 5 минут для статических данных
const { data: avatars } = useAvatars();

// Автоматическое обновление для активных процессов
const { data: project } = useAnimationProject(projectId); // обновляется каждые 3 сек
```

## 🎨 Стилизация

Компоненты используют Tailwind CSS с дополнительными стилями из `src/index.css`:

- `.animation-project` - Основной контейнер проекта
- `.segment-editor` - Стили редактора сегмента
- `.btn-generate` - Кнопка генерации
- `.status-*` - Статусы (completed, in-progress, failed, etc.)

## 🔧 Конфигурация

### Переменные окружения

```bash
# Vite автоматически проксирует запросы к /api/* на backend
VITE_API_URL=http://localhost:8000  # Для production
```

### API клиент

```tsx
// src/services/api.ts содержит полную реализацию
export const apiClient = new APIClient();

// Автоматический refresh токенов
// Обработка CORS для медиа-файлов
// TypeScript типы для всех endpoints
```

## 📱 Полный пример использования

```tsx
import React, { useState } from 'react';
import { 
  AnimationProject, 
  CreateProject, 
  ErrorBoundary 
} from '@/components/common';
import { useAnimationProjects } from '@/hooks/useAnimations';

function AnimationStudio() {
  const [currentProject, setCurrentProject] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: projects, isLoading } = useAnimationProjects();

  if (currentProject) {
    return (
      <AnimationProject 
        projectId={currentProject.id} 
        onBack={() => setCurrentProject(null)}
      />
    );
  }

  if (showCreateForm) {
    return (
      <CreateProject 
        onProjectCreated={setCurrentProject}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="animation-studio">
        <h1>🎬 Студия анимации</h1>
        <button onClick={() => setShowCreateForm(true)}>
          Создать проект
        </button>
        
        {isLoading ? (
          <div>Загрузка...</div>
        ) : (
          <div className="projects-grid">
            {projects?.map(project => (
              <div 
                key={project.id}
                onClick={() => setCurrentProject(project)}
                className="project-card"
              >
                <h3>Проект {project.id.slice(0, 8)}</h3>
                <p>{project.animation_prompt}</p>
                <span className={`status-${project.status}`}>
                  {project.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
```

## 🚦 Workflow

1. **Создание аватара** → `useCreateAvatar()`
2. **Создание проекта** → `useCreateAnimationProject()`
3. **Ожидание создания сегментов** → автоматический polling
4. **Настройка промптов** → `useUpdateSegmentPrompt()`
5. **Генерация сегментов** → `useGenerateSegment()`
6. **Сборка видео** → `useAssembleVideo()`

Все этапы отслеживаются автоматически с обновлением UI в реальном времени!

---

**🎉 Готово!** Теперь у вас есть полнофункциональная интеграция с ToonzyAI API. 