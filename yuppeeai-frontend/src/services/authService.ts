import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";

// Will be initialized from environment variables
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
}

export function initializeAuth(config: FirebaseConfig): void {
  if (app) return; // Already initialized

  app = initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  });

  auth = getAuth(app);
}

export function getAuthInstance(): Auth {
  if (!auth) {
    throw new Error("Auth not initialized. Call initializeAuth first.");
  }
  return auth;
}

export async function signInWithGoogle(): Promise<User> {
  const authInstance = getAuthInstance();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(authInstance, provider);
  return result.user;
}

export async function signInWithFacebook(): Promise<User> {
  const authInstance = getAuthInstance();
  const provider = new FacebookAuthProvider();
  const result = await signInWithPopup(authInstance, provider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  const authInstance = getAuthInstance();
  await signOut(authInstance);
}

export function onAuthStateChange(
  callback: (user: User | null) => void,
): () => void {
  const authInstance = getAuthInstance();
  return onAuthStateChanged(authInstance, callback);
}

export async function getAuthToken(): Promise<string | null> {
  const authInstance = getAuthInstance();
  const user = authInstance.currentUser;
  if (!user) return null;

  return user.getIdToken();
}

export function getCurrentUser(): User | null {
  const authInstance = getAuthInstance();
  return authInstance.currentUser;
}
