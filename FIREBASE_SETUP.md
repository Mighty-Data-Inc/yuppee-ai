# Firebase Authentication Setup Guide

This guide walks you through setting up Google and Facebook authentication for Yuppee.AI.

## Overview

Yuppee.AI now requires users to authenticate via Google or Facebook before they can submit searches. The authentication system uses Firebase for both the frontend and backend.

### What Changed

- **Frontend**: Login modal appears when user clicks "Search" without being authenticated
- **Backend**: All `/search` and `/refine` endpoints now require an `Authorization: Bearer <token>` header with a valid Firebase ID token
- Users can sign up for free with one click using their existing Google or Facebook account

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"**
3. Enter project name: **Yuppee AI** (or your preferred name)
4. Click through the setup (you can disable Google Analytics for now)
5. Wait for the project to be created

---

## Step 2: Enable Google Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click **Google**
3. Enable it and provide:
   - **Project name**: (autofilled)
   - **Project support email**: (select your email)
4. Click **Save**

---

## Step 3: Enable Facebook Authentication (Optional but Recommended)

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click **Facebook**
3. You need a **Facebook App ID**:
   - Go to [Facebook Developers](https://developers.facebook.com/apps)
   - Create a new app (if you don't have one)
   - Get your **App ID** and **App Secret**
4. In Firebase, paste your **App ID** and **App Secret**
5. Copy the **OAuth Redirect URI** from Firebase
6. Go back to Facebook App → Settings → Basic → Add platforms → Web
7. Set **App Domains** to your domain (e.g., `localhost:5173` for local)
8. Set **Valid OAuth Redirect URIs** to the value from Firebase
9. Click **Save** in Firebase

---

## Step 4: Get Your Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Under **Your apps**, you should see a web app. If not:
   - Click **Create app** → Select **Web** → Register
3. Copy your Firebase config:
   ```javascript
   {
     "apiKey": "...",
     "authDomain": "...",
     "projectId": "...",
     "messagingSenderId": "...",
     "appId": "..."
   }
   ```

---

## Step 5: Configure Frontend Environment

1. In `yuppeeai-frontend/` directory, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase config in `.env.local`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   VITE_API_BASE_URL=http://localhost:3000
   ```

---

## Step 6: Configure Backend Environment

### For Local Development

1. In Firebase Console, go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key** (Node.js)
3. A JSON file will download - save it securely (e.g., `firebase-key.json`)
4. In `yuppeeai-backend/` directory, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

5. Update `.env` with:
   ```env
   FIREBASE_PROJECT_ID=your_firebase_project_id_here
   FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./firebase-key.json
   OPENAI_API_KEY=your_openai_api_key_here
   ```

6. Save the downloaded JSON file as `firebase-key.json` in the `yuppeeai-backend/` directory

### For AWS Lambda Deployment

For production Lambda deployment, you don't need the service account file. Instead:

1. Configure your Lambda execution role to have Firebase permissions
2. Firebase Admin SDK will automatically use Application Default Credentials (ADC)
3. In your `.env` (or Lambda environment variables):
   ```env
   FIREBASE_PROJECT_ID=your_firebase_project_id_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

---

## Step 7: Install Dependencies

In both directories, install the new dependencies:

```bash
# Frontend
cd yuppeeai-frontend
npm install

# Backend
cd yuppeeai-backend
npm install
```

---

## Step 8: Test Locally

### Start the backend:
```bash
cd yuppeeai-backend
npm run api:local
```

### In another terminal, start the frontend:
```bash
cd yuppeeai-frontend
npm run dev
```

### Visit `http://localhost:5173` and:
1. Type a search query
2. Click "Search"
3. The login modal should appear
4. Click "Sign in with Google" or "Sign in with Facebook"
5. Complete the authentication flow
6. You should be redirected back and the search should execute

---

## Troubleshooting

### "Firebase not initialized" error
- Make sure your `.env.local` file in the frontend has all required Firebase variables
- Check that the variables don't have quotes around the values

### "Invalid authorization token" on backend
- Ensure the frontend is sending the auth token: check browser Network tab
- Verify your Firebase Service Account JSON has access to the project
- Check that the backend `FIREBASE_PROJECT_ID` matches your Firebase project

### Facebook login not working
- Verify your OAuth Redirect URIs are correctly set in Facebook App Settings
- Check that your domain in Firebase is allowed (Settings → Authorized domains)
- Make sure your app is in development mode (Facebook Dashboard)

### CORS errors
- The backend CORS headers allow all origins by default (`Access-Control-Allow-Origin: *`)
- If this is too permissive, update `CORS_HEADERS` in `src/handlers/search.ts` and `src/handlers/refine.ts`

---

## Security Notes

⚠️ **Important for Production:**

1. **Never commit Firebase credentials** to version control:
   - Add `.env.local`, `.env`, and `firebase-key.json` to `.gitignore`
   - Use environment variables in CI/CD and Lambda

2. **Firebase Rules**: By default, Firebase Authentication is enabled for any app with valid credentials. Consider:
   - Setting up Firestore/Realtime Database security rules if you store user data
   - Using Firebase Security Rules to restrict API access

3. **Rate Limiting**: Consider adding rate limiting to your backend to prevent abuse

4. **Token Expiration**: Firebase ID tokens expire after 1 hour. The frontend automatically refreshes them

---

## Next Steps

After setting up authentication, you may want to:

- Add user profile pages
- Store user search history in Firestore
- Implement usage quotas per user
- Add email verification
- Implement password reset for email/password auth
