<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/authStore";

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  authenticated: [];
}>();

const authStore = useAuthStore();
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

async function handleGoogleSignIn() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    await authStore.loginWithGoogle();
    emit("authenticated");
    emit("close");
  } catch (err) {
    errorMessage.value =
      err instanceof Error ? err.message : "Sign in failed. Please try again.";
  } finally {
    isLoading.value = false;
  }
}

async function handleFacebookSignIn() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    await authStore.loginWithFacebook();
    emit("authenticated");
    emit("close");
  } catch (err) {
    errorMessage.value =
      err instanceof Error ? err.message : "Sign in failed. Please try again.";
  } finally {
    isLoading.value = false;
  }
}

function handleClose() {
  emit("close");
}
</script>

<template>
  <div v-if="isOpen" class="login-modal-backdrop">
    <div class="login-modal">
      <button
        class="close-button"
        @click="handleClose"
        aria-label="Close login modal"
      >
        ✕
      </button>

      <div class="modal-content">
        <h2>Sign In to Search</h2>
        <p class="modal-subtitle">Sign up for free with your existing account</p>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button
          class="auth-button google-button"
          @click="handleGoogleSignIn"
          :disabled="isLoading"
        >
          <svg viewBox="0 0 24 24" class="button-icon">
            <path
              fill="currentColor"
              d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.365,1,12.545,1 C6.477,1,1.54,5.938,1.54,12s4.938,11,11.005,11c6.067,0,11.067-4.941,11.067-11c0-0.713-0.084-1.405-0.242-2.074H12.545z"
            />
          </svg>
          {{ isLoading ? "Signing in..." : "Sign in with Google" }}
        </button>

        <button
          class="auth-button facebook-button"
          @click="handleFacebookSignIn"
          :disabled="isLoading"
        >
          <svg viewBox="0 0 24 24" class="button-icon">
            <path
              fill="currentColor"
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
          {{ isLoading ? "Signing in..." : "Sign in with Facebook" }}
        </button>

        <p class="modal-footer">
          By signing in, you agree to use this service for legitimate purposes
          only.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.login-modal {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: var(--shadow-lg);
  position: relative;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all var(--transition);
}

.close-button:hover {
  background-color: var(--color-surface);
  color: var(--color-text);
}

.modal-content {
  text-align: center;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.modal-subtitle {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.error-message {
  background-color: #fee2e2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.auth-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
  background-color: var(--color-bg);
}

.auth-button:hover:not(:disabled) {
  border-color: var(--color-text-muted);
  background-color: var(--color-surface);
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-button {
  color: #1f2937;
}

.facebook-button {
  color: #0a66c2;
}

.button-icon {
  width: 20px;
  height: 20px;
}

.modal-footer {
  font-size: 0.75rem;
  color: var(--color-text-light);
  margin-top: 1.5rem;
}
</style>
