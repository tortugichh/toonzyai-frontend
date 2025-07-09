# ToonzyAI – Фронтенд
[Сайт проекта](https://toonzyai.me) • [Бекенд репозиторий](https://github.com/tortugichh/toonzyAI-backend)

Этот каталог содержит клиентскую часть ToonzyAI, написанную на **React + TypeScript** c использованием **Vite**, **TailwindCSS** и **React Query**.

## Быстрый старт

```bash
# 1. Установите зависимости
npm install         # или pnpm install / yarn

# 2. Создайте файл переменных окружения
touch .env.local
```

`.env.local` (пример):
```env

# URL API бекенда (по умолчанию на той же доменной зоне)
VITE_API_BASE=https://toonzyai.me
```

```bash
# 3. Запустите dev-сервер
npm run dev
```

Сайт будет доступен на `http://localhost:5173` (порт Vite по умолчанию).

## Основные скрипты
| npm script            | Описание                                   |
|-----------------------|--------------------------------------------|
| `dev`                 | Dev-сервер с HMR                           |
| `build`               | Сборка production в папку `dist/`          |
| `preview`             | Локальный сервер для собранного `dist/`    |
| `lint`                | ESLint + TypeScript                       |

## Структура проекта
```
src/
  assets/         статичные изображения / лого
  components/     переиспользуемые UI-компоненты
  hooks/          React-хуки для API/State
  pages/          страничные компоненты (router)
  services/       обёртки над API (axios)
  utils/          вспомогательные функции
  constants/      константы и настройки
```

## Google Analytics
Аналитика подключена в `index.html` тегом `gtag.js`. Measurement ID берётся напрямую из скрипта.
Если хотите переключать средами — оставьте тег, но удалите строку из `index.html` и задайте `VITE_GA_ID`.

Событие конверсии `sign_up` отправляется после успешной регистрации (**`src/utils/analytics.ts`** + вызов в `RegisterPage.tsx`).

## Docker (опционально)
Фронт собирается в многоэтапном Dockerfile бекенда (Nginx). Если нужен отдельный образ:
```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

## CI / Deployment
Предлагаемый флоу – Vercel:
1. Подключите репозиторий.
2. В `Build Command` — `npm run build`, `Output Directory` — `dist`.
3. Добавьте переменные окружения (начинаются с `VITE_`). 