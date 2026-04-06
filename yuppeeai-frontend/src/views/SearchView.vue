<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useYuppeeStore } from '@/stores/yuppeeStore'
import SearchBar from '@/components/SearchBar.vue'
import SearchResults from '@/components/SearchResults.vue'
import WidgetPanel from '@/components/WidgetPanel.vue'
import UserProfile from '@/components/UserProfile.vue'

const route = useRoute()
const store = useYuppeeStore()

onMounted(() => {
  void submitSearch(route.query.q)
})
watch(() => route.query.q, (q) => {
  void submitSearch(q)
})

async function submitSearch(q?: string | null | Array<string | null>) {
  const firstValue = Array.isArray(q) ? (q[0] ?? "") : (q ?? "")
  const query = firstValue.trim()
  if (!query) { store.reset(); return }
  await store.search(query)
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
        <SearchBar :compact="true" />
      </div>

      <div class="search-header__profile">
        <UserProfile />
      </div>
    </header>

    <div class="search-layout">
      <main class="search-main">
        <SearchResults />
      </main>

      <aside class="search-aside">
        <WidgetPanel />
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

.search-header__profile {
  display: flex;
  align-items: center;
  flex-shrink: 0;
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
  top: 95px;
  max-height: calc(100vh - 120px);
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
