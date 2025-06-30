# ToonzyAI Frontend

Современный React фронтенд для приложения ToonzyAI с использованием TypeScript, Vite и компонентной архитектуры.

## 🚀 Технологии

- **React 18** с TypeScript
- **Vite** для быстрой разработки
- **Tailwind CSS v4** для стилизации
- **React Router** для маршрутизации
- **React Query** для управления состоянием сервера
- **React Hook Form + Zod** для работы с формами
- **Axios** для HTTP запросов
- **shadcn/ui** компоненты

## 📁 Архитектура проекта

```
src/
├── components/           # Переиспользуемые компоненты
│   ├── common/          # Общие компоненты (AvatarImage, AvatarCard)
│   ├── forms/           # Компоненты форм (CreateAvatarForm)
│   ├── layout/          # Компоненты макета (Header)
│   └── ui/              # Базовые UI компоненты (Button, Card, Input)
├── pages/               # Страницы приложения
│   ├── HomePage.tsx     # Главная страница
│   ├── LoginPage.tsx    # Страница входа
│   ├── RegisterPage.tsx # Страница регистрации
│   ├── DashboardPage.tsx # Панель управления
│   ├── AvatarsPage.tsx  # Управление аватарами
│   └── AnimationPage.tsx # Создание анимаций
├── hooks/               # Пользовательские хуки
│   ├── useAuth.ts       # Аутентификация
│   ├── useAvatars.ts    # Работа с аватарами
│   └── useAnimations.ts # Работа с анимациями
├── services/            # API сервисы
│   └── api.ts           # Основной API клиент
├── types/               # TypeScript типы
│   └── api.ts           # API типы
├── utils/               # Утилиты
│   └── imageUtils.ts    # Работа с изображениями
├── constants/           # Константы приложения
│   └── index.ts         # Общие константы
└── App.tsx             # Главный компонент
```

## 🛠️ Установка и запуск

1. **Установите зависимости:**
   ```bash
   cd toonzyai-frontend
   npm install
   ```

2. **Запустите в режиме разработки:**
   ```bash
   npm run dev
   ```

3. **Сборка для продакшена:**
   ```bash
   npm run build
   ```

## 🔧 Конфигурация

### Прокси для API
В `vite.config.ts` настроен прокси для перенаправления запросов к бэкенду:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

### Переменные окружения
Создайте файл `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🖼️ Работа с изображениями аватаров

### Новая архитектура (v2.0)

Изображения теперь загружаются через защищенный API эндпоинт вместо прямых ссылок на GCS:

**Старая схема:**
```
https://storage.googleapis.com/avatars/uuid.png → HTTP 403 ❌
```

**Новая схема:**
```
/api/v1/avatars/uuid/image → Безопасная загрузка ✅
```

### Компоненты

#### AvatarImage
Основной компонент для отображения изображений аватаров:
- Автоматическая загрузка через API с авторизацией
- Кэширование для улучшения производительности
- Состояния загрузки и ошибок
- Автоматическая очистка blob URL

#### AvatarCard
Карточка аватара с действиями:
- Отображение статуса генерации
- Кнопки для анимации и удаления
- Debug информация (в режиме разработки)

#### DebugAvatarInfo
Компонент для отладки (только в режиме разработки):
- Диагностика проблем с изображениями
- Тестирование загрузки
- Информация о кэше
- Debug API эндпоинт

### Утилиты для изображений

#### imageUtils.ts
```typescript
// Загрузка изображения как blob URL
const blobUrl = await loadAvatarImageAsBlob(avatarId);

// Кэширование изображений
const cachedUrl = await avatarImageCache.get(avatarId);

// Очистка кэша
avatarImageCache.clear();
```

## 🔐 Аутентификация

### Потоки аутентификации

1. **Регистрация/Вход:**
   ```typescript
   const { mutate: login } = useLogin();
   login({ username, password });
   ```

2. **Автоматическое обновление токенов:**
   - Перехватчики axios автоматически обновляют истекшие access_token
   - Использование refresh_token для получения новых токенов

3. **Защищенные маршруты:**
   ```tsx
   <ProtectedRoute>
     <AvatarsPage />
   </ProtectedRoute>
   ```

## 📡 API интеграция

### Структура API клиента

```typescript
// Аутентификация
authApi.register(data)
authApi.login(data)
authApi.getCurrentUser()

// Аватары
avatarApi.create(data)
avatarApi.list(page, perPage)
avatarApi.getAvatarImage(avatarId) // Загрузка изображения

// Анимации
animationApi.create(data)
animationApi.list()
animationApi.assemble(projectId)

// Улучшенные endpoints для сегментов с новой структурой API (декабрь 2024)
animationApi.updateSegmentPrompt(projectId, segmentNumber, prompt)
animationApi.generateSegment(projectId, segmentNumber) // ✨ Возвращает task_id, monitoring, details
animationApi.getSegment(projectId, segmentNumber)      // ✨ Возвращает structured data
```

> 📖 **Подробная документация по Animation API:** См. [ANIMATION_API_GUIDE.md](./ANIMATION_API_GUIDE.md) для полного руководства по работе с улучшенной системой сегментов анимации, включая новые структурированные данные, примеры кода, troubleshooting и лучшие практики.

### 🆕 Новые возможности API (декабрь 2024)

#### Структурированные ответы сегментов:
```typescript
// Новые поля в AnimationSegment
interface AnimationSegment {
  status_description?: string;    // "✅ Video generated successfully"
  prompts?: {
    active_prompt: string;        // Активный промпт
    prompt_source: 'custom' | 'project_default';
  };
  generation?: {
    generator: string;            // "Google Veo 2.0"
    quality: string;              // "1280x720"
    estimated_time: string;       // "3-5 minutes"
  };
  actions?: {
    can_regenerate: boolean;      // Можно ли перегенерировать
    can_update_prompt: boolean;
  };
  urls?: {
    video_endpoint: string;       // Новый endpoint для видео
  };
}

// Новые поля в GenerateSegmentResponse
interface GenerateSegmentResponse {
  task_id: string;               // Для отладки Celery задач
  estimated_time: string;        // Ожидаемое время генерации
  monitoring: {
    status_endpoint: string;     // Готовый endpoint для polling
    poll_interval_seconds: number;
  };
  details: {
    generator: string;           // "Google Veo 2.0"
    user_control: boolean;
  };
}
```

### React Query хуки

```typescript
// Получение аватаров с автообновлением
const { data: avatars } = useAvatars();

// Создание аватара
const createMutation = useCreateAvatar();
createMutation.mutate({ prompt: "описание" });

// Текущий пользователь
const { data: user } = useCurrentUser();
```

## 🎨 Стилизация

### Tailwind CSS v4
- Используется новая версия Tailwind CSS v4
- Конфигурация через `@import "tailwindcss"` в `index.css`
- Кастомные компоненты с градиентами и анимациями

### Дизайн система
- Градиентные фоны (purple → pink → blue)
- Glass morphism эффекты
- Профессиональная типографика
- Отзывчивый дизайн (mobile-first)

## 🔍 Отладка

### Режим разработки
- React Query DevTools автоматически включается в dev режиме
- Debug компонент для диагностики изображений
- Подробное логирование в консоли

### Debug функции
```typescript
// Тестирование загрузки изображения
await testImageLoad(avatarId);

// Получение debug информации
const debugInfo = await api.get(`/avatars/debug/${avatarId}`);

// Очистка кэша
avatarImageCache.clear();
```

## 🚀 Развертывание

### Продакшен сборка
```bash
npm run build
npm run preview # предварительный просмотр
```

### Оптимизации
- Автоматический code splitting
- Минификация CSS и JS
- Оптимизация изображений
- Кэширование API запросов

## 📋 Полезные команды

```bash
# Разработка
npm run dev

# Сборка
npm run build

# Предварительный просмотр
npm run preview

# Проверка типов
npm run type-check

# Линтинг
npm run lint
```

## 🐛 Устранение неполадок

### Проблемы с изображениями
1. Проверьте токен авторизации в localStorage
2. Используйте Debug компонент для диагностики
3. Проверьте консоль браузера на ошибки API

### Проблемы с анимациями (404 ошибки)
🚨 **Получаете 404 при работе с сегментами?**
1. Проверьте авторизацию: `console.log('Token:', localStorage.getItem('token'))`
2. Убедитесь что сегменты созданы: подождите 30-60 секунд после создания проекта
3. Добавьте debug кнопку в AnimationStudio компонент
4. См. подробное руководство в [ANIMATION_API_GUIDE.md](./ANIMATION_API_GUIDE.md)

### Проблемы с CORS
- Убедитесь, что бэкенд запущен на localhost:8000
- Прокси настроен в vite.config.ts
- Перезапустите dev сервер после изменения прокси

### Проблемы с аутентификацией
- Проверьте наличие токенов в localStorage
- Убедитесь, что бэкенд API доступен
- Проверьте правильность URL API эндпоинтов

## 🤝 Вклад в проект

1. Используйте компонентную архитектуру
2. Следуйте принципам TypeScript
3. Добавляйте типы для всех API
4. Используйте React Query для сервера состояния
5. Тестируйте с Debug компонентами

---

**Автор:** AI Assistant  
**Версия:** 2.0.0  
**Дата:** 27 июня 2025
