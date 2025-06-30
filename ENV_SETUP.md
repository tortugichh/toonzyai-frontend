# Настройка переменных окружения

## Локальная разработка

Создайте файл `.env` в корне проекта со следующими переменными:

```bash
# Google Analytics ID
VITE_GA_ID=G-934HEWF6QQ

# API Configuration (опционально)
VITE_API_BASE_URL=http://localhost:8000

# Environment
NODE_ENV=development
```

## Vercel Deployment

В настройках проекта Vercel добавьте следующие переменные окружения:

1. Перейдите в Dashboard Vercel → Ваш проект → Settings → Environment Variables
2. Добавьте переменную:
   - **Name**: `VITE_GA_ID`
   - **Value**: `G-934HEWF6QQ`
   - **Environments**: Production, Preview, Development

## Другие платформы

Для других платформ деплоя (Netlify, Railway, etc.) добавьте переменную окружения:
- `VITE_GA_ID=G-934HEWF6QQ`

## Как это работает

- Переменные окружения с префиксом `VITE_` автоматически доступны в клиентском коде
- Google Analytics инициализируется только если переменная `VITE_GA_ID` установлена
- Если переменная не найдена, Analytics не будет загружен (безопасно для разработки)

## Использование Analytics в коде

```typescript
import { trackEvent, trackPageView } from '@/utils/analytics';

// Отслеживание события
trackEvent('button_click', 'user_interaction', 'create_avatar');

// Отслеживание просмотра страницы
trackPageView('/avatars', 'Avatars Page');
``` 