<script setup lang="ts">
import { useRouter } from 'vue-router'
import SearchBar from '@/components/SearchBar.vue'
import UserProfile from '@/components/UserProfile.vue'

const router = useRouter()

function submitSearch(q: string) {
  q = q.trim();
  if (!q) {
    return;
  }
  router.push({ name: 'search', query: { q } })
}
</script>

<template>
  <main class="home">
    <div class="home__profile">
      <UserProfile />
    </div>

    <div class="home__content">
      <div class="home__logo">
        <img class="home__logo-icon" src="/favicon.svg" alt="Yuppee.AI logo" />
        <span class="home__wordmark">Yuppee<span class="home__wordmark-ai">.AI</span></span>
      </div>

      <p class="home__tagline">Search smarter. Refine deeper.</p>

      <div class="home__search">
        <SearchBar />
      </div>

      <div class="home__hints">
        <span class="home__hint" @click="submitSearch('Books about Crimean War')">Books about Crimean War</span>
        <span class="home__hint" @click="submitSearch('Best sci-fi movies 2020s')">Best sci-fi movies 2020s</span>
        <span class="home__hint" @click="submitSearch('AI search engines')">AI search engines</span>
      </div>
    </div>

    <footer class="home__footer">
      <p>Powered by AI · Built with Vue 3 + Vite</p>
    </footer>
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
  position: relative;
}

.home__profile {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
}

.home__content {
  width: 100%;
  max-width: 620px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.home__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.home__logo-icon {
  width: 56px;
  height: 56px;
}

.home__wordmark {
  font-size: 2.75rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.03em;
}

.home__wordmark-ai {
  color: var(--color-primary);
}

.home__tagline {
  font-size: 1.1rem;
  color: var(--color-text-muted);
  font-weight: 400;
  letter-spacing: 0.01em;
  margin-top: -0.5rem;
}

.home__search {
  width: 100%;
}

.home__hints {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.home__hint {
  padding: 0.35rem 0.85rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition);
  box-shadow: var(--shadow-sm);
}

.home__hint:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

.home__footer {
  position: fixed;
  bottom: 1.5rem;
  font-size: 0.8rem;
  color: var(--color-text-light);
}
</style>
