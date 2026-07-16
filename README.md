# 🎬 Movie Explorer

Веб-приложение для поиска и просмотра фильмов на данных [TMDB](https://www.themoviedb.org/).
Pet-проект для frontend-портфолио — не «учебное задание», а законченный продукт с
живым деплоем.

> **🔗 Live-демо:** _скоро — деплой на Vercel_

![Главная — тёмная тема](docs/screenshots/home-dark.jpg)

---

## Возможности

- 🔥 **Тренды недели** на главной (SSR)
- 🗂 **Каталог** с фильтрами (жанр / год / сортировка) и **бесконечной лентой**
- 🔎 **Поиск** по названию с debounce
- 🎬 **Детальная страница**: постер, рейтинг, жанры, трейлер (YouTube), актёрский состав, похожие фильмы
- ❤️ **Избранное** — сохраняется в браузере и переживает перезагрузку
- 🌗 **Тёмная/светлая тема** без «мигания» при загрузке
- 📱 **Адаптив** от 320px
- ♿ Обработаны все состояния: loading (skeleton), error, empty, 404

## Стек

| | |
|---|---|
| **Framework** | Next.js 16 (App Router, RSC + Client Components) |
| **Язык** | TypeScript, React 19 |
| **Стили** | Tailwind CSS v4 |
| **Данные (клиент)** | TanStack Query — кэш, бесконечная лента |
| **Состояние** | Zustand + persist (избранное) |
| **Тема** | next-themes |
| **API** | TMDB |
| **Деплой** | Vercel |

## Скриншоты

| Главная (светлая) | Детальная страница |
|---|---|
| ![](docs/screenshots/home-light.jpg) | ![](docs/screenshots/movie-dark.jpg) |

| Каталог с фильтрами | Мобильная версия |
|---|---|
| ![](docs/screenshots/discover-dark.jpg) | <img src="docs/screenshots/mobile-dark.jpg" width="240" /> |

## Архитектура: что интересного

- **Ключ TMDB никогда не покидает сервер.** Клиентские запросы идут через
  Route Handler-прокси `app/api/tmdb/[...path]`, который подставляет ключ на сервере.
  В бандле и в Network клиента ключа нет — отдельный плюс на собеседовании.
- **RSC там, где можно; клиент — где нужен интерактив.** Главная и детали серверные
  (SSR + кэш `fetch`), поиск / лента / избранное — клиентские.
- **Данные разделены на клиент и сервер:** `features/movies/api.ts` (клиент, через
  прокси) и `api.server.ts` (RSC, напрямую с ключом) — клиентский бандл не тянет
  серверный код.
- **Переиспользуемая бесконечная лента** — `InfiniteMovieGrid` поверх `useInfiniteQuery`
  + `IntersectionObserver`; один компонент и в каталоге, и в поиске.
- **Фильтры и запрос живут в URL** (`searchParams`) — подборку можно расшарить, она
  переживает перезагрузку. Читаем их **на сервере**, чтобы обойти Suspense-границу
  `useSearchParams`.
- **Тема без мигания** — next-themes выставляет класс до первой отрисовки, а Tailwind v4
  переключён на классовый вариант через `@custom-variant dark`.
- **Избранное без hydration-ошибок** — флаг гидрации на `useSyncExternalStore`.

## Структура

```
src/
├── app/                      # маршруты (App Router)
│   ├── page.tsx              # главная — тренды (RSC)
│   ├── movie/[id]/           # детальная + loading-скелет
│   ├── discover/             # каталог с фильтрами
│   ├── search/               # поиск
│   ├── favorites/            # избранное
│   ├── api/tmdb/[...path]/   # прокси к TMDB (ключ на сервере)
│   ├── error.tsx · not-found.tsx · loading.tsx
├── components/               # MovieCard/Grid, Filters, InfiniteMovieGrid, …
├── features/movies/          # api (client) · api.server (RSC) · queries · types
├── store/favorites.ts        # Zustand + persist
├── providers/                # QueryProvider · ThemeProvider
├── hooks/ · lib/tmdb.ts       # серверный клиент TMDB + помощники
```

## Локальный запуск

```bash
# 1. Node 22 (см. .nvmrc)
nvm use

# 2. Зависимости
npm install

# 3. Ключ TMDB → .env.local (шаблон в .env.example)
#    TMDB_ACCESS_TOKEN=eyJ...   (v4 Read Access Token с themoviedb.org)

# 4. Запуск
npm run dev        # http://localhost:3000
```

Для деплоя на Vercel добавьте `TMDB_ACCESS_TOKEN` в переменные окружения проекта.

## Чему научился

- **App Router на практике:** где действительно нужен RSC, а где Client Component; как
  не протащить серверный код в клиентский бандл (разделение `api` / `api.server`).
- **Next.js 16 ≠ то, что было раньше:** `params`/`searchParams` теперь промисы, prop
  `priority` у `next/image` устарел (вместо него `loading="eager"`/`preload`), в Tailwind v4
  классовая тёмная тема настраивается через `@custom-variant`. Привычку «писать по памяти»
  пришлось заменить на чтение доков перед кодом.
- **Гидрация — это про совпадение сервера и клиента:** тема и избранное (данные из
  `localStorage`, которых нет на сервере) требуют аккуратного флага гидрации, иначе
  React ругается и UI «мигает».
- **URL как состояние:** фильтры и поиск в `searchParams` — бесплатный шаринг и history.
- **Безопасность по умолчанию:** прокси-паттерн, чтобы секрет не утёк в клиент.

## Методология

Проект строился методом **tracer bullet** из «The Pragmatic Programmer»: сначала тонкий
сквозной срез через все слои, затем наращивание функционала фазами. Полный план и статус —
в [`PLAN.md`](./PLAN.md).

---

Данные предоставлены [TMDB](https://www.themoviedb.org/), но продукт не одобрен и не
сертифицирован TMDB.
