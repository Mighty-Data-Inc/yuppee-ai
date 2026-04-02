<script setup lang="ts">
import type { SearchResult } from '@/types'

defineProps<{
  serpResults: SearchResult[]
  isLoadingSERP: boolean
  query: string
  serpSummary: string
  refinementChanges: string[]
}>()

// Show a compact display URL like example.com/path instead of the full raw link.
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
    <template v-if="isLoadingSERP">
      <div v-if="refinementChanges.length" class="results__changes">
        <p class="results__changes-title">Changed filters...</p>
        <ul class="results__changes-list">
          <li v-for="change in refinementChanges" :key="change" class="results__changes-item">
            {{ change }}
          </li>
        </ul>
      </div>
      <div class="results__meta skeleton-line skeleton-line--short" />
      <div v-for="i in 5" :key="i" class="result-card result-card--skeleton">
        <div class="skeleton-line skeleton-line--title" />
        <div class="skeleton-line" />
        <div class="skeleton-line skeleton-line--short" />
      </div>
    </template>

    <!-- Results -->
    <template v-else-if="serpResults.length > 0">
      <p v-if="serpSummary" class="results__meta" v-html="serpSummary" />
      <a
        v-for="result in serpResults"
        :key="result.url"
        :href="result.url"
        class="result-card"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="result-card__title">
          {{ result.title }}
        </span>
        <p v-if="result.snippet" class="result-card__snippet">{{ result.snippet }}</p>
        <p
          v-if="result.summary && result.summary !== result.snippet"
          class="result-card__summary"
        >
          {{ result.summary }}
        </p>
        <div class="result-card__url">{{ formatUrl(result.url) }}</div>
      </a>
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

.results__changes {
  padding: 0.9rem 1rem;
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
}

.results__changes-title {
  margin: 0 0 0.45rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.results__changes-list {
  margin: 0;
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.results__changes-item {
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--color-text-muted);
}

.results__meta strong {
  color: var(--color-text);
}

.result-card {
  position: relative;
  padding: 1rem 1.25rem 1.7rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  text-decoration: none;
  transition: box-shadow var(--transition), border-color var(--transition);
}

.result-card:hover {
  box-shadow: var(--shadow-md);
  border-color: #c7d2fe;
}

.result-card__url {
  position: absolute;
  right: .75rem;
  bottom: 0.3rem;
  font-size: 0.78rem;
  color: #16a34a;
  opacity: 0;
  transform: translateY(2px);
  transition: opacity 140ms ease, transform 140ms ease;
  pointer-events: none;
}

.result-card:hover .result-card__url,
.result-card:focus-visible .result-card__url {
  opacity: 1;
  transform: translateY(0);
}

.result-card__title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-primary);
  line-height: 1.4;
  transition: color var(--transition);
}

.result-card:hover .result-card__title,
.result-card:focus-visible .result-card__title {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

.result-card__snippet {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  padding-left: 0.7em;
  border-left: 2px solid #ccc;
}

.result-card__summary {
  font-family: inherit;
  font-size: 0.94rem;
  color: var(--color-text);
  line-height: 1.6;
  margin-top: 1ex;
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
  padding: 1.2rem 1.25rem 1.2rem;
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
