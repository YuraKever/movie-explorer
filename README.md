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
- 🔐 **Аккаунты** — регистрация и вход по email + паролю (Better Auth), сессия в httpOnly-cookie
- ❤️ **Избранное у каждого своё** — хранится на сервере (Postgres) и привязано к аккаунту; при первом входе разово переносится из старого `localStorage`
- 🌗 **Тёмная/светлая тема** без «мигания» при загрузке
- 📱 **Адаптив** от 320px
- ♿ Обработаны все состояния: loading (skeleton), error, empty, 404

## Стек

| | |
|---|---|
| **Framework** | Next.js 16 (App Router, RSC + Client Components) |
| **Язык** | TypeScript, React 19 |
| **Стили** | Tailwind CSS v4 |
| **Данные (клиент)** | TanStack Query — кэш, бесконечная лента, оптимистичный toggle избранного |
| **Аутентификация** | Better Auth — email + пароль, сессии в cookie |
| **База данных** | PostgreSQL + Drizzle ORM (локально — Docker, прод — Neon) |
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
- **Избранное — на сервере и у каждого своё.** Таблица `favorites` в Postgres с
  `UNIQUE(user_id, movie_id)`; чтение и мутации — через route handlers под сессией.
  На клиенте — TanStack Query с **оптимистичным** toggle (мгновенный отклик, откат при ошибке).
- **Аутентификация — Better Auth** (email + пароль), сессия в httpOnly-cookie. Проверку
  сессии централизует **DAL** (`lib/dal.ts`, мемоизация через React `cache`), а не layout —
  как советует гайд Next. Схему таблиц auth сгенерировал CLI Better Auth поверх Drizzle.
- **Proxy вместо middleware** (переименование в Next 16): оптимистичный редирект — гостя с
  `/favorites`, залогиненного со страниц входа — по наличию cookie, без похода в БД. Настоящая
  проверка живёт ближе к данным: в самой странице (`requireUser`) и в API-роутах.
- **Миграция без потерь:** при первом входе избранное из старого `localStorage` разово
  переносится на сервер (`/api/favorites/import`) и очищается локально только после успеха.

## Структура

```
src/
├── app/                      # маршруты (App Router)
│   ├── page.tsx              # главная — тренды (RSC)
│   ├── movie/[id]/           # детальная + loading-скелет
│   ├── discover/ · search/   # каталог с фильтрами · поиск
│   ├── favorites/            # избранное (защищено, requireUser)
│   ├── (auth)/login·register # экраны входа/регистрации (route group)
│   ├── api/tmdb/[...path]/   # прокси к TMDB (ключ на сервере)
│   ├── api/auth/[...all]/     # эндпоинт Better Auth
│   ├── api/favorites/         # CRUD избранного + /import
│   ├── error.tsx · not-found.tsx · loading.tsx
├── components/               # MovieCard/Grid, Filters, AuthNav, auth/*-form, …
├── features/movies/          # api (client) · api.server (RSC) · queries · types
├── features/favorites/       # api · api.server (Drizzle) · queries · migrate-local
├── lib/db/                   # клиент Drizzle · schema · auth-schema (CLI)
├── lib/auth.ts · auth-client.ts · dal.ts   # Better Auth + проверка сессии
├── providers/                # QueryProvider · ThemeProvider
├── lib/tmdb.ts               # серверный клиент TMDB + помощники
proxy.ts (src/) · drizzle.config.ts · docker-compose.yml
```

## Локальный запуск

```bash
# 1. Node 22 (см. .nvmrc)
nvm use

# 2. Зависимости
npm install

# 3. .env.local (шаблон в .env.example):
#    TMDB_ACCESS_TOKEN=eyJ...                 # v4 Read Access Token с themoviedb.org
#    DATABASE_URL=postgres://movie:movie@localhost:5432/movie_explorer
#    BETTER_AUTH_SECRET=...                    # openssl rand -base64 32
#    BETTER_AUTH_URL=http://localhost:3000

# 4. Postgres в Docker + схема
docker compose up -d db     # локальная база из docker-compose.yml
npm run db:migrate          # применить миграции Drizzle

# 5. Запуск
npm run dev                 # http://localhost:3000
```

**Работа с БД:** `npm run db:generate` — создать миграцию из изменённой схемы,
`npm run db:migrate` — применить, `npm run db:studio` — GUI Drizzle Studio.
Схему таблиц Better Auth (при изменении конфига auth) регенерирует
`npx @better-auth/cli generate --config src/lib/auth.ts --output src/lib/db/auth-schema.ts`.

**Деплой на Vercel:** заведите БД в [Neon](https://neon.tech) (тот же драйвер `pg`, меняется
лишь `DATABASE_URL`) и добавьте в переменные окружения `TMDB_ACCESS_TOKEN`, `DATABASE_URL`,
`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (прод-домен). Миграции — `npm run db:migrate` на
строке подключения Neon.

## Чему научился

- **App Router на практике:** где действительно нужен RSC, а где Client Component; как
  не протащить серверный код в клиентский бандл (разделение `api` / `api.server`).
- **Next.js 16 ≠ то, что было раньше:** `params`/`searchParams` теперь промисы, prop
  `priority` у `next/image` устарел (вместо него `loading="eager"`/`preload`), в Tailwind v4
  классовая тёмная тема настраивается через `@custom-variant`. Привычку «писать по памяти»
  пришлось заменить на чтение доков перед кодом.
- **Гидрация — это про совпадение сервера и клиента:** тема и состояние авторизации
  (сессия резолвится на клиенте) требуют аккуратной начальной отрисовки, иначе React
  ругается и UI «мигает».
- **Аутентификация и per-user данные:** сессии в httpOnly-cookie, проверка близко к
  данным (DAL + API-роуты, а не только layout/proxy), защита от open-redirect, перенос
  старого `localStorage`-избранного на сервер без потерь при первом входе.
- **URL как состояние:** фильтры и поиск в `searchParams` — бесплатный шаринг и history.
- **Безопасность по умолчанию:** прокси-паттерн, чтобы секрет не утёк в клиент.

## Методология

Проект строился методом **tracer bullet** из «The Pragmatic Programmer»: сначала тонкий
сквозной срез через все слои, затем наращивание функционала фазами. Полный план и статус —
в [`PLAN.md`](./PLAN.md).

---

Данные предоставлены [TMDB](https://www.themoviedb.org/), но продукт не одобрен и не
сертифицирован TMDB.
