<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string
  compact?: boolean
}>(), {
  modelValue: '',
  compact: false
})

const emit = defineEmits<{
  search: [query: string]
}>()

const inputValue = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  inputValue.value = val
})

function handleSubmit() {
  if (inputValue.value.trim()) {
    emit('search', inputValue.value.trim())
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    handleSubmit()
  }
}
</script>

<template>
  <div class="search-bar" :class="{ 'search-bar--compact': compact }">
    <div class="search-bar__inner">
      <svg class="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        v-model="inputValue"
        class="search-bar__input"
        type="text"
        placeholder="Search anything..."
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
        @keydown="handleKeydown"
      />
      <button
        v-if="inputValue"
        class="search-bar__clear"
        type="button"
        aria-label="Clear search"
        @click="inputValue = ''"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <button class="search-bar__btn" type="button" @click="handleSubmit">
      Search
    </button>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  gap: 0.75rem;
  width: 100%;
}

.search-bar__inner {
  flex: 1;
  display: flex;
  align-items: center;
  background: white;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0 1rem;
  gap: 0.6rem;
  transition: border-color var(--transition), box-shadow var(--transition);
  box-shadow: var(--shadow-sm);
}

.search-bar__inner:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.search-bar__icon {
  width: 18px;
  height: 18px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.search-bar__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 400;
  padding: 0.85rem 0;
}

.search-bar__input::placeholder {
  color: var(--color-text-light);
}

.search-bar__clear {
  background: none;
  border: none;
  padding: 0.25rem;
  color: var(--color-text-muted);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
  flex-shrink: 0;
}

.search-bar__clear svg {
  width: 16px;
  height: 16px;
}

.search-bar__clear:hover {
  background: var(--color-surface);
  color: var(--color-text);
}

.search-bar__btn {
  padding: 0 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  white-space: nowrap;
  transition: background var(--transition), transform var(--transition), box-shadow var(--transition);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.search-bar__btn:hover {
  background: var(--color-primary-dark);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.search-bar__btn:active {
  transform: translateY(1px);
}

/* Compact variant */
.search-bar--compact .search-bar__inner {
  border-radius: var(--radius-md);
}

.search-bar--compact .search-bar__input {
  font-size: 0.95rem;
  padding: 0.65rem 0;
}

.search-bar--compact .search-bar__btn {
  padding: 0 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
}
</style>
