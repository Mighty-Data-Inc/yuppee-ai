<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/searchStore'
import SearchBar from '@/components/SearchBar.vue'
import SearchResults from '@/components/SearchResults.vue'
import WidgetPanel from '@/components/WidgetPanel.vue'

const route = useRoute()
const router = useRouter()
const store = useSearchStore()
const pendingRefinementChanges = ref<string[]>([])

function getQuery(): string {
  const q = route.query.q
  return Array.isArray(q) ? (q[0] ?? '') : (q ?? '')
}

async function doSearch(q: string) {
  if (q.trim()) {
    pendingRefinementChanges.value = []
    await store.search(q.trim())
  }
}

onMounted(() => {
  doSearch(getQuery())
})

watch(() => route.query.q, (newQ) => {
  const q = Array.isArray(newQ) ? (newQ[0] ?? '') : (newQ ?? '')
  if (q.trim()) {
    pendingRefinementChanges.value = []
    store.search(q.trim(), {})
  }
})

function handleSearch(q: string) {
  if (q.trim()) {
    router.push({ name: 'search', query: { q: q.trim() } })
  }
}

async function handleRefine(
  widgetValues: Record<string, any>,
  additionalInstructions: string[],
  refinementChanges: string[],
) {
  store.additionalInstructionPoints = [...additionalInstructions]
  pendingRefinementChanges.value = refinementChanges
  const filters = { ...widgetValues }

  if (additionalInstructions.length) {
    filters.additionalInstructions = [...additionalInstructions]
  }

  try {
    await store.search(store.query, filters)
  } finally {
    pendingRefinementChanges.value = []
  }
}
</script>

<template>
  <div class="search-view">
    <header class="search-header">
      <router-link to="/" class="search-header__logo">
        <img class="search-header__logo-icon" :src="'/favicon.svg'" alt="Yuppee.AI logo" />
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
          :serp-results="store.serpResults"
          :is-loading="store.isLoadingSERP"
          :query="store.query"
          :serp-summary="store.serpSummary"
          :refinement-changes="pendingRefinementChanges"
        />
      </main>

      <aside class="search-aside">
        <WidgetPanel
          :widgets="store.widgets"
          :is-loading="store.isLoadingWidgets"
          :query="store.query"
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

.search-header__logo-icon {
  width: 28px;
  height: 28px;
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
