# Yuppee.AI

An AI-powered search engine that fills a niche between freeform text and traditional parameter-driven pattern-matching. Users can type natural language queries (like ChatGPT) and then drill down with dynamically generated filter widgets (like a domain-specific search system).

## Architecture

```
yuppee-ai/
├── yuppeeai-frontend/    # Vue 3 + Vite + TypeScript SPA
└── yuppeeai-backend/     # AWS Lambda handlers (Node.js + TypeScript)
```

## Features

- **Smart search bar** — Google-style search on the home screen, compact on results
- **SERP results** — Clean result cards with title, URL, and snippet; shimmer loading skeletons
- **Dynamic widget panel** — AI-generated filter widgets appear on the right (desktop) or bottom (mobile) based on the query:
  - Radio buttons (e.g. Fiction / Nonfiction)
  - Range sliders (e.g. publication year, book length)
  - Checkboxes (e.g. genre selection)
  - Dropdown menus (e.g. reading/scholarly level, content rating)
  - Freeform text refinement box
- **Adaptive widgets** — Widgets change based on what the user selects (e.g. choosing "Fiction" reveals a fiction-genre checkbox)
- **Preference memory** — Filter selections are persisted to `localStorage` and reapplied on future similar searches
- **Fully responsive** — Sidebar layout on desktop (≥768 px); stacked layout on mobile

## Frontend

### Setup

```bash
cd yuppeeai-frontend
npm install
```

### Development

```bash
npm run dev       # Vite dev server at http://localhost:5173
```

### Build

```bash
npm run build     # Type-checks and builds to yuppeeai-frontend/dist/
npm run preview   # Locally preview the production build
```

### Tests (Vitest)

```bash
npm test          # Run all 22 unit tests
npm run test:watch
```

## Backend (AWS Lambda)

Three Lambda handlers:

| Handler | Path | Description |
|---------|------|-------------|
| `search` | `src/handlers/search.ts` | Accepts `{ query, filters }`, returns SERP results |
| `widgets` | `src/handlers/widgets.ts` | Accepts `{ query, currentFilters }`, returns AI-generated widgets |
| `preferences` | `src/handlers/preferences.ts` | GET/POST user filter preferences (DynamoDB) |

### Setup

```bash
cd yuppeeai-backend
npm install
cp .env.example .env   # fill in your API keys
```

### Build

```bash
npm run build     # Compiles TypeScript to yuppeeai-backend/dist/
```

### Local Backend Development

Run the backend locally with a lightweight HTTP adapter that invokes the Lambda handlers directly.

```bash
cd yuppeeai-backend
npm run api:local
```

Local API base URL:

```text
http://localhost:3000
```

Current local route:

```text
POST /search
```

Notes:

- `USE_MOCK` defaults to `true` in local mode unless explicitly set to `false`.
- Use `npm run api:local:start` if you already built and only want to start the local API.

### Run Frontend Against Local Backend

Use two terminals.

Terminal 1 (backend):

```bash
cd yuppeeai-backend
npm run api:local
```

Terminal 2 (frontend):

```bash
cd yuppeeai-frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

The frontend reads `VITE_API_BASE_URL` from `yuppeeai-frontend/.env.local`, which is set to `http://localhost:3000` for local backend development.

### Tests (Jest)

```bash
npm test          # Run all 19 unit tests
```

### Configuration (`.env`)

| Variable | Purpose |
|----------|---------|
| `AWS_REGION` | AWS region for DynamoDB |
| `DYNAMODB_TABLE_NAME` | DynamoDB table for preferences |
| `SEARCH_PROVIDER_API_KEY` | Google Custom Search / SerpAPI key |
| `SEARCH_PROVIDER_ENGINE_ID` | Custom search engine ID |
| `OPENAI_API_KEY` | OpenAI key for widget generation |
| `OPENAI_MODEL` | Model name (default: `gpt-4o-mini`) |
| `USE_MOCK` | Set to `false` to use real APIs (default: `true`) |

### Deploying to AWS

The Lambda handlers in `yuppeeai-backend/dist/handlers/` can be deployed to AWS Lambda via the console, AWS CLI, or a framework such as the [Serverless Framework](https://www.serverless.com/) or [AWS SAM](https://aws.amazon.com/serverless/sam/).

Suggested API Gateway routes:

```
POST /search          → search handler
POST /widgets         → widgets handler
GET  /preferences     → preferences handler (userId query param)
POST /preferences     → preferences handler
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Vue 3 (`<script setup>` + Composition API) |
| Build tool | Vite 5 |
| Language | TypeScript 5 |
| State management | Pinia |
| Routing | Vue Router 4 |
| Frontend tests | Vitest + @vue/test-utils |
| Backend runtime | Node.js 20 |
| Backend tests | Jest + ts-jest |
| Search provider | Google Custom Search API (mock in dev) |
| RefinementWidget AI | OpenAI API (mock in dev) |
| Preferences store | AWS DynamoDB (mock in dev) |
| Hosting target | AWS Lambda + API Gateway |

