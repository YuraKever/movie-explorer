# 🤖 Movie Explorer — план RAG: семантический поиск и AI-советник

**Цель:** пользователь пишет «что-то атмосферное про одиночество в космосе, не слишком
длинное» и получает карточки фильмов из нашей базы, у каждой одна строка «почему подходит».

**RAG (Retrieval-Augmented Generation):** перед вызовом LLM мы **находим** в своих данных
релевантные документы и **подкладываем** их в промпт. Модель отвечает по нашим данным, а не
по памяти.

```
ИНДЕКСАЦИЯ (офлайн, один раз / по крону)
  TMDB → текст документа → embedMany() → векторы → Postgres (pgvector)

ЗАПРОС (на каждый вопрос)
  вопрос → embed() → поиск ближайших векторов → top-K фильмов
        → промпт «выбирай только из этих фильмов» → LLM → { picks: [{ movieId, reason }] }
```

**Порядок:** сначала **R** (поиск), потом **G** (генерация). Поиск можно увидеть и проверить
руками без LLM. Если он плохой, никакая модель ответ не спасёт. Методология та же, что в
[PLAN.md](PLAN.md): tracer bullet, каждый шаг — рабочий вертикальный срез.

---

## Шаг 0 — Решения до кода

| Вопрос | Решение | Почему |
|---|---|---|
| Где крутятся модели | **Локально, Ollama** (`http://localhost:11434/v1`) | Бесплатно, без ключей, работает офлайн |
| Как подключаем | `@ai-sdk/openai-compatible` | Ollama говорит на OpenAI-совместимом API; сменить на облако = поменять `AI_BASE_URL` |
| Модель эмбеддингов | `qwen3-embedding:0.6b` (1024 измерения, 639 MB) | Мультиязычная: русский запрос находит английское описание |
| Модель генерации | `qwen3:4b-instruct` (2.5 GB) | Instruct-версия отвечает сразу; обычная `qwen3:4b` всегда «думает» и игнорирует `think:false` |
| Объём индекса | ~2–5 тыс. фильмов (top_rated + popular) | Локально бесплатно, поиск уже интересный |
| Кто может спрашивать | Только залогиненные | Модель на сервере — ресурс; `dal.ts` уже есть |

- [x] Зависимости `ai` + `@ai-sdk/openai-compatible`
- [x] Локальные модели вместо облака
- [x] `/ask` только для залогиненных

**Важно:** модель эмбеддингов потом нельзя сменить без полной переиндексации, а размерность
вектора зашита в схему БД.

---

## Шаг 1 — Инфраструктура: pgvector

- [x] `docker-compose.yml`: `postgres:17` → `pgvector/pgvector:pg17-trixie` (volume и формат данных
      те же; именно `-trixie`, иначе glibc старше и Postgres ругается на collation version mismatch)
- [x] `.github/workflows/ci.yml`: сервис e2e `postgres:17-alpine` → `pgvector/pgvector:pg17-trixie`,
      иначе миграция упадёт в CI
- [x] Кастомная миграция `npx drizzle-kit generate --custom --name enable_pgvector`:
      `CREATE EXTENSION IF NOT EXISTS vector;`

**Проверка руками:**
`docker exec -it movie-explorer-db psql -U movie -d movie_explorer -c "\dx"`. В списке есть `vector`.

**Что понять:** pgvector добавляет тип `vector(N)` и операторы расстояния (`<=>` — косинусное).
Отдельная векторная БД (Pinecone и т.п.) не нужна: 5 тыс. векторов для Postgres — мелочь.

---

## Шаг 2 — Зависимость, модели и env

- [x] `brew install ollama && brew services start ollama`
- [x] `ollama pull qwen3-embedding:0.6b && ollama pull qwen3:4b-instruct`
- [x] `npm i ai @ai-sdk/openai-compatible`
- [x] `src/lib/ai.ts`: провайдер + `embeddingModel`, `chatModel`, `EMBEDDING_DIMENSIONS`
- [x] `src/lib/env.ts`: `AI_BASE_URL` как **optional** url (по умолчанию локальная Ollama)
- [x] `.env.example`: секция `# --- AI (RAG) ---` (переменная закомментирована: пустая строка
      не прошла бы валидацию)

**Что понять:**
- Модели — **константы в коде**, а не env: размерность вектора зашита в схему БД, и
  «случайно» сменить модель через env значило бы сломать поиск без единой ошибки.
- Холодный старт: первый запрос к модели ~100 с (загрузка в память), дальше 1–8 с.
  Ollama выгружает модель через 5 минут простоя.

--- AI ---` с комментарием, где взять ключ

---

## Шаг 3 — Схема

Новый файл `src/lib/db/movie-embeddings-schema.ts`, экспорт в `schema.ts` (как favorites):

```
movie_embeddings
  movie_id      integer PK        — TMDB id
  content       text              — ровно тот текст, который эмбеддили
  content_hash  text              — чтобы не переэмбеддить неизменившееся
  embedding     vector(1024)
  updated_at    timestamp
  + HNSW-индекс по embedding (vector_cosine_ops)
```

- [x] Схема + `npm run db:generate` + `npm run db:migrate`

**Что понять:**
- **Зачем хранить `content`:** для отладки («почему он нашёл это?») и чтобы положить его в
  промпт на шаге G без лишнего запроса в TMDB.
- **HNSW** — индекс для *приблизительного* поиска ближайших соседей. Без него Postgres
  сравнивает запрос со всеми строками. На 5 тыс. строк и это быстро, но индекс — правильная
  привычка и вопрос на собеседовании: «exact vs approximate nearest neighbours».
- **Cosine:** важен угол между векторами, а не длина. Стандарт для текстовых эмбеддингов.

---

## Шаг 4 — Индексация (главный шаг для качества)

Скрипт `scripts/index-movies.ts` → `npm run ai:index`.

- [x] Собрать id: несколько страниц `movie/top_rated` и `movie/popular` через `tmdbFetch`, без дублей
- [x] Детали каждого фильма: `movie/{id}?append_to_response=keywords`, с небольшой
      параллельностью (лимиты TMDB)
- [x] Чистая функция `buildMovieDocument(movie): string`:
  ```
  Interstellar (2014). Genres: Adventure, Drama, Science Fiction.
  Tagline: Mankind was born on Earth. It was never meant to die here.
  Keywords: space travel, black hole, father daughter relationship, …
  Runtime: 169 min.
  Overview: The adventures of a group of explorers who …
  ```
- [x] Hash текста, пропуск фильмов с совпадающим hash (повторный запуск почти бесплатен)
- [x] `embedMany` батчами (~100) с `maxParallelCalls: 2`
- [x] Upsert: `insert … onConflictDoUpdate`

**Проверка руками:** `select movie_id, left(content, 80) from movie_embeddings limit 5;`
и `select count(*) from movie_embeddings;`

**Что понять:**
- **Качество RAG на 80% определяется тем, что ты эмбеддишь.** Если в тексте есть только
  название, ищется только по названию. Keywords из TMDB сильно улучшают поиск.
- **Chunking здесь не нужен:** один фильм = один короткий документ. Длинные тексты (статьи,
  PDF) режут на куски по ~500–1000 токенов с перекрытием, и один источник даёт много векторов.
  Важно понимать, что мы сознательно этого не делаем и почему.
- **Индексация — офлайн-процесс**, не часть запроса пользователя. В проде она идёт по крону или
  при появлении новых данных.
- **Техническое:** скрипт запускается через `tsx` (явная devDependency): он понимает TypeScript
  и алиас `@/`; `--env-file-if-exists=.env.local` подгружает env **до** импортов (пул БД
  создаётся при импорте `@/lib/db`).
- **Результат первого прогона:** 883 фильма за ~84 с; повторный прогон — 0 к эмбеддингу.

---

## Шаг 5 — Retrieval

`src/features/ai/retrieve.server.ts` (стиль `*.server.ts`, как в `features/movies`):

```
findSimilarMovies(query, { k = 8 }) →
  1. embed(query) ТОЙ ЖЕ моделью, что при индексации
  2. SELECT … ORDER BY embedding <=> $queryVector LIMIT k
  3. [{ movieId, content, distance }]
```

- [x] Функция поиска
- [x] Порог по `distance`: если даже лучший результат далеко, вернуть «ничего не нашёл»

- [x] Инструкция к запросу (`embeddingQuery` в `ai.ts`): Qwen3-Embedding асимметричная.
      Начало 8 → 1 место, Матрица 3 → 1, Заклятие 3 → 1; Интерстеллар 1 → 3 (в топе остался)
- [x] `MAX_DISTANCE = 0.55`: релевантное ≤ 0.54, «asdf qwerty» 0.59, «рецепт борща» 0.67

**Отложено до evals (шаг 9):** служебные keywords TMDB (`aftercreditsstinger`,
`duringcreditsstinger`) размывают вектор — кандидат на фильтр в `buildMovieDocument`.

**Что понять:**
- Запрос и документы эмбеддятся **одной моделью**. Это самая частая ошибка.
- `ORDER BY distance` по возрастанию: только в такой форме используется HNSW-индекс.
  Сортировка по `1 − distance` DESC выглядит так же, но индекс не задействует.

---

## Шаг 6 — Семантический поиск без LLM (первый видимый результат)

- [x] На `/search` режим «по смыслу»: результаты `findSimilarMovies` рендерятся через
      `movie-grid` / `MovieCard`, постеры и рейтинг по id из TMDB

- [x] Переключатель режимов (`By title` / `By meaning`), режим в URL (`?mode=meaning`)
- [x] Результаты рендерятся на сервере (`SemanticResults`) внутри `<Suspense key={query}>`
- [x] Состояния: скелетон, «ничего близкого», ошибка (Ollama выключена) без утечки деталей
- [x] `SkeletonGrid` вынесен в `movie-grid.tsx` (было 2 копии)

**Чекпоинт — поиграть с запросами:**
- «фильм про сон внутри сна» → должно найти Начало;
- «Keanu Reeves» → скорее всего найдёт плохо. **Это урок:** векторы ловят смысл, а не
  точные имена. Решение — гибридный поиск (шаг 10).

---

## Шаг 7 — Генерация: `/api/ask`

`src/app/api/ask/route.ts`, конвейер:

- [ ] **Auth:** только залогиненные (через `dal.ts`)
- [ ] **Rate limit:** вынести `rateLimit()` из `api/tmdb/[...path]/route.ts` в
      `src/lib/rate-limit.ts`, переиспользовать со своим лимитом (~10 запросов в минуту), без копипасты
- [ ] **Валидация Zod:** `question` — строка от 3 до 300 символов
- [ ] **Retrieve:** `findSimilarMovies(question, { k: 8 })`
- [ ] **Generate** со structured output и Zod-схемой:
      `{ picks: [{ movieId: number, reason: string }] (0–5), note?: string }`.
      System prompt: «Выбирай ТОЛЬКО из списка ниже. Если ничего не подходит — пустой picks и
      объяснение в note. Отвечай на языке вопроса.»
- [ ] **Защита от галлюцинаций:** выбросить `picks`, чей `movieId` не входит в найденные.
      Ответ модели — тоже непроверенный ввод
- [ ] Вернуть JSON, клиент рендерит карточки + `reason`

**Что понять:**
- **Structured output, а не текст:** результат — это данные (id), а не абзац. Его можно
  проверить и отрисовать нашими же компонентами.
- **Пока без стриминга:** ответ короткий, а structured output со стримингом сложнее. Стриминг
  (`streamText` + `useChat`) — отдельный урок позже.
- **Prompt injection:** пользователь может написать «игнорируй инструкции». У модели нет tools,
  она видит только список фильмов и ничего не может «сделать», поэтому риск минимален. Стоит
  понимать, *почему* он минимален.
- Точные API AI SDK 7 (`generateText` + схема вывода, мок-модели) сверять с
  `node_modules/ai/docs`, по памяти не писать.

---

## Шаг 8 — UI советника

- [ ] Страница `/ask` (или блок на главной): поле ввода, кнопка, состояния loading / empty / error
- [ ] Результат: сетка `MovieCard` с подписью «почему»
- [ ] Запрос через TanStack Query `useMutation`
- [ ] Гость: CTA «Войдите, чтобы спросить»
- [ ] `aria-live` для результата (как в фиде из Phase 11)

---

## Шаг 9 — Тесты и evals

**Unit (Vitest, в CI, без сети):**
- [x] `buildMovieDocument`: тест точного текста документа (сделано в шаге 4)
- [ ] Фильтр галлюцинаций: id не из выдачи отбрасываются
- [ ] `/api/ask`: 401 без сессии, 400 на плохой вход, 429 при превышении лимита; модель мокается

**Evals (`npm run ai:eval`, НЕ в CI: нужны реальная БД и ключ):**
- [ ] `evals/queries.json`: 15–20 запросов с ожидаемыми фильмами:
      `{ "q": "dream within a dream heist", "expect": [27205] }`
- [ ] Метрика **recall@8**: в какой доле запросов ожидаемый фильм попал в top-8
- [ ] Прогонять до и после изменений (формат документа, модель, k) и сравнивать цифру

**Что понять:** это главное отличие «сделал RAG по туториалу» от «понимаю RAG». Убираешь
keywords из `buildMovieDocument` → видишь, как упал recall. Качество меряется, а не ощущается.

---

## Шаг 10 — (Опционально) Улучшения, каждое как отдельный урок

- [ ] **Гибридный поиск:** Postgres full-text (`tsvector`) + векторы, объединение через
      Reciprocal Rank Fusion. Лечит «Keanu Reeves»
- [ ] **Фильтры + вектор:** «после 2010, рейтинг > 7» = WHERE по метаданным + ORDER BY по вектору
- [ ] **Reranking:** top-30 векторным поиском → reranker-модель → top-8
- [ ] **Стриминг** ответа

---

## Шаг 11 — Прод

- [ ] Neon: расширение приедет с миграцией; проверить доступность pgvector на тарифе
- [ ] Решить, где крутятся модели в проде: Vercel не достучится до локальной Ollama.
      Варианты: облачный OpenAI-совместимый endpoint через `AI_BASE_URL` (модели те же → без
      переиндексации) или облачные модели + переиндексация
- [ ] Один раз запустить `ai:index` против прод-БД
- [ ] README + PLAN.md: новая фаза, схема архитектуры, цифра recall из evals

---

## Порядок коммитов

1. `chore: switch Postgres to the pgvector image and enable the extension`
2. `feat: add the movie_embeddings table and the indexing script`
3. `feat: semantic search mode on /search` ← **первый видимый результат**
4. `refactor: extract the rate limiter`
5. `feat: /api/ask with structured picks`
6. `feat: /ask page`
7. `test: unit tests + eval script with recall@k`

**Done when:** на проде `/ask` возвращает релевантные фильмы с объяснениями, recall@8 записан
в README, CI зелёный.
**NOT doing:** отдельная векторная БД, chunking, агенты с tools, fine-tuning — для каталога
фильмов это лишнее.
