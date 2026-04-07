import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { User } from "firebase/auth";
import {
  signInWithGoogle,
  signInWithFacebook,
  signOutUser,
  onAuthStateChange,
  getAuthToken,
  getCurrentUser,
} from "@/services/authService";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const authToken = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const hasResolvedInitialAuthState = ref(false);
  let resolveInitialAuthState: (() => void) | null = null;
  const initialAuthStatePromise = new Promise<void>((resolve) => {
    resolveInitialAuthState = resolve;
  });

  const isAuthenticated = computed(() => user.value !== null);
  const userEmail = computed(() => user.value?.email ?? null);

  // Initialize auth state listener
  function initializeAuthListener(): void {
    onAuthStateChange(async (authUser) => {
      user.value = authUser;

      if (authUser) {
        try {
          authToken.value = await getAuthToken();
        } catch (err) {
          console.error("Failed to get auth token:", err);
          authToken.value = null;
        }
      } else {
        authToken.value = null;
      }

      if (!hasResolvedInitialAuthState.value) {
        hasResolvedInitialAuthState.value = true;
        resolveInitialAuthState?.();
      }
    });
  }

  async function waitForInitialAuthState(): Promise<void> {
    if (hasResolvedInitialAuthState.value) {
      return;
    }

    await initialAuthStatePromise;
  }

  async function loginWithGoogle(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const authUser = await signInWithGoogle();
      user.value = authUser;
      authToken.value = await getAuthToken();
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to sign in with Google";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function loginWithFacebook(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const authUser = await signInWithFacebook();
      user.value = authUser;
      authToken.value = await getAuthToken();
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to sign in with Facebook";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      await signOutUser();
      user.value = null;
      authToken.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to sign out";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function hydrateFromCurrentUser(): void {
    const currentUser = getCurrentUser();
    user.value = currentUser;
  }

  return {
    user,
    authToken,
    isLoading,
    error,
    isAuthenticated,
    userEmail,
    initializeAuthListener,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    hydrateFromCurrentUser,
    waitForInitialAuthState,
  };
});
