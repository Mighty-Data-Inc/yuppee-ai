import { readonly, ref } from "vue";

export interface AppErrorMessage {
  id: number;
  message: string;
}

const errorMessages = ref<AppErrorMessage[]>([]);
let nextErrorId = 1;

function removeError(id: number) {
  errorMessages.value = errorMessages.value.filter((error) => error.id !== id);
}

function showError(message: string, durationMs = 4000) {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return -1;
  }

  const id = nextErrorId++;
  errorMessages.value.push({ id, message: trimmedMessage });

  window.setTimeout(() => {
    removeError(id);
  }, durationMs);

  return id;
}

function clearErrors() {
  errorMessages.value = [];
}

export const errorService = {
  errors: readonly(errorMessages),
  showError,
  removeError,
  clearErrors,
};

export { showError, removeError, clearErrors };
