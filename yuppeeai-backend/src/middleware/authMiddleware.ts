import * as admin from "firebase-admin";
import type { APIGatewayProxyEvent } from "aws-lambda";

// Will be initialized via initializeFirebaseAdmin
let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK for auth verification
 * Must be called once before using verifyAuthToken
 */
export function initializeFirebaseAdmin(
  serviceAccountKeyPath?: string,
): admin.app.App {
  if (firebaseApp) return firebaseApp;

  try {
    if (serviceAccountKeyPath) {
      const serviceAccount = require(serviceAccountKeyPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Use Application Default Credentials in production (AWS Lambda)
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
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
        projectId: process.env.FIREBASE_PROJECT_ID,
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
  event: APIGatewayProxyEvent,
): Promise<admin.auth.DecodedIdToken> {
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
  event: APIGatewayProxyEvent,
): Promise<admin.auth.DecodedIdToken> {
  return verifyAuthToken(event);
}
