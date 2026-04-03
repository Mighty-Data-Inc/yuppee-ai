<script setup lang="ts">
import { errorService } from "@/services/errorService";

const errors = errorService.errors;
</script>

<template>
  <div class="error-stack" aria-live="assertive" aria-atomic="false">
    <TransitionGroup name="error-toast" tag="div" class="error-stack__list">
      <div
        v-for="error in errors"
        :key="error.id"
        class="error-toast"
        role="alert"
      >
        <span>{{ error.message }}</span>
        <button
          class="error-toast__dismiss"
          type="button"
          aria-label="Dismiss error"
          @click="errorService.removeError(error.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.error-stack {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 1rem;
  z-index: 1000;
  pointer-events: none;
  padding: 0 1rem;
}

.error-stack__list {
  max-width: 840px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.error-toast {
  pointer-events: auto;
  background: #b91c1c;
  color: #fff;
  border: 1px solid #7f1d1d;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 0.7rem 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.9rem;
  line-height: 1.35;
}

.error-toast__dismiss {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1.05rem;
  line-height: 1;
  opacity: 0.85;
  padding: 0.2rem;
}

.error-toast__dismiss:hover {
  opacity: 1;
}

.error-toast-enter-active,
.error-toast-leave-active,
.error-toast-move {
  transition: all 180ms ease;
}

.error-toast-enter-from,
.error-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
