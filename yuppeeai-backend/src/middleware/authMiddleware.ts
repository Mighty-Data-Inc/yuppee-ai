import * as admin from "firebase-admin";
import type { HttpRequest } from "../types";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as dotenvConfig } from "dotenv";

let envLoaded = false;

function loadBackendEnv(): void {
  if (envLoaded) {
    return;
  }

  // Load local env files regardless of process cwd (src/* and dist/* supported).
  // Prefer .env.local for local development overrides.
  const envCandidates = [
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), ".env"),
    resolve(__dirname, "../../.env.local"),
    resolve(__dirname, "../../.env"),
  ];

  for (const envPath of envCandidates) {
    if (existsSync(envPath)) {
      dotenvConfig({ path: envPath, override: false });
      break;
    }
  }

  // Firebase Admin token verification can use this environment variable.
  if (!process.env.GOOGLE_CLOUD_PROJECT && process.env.FIREBASE_PROJECT_ID) {
    process.env.GOOGLE_CLOUD_PROJECT = process.env.FIREBASE_PROJECT_ID;
  }

  envLoaded = true;
}

// Will be initialized via initializeFirebaseAdmin
let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK for auth verification
 * Must be called once before using verifyAuthToken
 */
export function initializeFirebaseAdmin(
  serviceAccountKeyPath?: string,
): admin.app.App {
  loadBackendEnv();

  if (firebaseApp) return firebaseApp;

  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

  try {
    if (serviceAccountKeyPath) {
      const serviceAccount = require(serviceAccountKeyPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
      });
    } else {
      // Use Application Default Credentials in production (Firebase Cloud Functions)
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
    }
  } catch (err) {
    console.error("Failed to initialize Firebase Admin SDK:", err);
    // For local development, you might want to initialize with a dummy app
    // This allows the app to start without valid credentials
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Warning: Firebase Admin SDK not initialized properly. Auth will fail.",
      );
      // Initialize a dummy app for local development
      firebaseApp = admin.initializeApp({
        projectId,
      });
    } else {
      throw err;
    }
  }

  return firebaseApp;
}

/**
 * Extract and verify Firebase ID token from Authorization header
 * Throws an error with message and statusCode if verification fails
 */
export async function verifyAuthToken(
  event: HttpRequest,
): Promise<admin.auth.DecodedIdToken> {
  loadBackendEnv();

  const authHeader =
    event.headers?.Authorization || event.headers?.authorization;

  if (!authHeader) {
    const error = new Error("Missing Authorization header");
    (error as any).statusCode = 401;
    throw error;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match) {
    const error = new Error("Invalid Authorization header format");
    (error as any).statusCode = 401;
    throw error;
  }

  const token = match[1];

  try {
    if (!firebaseApp) {
      throw new Error("Firebase Admin SDK not initialized");
    }
    const auth = admin.auth(firebaseApp);
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (err) {
    console.error("Token verification failed:", err);
    const error = new Error("Invalid or expired authentication token");
    (error as any).statusCode = 401;
    throw error;
  }
}

/**
 * Middleware to require authentication
 * Adds user info to the event context if authentication succeeds
 */
export async function requireAuth(
  event: HttpRequest,
): Promise<admin.auth.DecodedIdToken> {
  return verifyAuthToken(event);
}
