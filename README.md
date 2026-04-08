# Yuppee.AI

Yuppee.AI is an AI-assisted search experience that combines natural-language search with dynamic refinement controls.

Users start with a plain-language query, then iteratively tighten scope using generated widgets and additional instructions.

## Architecture

This repository is a monorepo with three main workspaces:

- `yuppeeai-frontend`: Vue 3 + Vite SPA
- `yuppeeai-backend`: TypeScript Firebase Functions backend (plus local HTTP adapter for development)
- `packages/yuppeeai-contracts`: Shared request/response and UI contract types

## Product Surface

Current user-facing flow:

- Authentication via Firebase (Google/Facebook)
- Query submission from the home/search views
- AI-generated SERP with concise top summary and ranked results
- AI-generated refinement widgets and optional disambiguation suggestions
- Inflight status message while results are loading
- Usage-aware experience with monthly quota enforcement

## API Surface

When running locally via the backend adapter (default `http://localhost:3000`) or through Firebase Hosting rewrites, the app uses:

- `POST /search`: Returns SERP summary + results and consumes one search from the current monthly quota
- `POST /refine`: Returns refinement widgets and optional disambiguation alternatives
- `POST /inflightmsg`: Returns a short in-progress message for the current query
- `GET /usage`: Returns tier and quota usage information for the authenticated user

All routes require a valid Firebase ID token (`Authorization: Bearer <token>`).

## Local Development

Install dependencies once at repository root:

```bash
npm install
```

Run frontend and backend in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Frontend runs at `http://localhost:5173`.

## Workspace Scripts

Common root-level scripts:

- `npm run build`: Build all workspaces
- `npm run test`: Run tests across workspaces
- `npm run typecheck`: Build shared contracts, then typecheck backend and frontend

## Deployment

Deployment is configured through Firebase:

- Frontend hosting target: `yuppee-ai-frontend`
- Backend codebase: `yuppeeai-backend`
- Hosting rewrites route `/search`, `/refine`, `/inflightmsg`, and `/usage` to Cloud Functions

See `firebase.json` for the authoritative deployment mapping.

## Notes

- The backend local adapter in `yuppeeai-backend/src/localApi.ts` mirrors the same route contract used by Firebase Hosting rewrites.
- Shared types in `@yuppee-ai/contracts` are the source of truth for request/response shapes used by both frontend and backend.
