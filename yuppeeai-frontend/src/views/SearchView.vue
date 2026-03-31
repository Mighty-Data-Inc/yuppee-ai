<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/searchStore'
import SearchBar from '@/components/SearchBar.vue'
import SearchResults from '@/components/SearchResults.vue'
import WidgetPanel from '@/components/WidgetPanel.vue'

const route = useRoute()
const router = useRouter()
const store = useSearchStore()

function getQuery(): string {
  const q = route.query.q
  return Array.isArray(q) ? (q[0] ?? '') : (q ?? '')
}

async function doSearch(q: string) {
  if (q.trim()) {
    await store.performSearch(q.trim())
  }
}

onMounted(() => {
  store.loadPreferences()
  doSearch(getQuery())
})

watch(() => route.query.q, (newQ) => {
  const q = Array.isArray(newQ) ? (newQ[0] ?? '') : (newQ ?? '')
  if (q.trim()) {
    store.performSearch(q.trim(), {})
  }
})

function handleSearch(q: string) {
  if (q.trim()) {
    router.push({ name: 'search', query: { q: q.trim() } })
  }
}

async function handleRefine(widgetValues: Record<string, any>, refinementText: string) {
  store.refinement = refinementText
  const filters = { ...widgetValues }
  const trimmedRefinement = refinementText.trim()

  if (trimmedRefinement) {
    filters.additionalInstructions = trimmedRefinement
  }

  await store.performSearch(store.query, filters)
}
</script>

<template>
  <div class="search-view">
    <header class="search-header">
      <router-link to="/" class="search-header__logo">
        <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
          <circle cx="15" cy="15" r="10" stroke="#6366f1" stroke-width="2.5" fill="none"/>
          <circle cx="15" cy="15" r="4.5" fill="#6366f1"/>
          <line x1="22.5" y1="22.5" x2="33" y2="33" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        <span class="search-header__wordmark">Yuppee<span>.AI</span></span>
      </router-link>

      <div class="search-header__bar">
        <SearchBar
          :model-value="store.query"
          :compact="true"
          @search="handleSearch"
        />
      </div>
    </header>

    <div class="search-layout">
      <main class="search-main">
        <SearchResults
          :results="store.results"
          :is-loading="store.isLoadingResults"
          :query="store.query"
        />
      </main>

      <aside class="search-aside">
        <WidgetPanel
          :widgets="store.widgets"
          :is-loading="store.isLoadingWidgets"
          @refine="handleRefine"
        />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.search-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.search-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.85rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: white;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.search-header__logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  flex-shrink: 0;
}

.search-header__wordmark {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.search-header__wordmark span {
  color: var(--color-primary);
}

.search-header__bar {
  flex: 1;
  max-width: 600px;
}

.search-layout {
  display: flex;
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 1.5rem;
  gap: 1.5rem;
  align-items: flex-start;
}

.search-main {
  flex: 1;
  min-width: 0;
}

.search-aside {
  width: 340px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

@media (max-width: 767px) {
  .search-header {
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .search-header__bar {
    flex-basis: 100%;
    max-width: 100%;
  }

  .search-layout {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }

  .search-aside {
    width: 100%;
    position: static;
    max-height: none;
  }
}
</style>
