# Firebase Authentication Setup Guide

This guide covers Firebase setup for local development and deployment of Yuppee.AI.

## Overview

Yuppee.AI requires users to authenticate before using search APIs. The frontend signs users in with Firebase Auth, then sends Firebase ID tokens to the backend.

Current protected endpoints:

- `POST /api/search`
- `POST /api/refine`
- `POST /api/inflightmsg`
- `GET /api/usage`

## Step 1: Create A Firebase Project

1. Open Firebase Console: <https://console.firebase.google.com>
2. Create a new project
3. Keep your project ID handy (used by frontend and backend)

## Step 2: Enable Sign-In Providers

1. Go to Authentication -> Sign-in method
2. Enable Google
3. Optionally enable Facebook and complete its OAuth setup in Meta Developer Console

## Step 3: Create/Find Web App Config

1. In Project Settings, open Your Apps
2. Register a web app if needed
3. Copy config values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `messagingSenderId`
   - `appId`

## Step 4: Configure Frontend Environment

Create `yuppeeai-frontend/.env.local` (from `.env.example`) and set:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_BASE_URL=http://localhost:3000
```

Notes:

- For production with Firebase Hosting rewrites, `VITE_API_BASE_URL` can be left blank.
- Local development typically points to `http://localhost:3000` (backend local adapter).

## Step 5: Configure Backend Environment

Create `yuppeeai-backend/.env` (from `.env.example`) and set:

```env
OPENAI_API_KEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./firebase-key.json
```

Local development:

1. In Firebase Console -> Project Settings -> Service Accounts
2. Generate a new private key (JSON)
3. Save it as `yuppeeai-backend/firebase-key.json` (or update the env var to match your path)

Deployment to Firebase Functions:

- Service account key file is not required in runtime.
- Firebase Admin uses Application Default Credentials in Cloud Functions.

## Step 6: Install And Run Locally

At repository root:

```bash
npm install
```

In separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Open <http://localhost:5173> and test:

1. Submit a query
2. Authenticate if prompted
3. Verify results, refinement widgets, and usage behavior

## Troubleshooting

Frontend cannot initialize Firebase:

- Verify all `VITE_FIREBASE_*` variables are present
- Restart Vite after updating `.env.local`

Backend returns 401 Unauthorized:

- Confirm frontend includes `Authorization: Bearer <token>`
- Confirm `FIREBASE_PROJECT_ID` matches the auth project
- Confirm local service account key path is valid (if using local key file)

Backend returns quota errors (429):

- This is expected when monthly quota is exhausted
- Use `GET /api/usage` to inspect tier and period usage data

Facebook sign-in issues:

- Verify redirect URIs and authorized domains in both Firebase and Meta app config

## Security Notes

- Never commit `.env`, `.env.local`, or service account key JSON files
- Prefer runtime environment variables/secrets in CI/CD and production
- Restrict CORS and apply rate limits as needed for your deployment posture
