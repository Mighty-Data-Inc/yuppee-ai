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
const activeProvider = ref<"google" | "facebook" | null>(null);

async function handleGoogleSignIn() {
  isLoading.value = true;
  activeProvider.value = "google";
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
    activeProvider.value = null;
  }
}

async function handleFacebookSignIn() {
  isLoading.value = true;
  activeProvider.value = "facebook";
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
    activeProvider.value = null;
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

        <div v-if="isLoading" class="auth-loading">
          Signing in with
          {{ activeProvider === "facebook" ? "Facebook" : "Google" }}...
        </div>

        <template v-else>
          <button
            class="auth-button google-button"
            @click="handleGoogleSignIn"
            :disabled="isLoading"
          >
            <img class="button-icon" :src="'/logos/google-official.png'" alt="Google" />
            Sign in with Google
          </button>

          <button
            class="auth-button facebook-button"
            @click="handleFacebookSignIn"
            :disabled="isLoading"
          >
            <img class="button-icon" :src="'/logos/facebook-official.png'" alt="Facebook" />
            Sign in with Facebook
          </button>
        </template>

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

.auth-loading {
  width: 100%;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #f8fafc;
  color: var(--color-text-muted);
  font-size: 0.95rem;
  font-weight: 500;
}

.google-button {
  color: #1f2937;
  background: #fff;
  border-color: #dadce0;
}

.facebook-button {
  color: #1f2937;
  background: #fff;
  border-color: #d0d7e2;
}

.google-button:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #c6c9cc;
}

.facebook-button:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #b7c5da;
}

.button-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.modal-footer {
  font-size: 0.75rem;
  color: var(--color-text-light);
  margin-top: 1.5rem;
}
</style>
