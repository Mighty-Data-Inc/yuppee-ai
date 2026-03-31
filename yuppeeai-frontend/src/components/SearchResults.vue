<script setup lang="ts">
import type { SearchResult } from '@/types'

defineProps<{
  results: SearchResult[]
  isLoading: boolean
  query: string
  resultSummary: string
}>()

function formatUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname + u.pathname.replace(/\/$/, '')
  } catch {
    return url
  }
}
</script>

<template>
  <div class="results">
    <!-- Loading skeletons -->
    <template v-if="isLoading">
      <div class="results__meta skeleton-line skeleton-line--short" />
      <div v-for="i in 5" :key="i" class="result-card result-card--skeleton">
        <div class="skeleton-line skeleton-line--url" />
        <div class="skeleton-line skeleton-line--title" />
        <div class="skeleton-line" />
        <div class="skeleton-line skeleton-line--short" />
      </div>
    </template>

    <!-- Results -->
    <template v-else-if="results.length > 0">
      <p v-if="resultSummary" class="results__meta" v-html="resultSummary" />
      <article v-for="result in results" :key="result.url" class="result-card">
        <div class="result-card__url">
          <span class="result-card__favicon">🔗</span>
          {{ formatUrl(result.url) }}
        </div>
        <a :href="result.url" class="result-card__title" target="_blank" rel="noopener noreferrer">
          {{ result.title }}
        </a>
        <p v-if="result.snippet" class="result-card__snippet">{{ result.snippet }}</p>
        <p
          v-if="result.summary && result.summary !== result.snippet"
          class="result-card__summary"
        >
          {{ result.summary }}
        </p>
      </article>
    </template>

    <!-- Empty state -->
    <div v-else-if="query" class="results__empty">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
        <circle cx="28" cy="28" r="20" stroke="#cbd5e1" stroke-width="3" fill="none"/>
        <path d="m44 44 12 12" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
        <path d="M21 28h14M28 21v14" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <h3>No results found</h3>
      <p>Try adjusting your search or using the filters on the right.</p>
    </div>
  </div>
</template>

<style scoped>
.results {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.results__meta {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  padding: 0.25rem 0 0.5rem;
}

.results__meta strong {
  color: var(--color-text);
}

.result-card {
  padding: 1rem 1.25rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  transition: box-shadow var(--transition), border-color var(--transition);
}

.result-card:hover {
  box-shadow: var(--shadow-md);
  border-color: #c7d2fe;
}

.result-card__url {
  font-size: 0.78rem;
  color: #16a34a;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.result-card__favicon {
  font-size: 0.7rem;
}

.result-card__title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  line-height: 1.4;
  transition: color var(--transition);
}

.result-card__title:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

.result-card__snippet {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.result-card__summary {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 0.94rem;
  color: var(--color-text);
  line-height: 1.7;
}

/* Skeleton styles */
.skeleton-line {
  height: 14px;
  background: linear-gradient(90deg, #f0f4ff 25%, #e8edff 50%, #f0f4ff 75%);
  background-size: 200% 100%;
  border-radius: 999px;
  animation: shimmer 1.5s infinite;
}

.skeleton-line--url {
  width: 30%;
  height: 12px;
}

.skeleton-line--title {
  width: 80%;
  height: 18px;
}

.skeleton-line--short {
  width: 55%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.result-card--skeleton {
  gap: 0.5rem;
  padding: 1.2rem 1.25rem;
}

.results__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--color-text-muted);
}

.results__empty h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
}

.results__empty p {
  font-size: 0.9rem;
}
</style>
