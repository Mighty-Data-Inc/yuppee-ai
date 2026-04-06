<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useYuppeeStore } from '@/stores/yuppeeStore'
import { useAuthStore } from '@/stores/authStore'
import LoginModal from './LoginModal.vue'

const props = withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false
})

const route = useRoute()
const router = useRouter()
const yuppeeStore = useYuppeeStore()
const authStore = useAuthStore()

// Local draft text for the input. This lets users type without mutating
// the global query on every keystroke.
const inputValue = ref(yuppeeStore.query)
const loginModalOpen = ref(false)
const pendingQuery = ref<string | null>(null)

// Keep the input in sync when the committed query changes elsewhere
// (route navigation, programmatic search, etc.).
watch(() => yuppeeStore.query, (val) => {
  inputValue.value = val
})

// Watch for auth errors and show login modal
watch(() => yuppeeStore.authError, (val) => {
  if (val) {
    loginModalOpen.value = true
  }
})

async function submitSearch() {
  const q = inputValue.value.trim()
  if (!q) return

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    pendingQuery.value = q
    loginModalOpen.value = true
    return
  }

  if (route.name === 'search' && route.query.q === q) {
    await yuppeeStore.search(q)
    return
  }

  await router.push({ name: 'search', query: { q } })
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    submitSearch()
  }
}

async function clearSearch() {
  inputValue.value = ''
  yuppeeStore.reset()

  const url = new URL(window.location.href)
  url.searchParams.delete('q')
  window.history.replaceState({}, '', url)  
}

function handleLoginModalClose() {
  loginModalOpen.value = false
  pendingQuery.value = null
}

async function handleLoginSuccess() {
  loginModalOpen.value = false
  
  // Continue with the pending search if there was one
  if (pendingQuery.value) {
    const q = pendingQuery.value
    pendingQuery.value = null
    
    if (route.name === 'search' && route.query.q === q) {
      await yuppeeStore.search(q)
      return
    }
    
    await router.push({ name: 'search', query: { q } })
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
        @click="clearSearch"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <button class="search-bar__btn" type="button" @click="submitSearch">
      Search
    </button>
    <LoginModal
      :isOpen="loginModalOpen"
      @close="handleLoginModalClose"
      @authenticated="handleLoginSuccess"
    />
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
