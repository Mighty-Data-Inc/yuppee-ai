<script setup lang="ts">
import { ref, watch } from 'vue'
import { useYuppeeStore } from '@/stores/yuppeeStore'
import LoginModal from './LoginModal.vue'

const store = useYuppeeStore()
const loginModalOpen = ref(false)

watch(
  () => store.authRequired,
  (isRequired) => {
    if (isRequired) {
      loginModalOpen.value = true
    }
  },
  { immediate: true },
)

// Show a compact display URL like example.com/path instead of the full raw link.
function formatUrl(url?: string): string {
  if (!url) {
    return "";
  }

  try {
    const u = new URL(url)
    return u.hostname + u.pathname.replace(/\/$/, '')
  } catch {
    return url
  }
}

function handleAuthCtaClick() {
  loginModalOpen.value = true
}

</script>

<template>
  <div class="results">
    <!-- Loading skeletons -->
    <template v-if="store.isLoadingSERP">
      <div v-if="store.inflightMessage" class="results__inflight" role="status" aria-live="polite">
        {{ store.inflightMessage }}
      </div>
      <div v-if="store.describeWidgetChanges.length" class="results__changes">
        <p class="results__changes-title">Changed filters...</p>
        <ul class="results__changes-list">
          <li v-for="widgetChange in store.describeWidgetChanges" :key="widgetChange" class="results__changes-item">
            {{ widgetChange }}
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
    <template v-else-if="store.serpResults.length > 0">
      <p v-if="store.serpSummary" class="results__meta" v-html="store.serpSummary" />
      <a
        v-for="result in store.serpResults"
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

    <div v-else-if="store.quotaExceeded" class="results__quota">
      <div class="results__quota-badge">Usage limit reached</div>
      <h2>You have used up this month's searches</h2>
      <h3>Monthly quota exceeded</h3>
      <p>
        Your current subscription tier is: <strong>{{ store.quotaExceeded.tierLabel }}</strong>.
      </p>
      <p v-if="store.quotaExceeded.periodSearchesUsed !== null && store.quotaExceeded.monthlyQuota !== null" class="results__quota-usage">
        You have used {{ store.quotaExceeded.periodSearchesUsed }} of
        <strong>{{ store.quotaExceeded.monthlyQuota }}</strong> searches this month.
      </p>
      <p>
        You'll have to wait until your <strong>quota resets</strong> at the start of the next month
        before you can <strong>perform more searches</strong>.
      </p>
      <p>
        Or, you can <strong>upgrade your subscription</strong> to get a <strong>higher monthly quota</strong>.
        With a higher-tier subscription, you'll be able to <strong>continue searching now</strong>
        and get a larger monthly quota when your usage resets.
      </p>
      <div class="results__quota-actions">
        <button type="button" class="results__upgrade-btn">Upgrade subscription</button>
      </div>
    </div>

    <!-- Auth required state -->
    <div v-else-if="store.authRequired" class="results__auth-required">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
        <circle cx="32" cy="32" r="28" stroke="#3b82f6" stroke-width="2" fill="none"/>
        <path d="M32 16v16m0 8v0" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <h3>Sign in to search</h3>
      <p>Create a <strong>free account</strong><br/>
      to start exploring with <br/>
      <strong>AI-powered search refinement</strong>.</p>
      <p class="results__auth-required-subtext">Our <strong>Free tier</strong> gives you<br/>
      <strong>20 searches per month</strong>.<br/>
      Upgrade anytime for more!</p>
      <button type="button" class="results__auth-cta" @click="handleAuthCtaClick">Search now</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="store.query" class="results__empty">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
        <circle cx="28" cy="28" r="20" stroke="#cbd5e1" stroke-width="3" fill="none"/>
        <path d="m44 44 12 12" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
        <path d="M21 28h14M28 21v14" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <h3>No results found</h3>
      <p>Try adjusting your search or using the filters on the right.</p>
    </div>
  </div>

  <LoginModal :isOpen="loginModalOpen" @close="loginModalOpen = false" />
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

.results__inflight {
  padding: 0.7rem 0.9rem;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: var(--radius-md);
  color: #3730a3;
  font-size: 0.9rem;
  line-height: 1.4;
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
  padding: 1rem 1.25rem 1.25rem;
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
  text-align: right;
  height: 1.5em;  
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

.results__quota {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.85rem;
  padding: 2.25rem 1.65rem;
  border: 2px solid #f59e0b;
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 22% -12%, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0) 58%),
    radial-gradient(circle at 88% 114%, rgba(245, 158, 11, 0.24) 0%, rgba(245, 158, 11, 0) 55%),
    linear-gradient(135deg, #fff7e8 0%, #fff2cf 100%);
  color: #78350f;
}

.results__quota-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.7rem;
  border: 1px solid #f59e0b;
  border-radius: 999px;
  background: rgba(255, 251, 235, 0.95);
  color: #92400e;
  font-size: 0.76rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  font-weight: 700;
}

.results__quota h2 {
  color: #7c2d12;
  font-size: 1.55rem;
  font-weight: 700;
  line-height: 1.25;
  margin: 0;
}

.results__quota h3 {
  color: #b45309;
  font-size: 0.96rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.35;
  margin: 0;
}

.results__quota p {
  font-size: 0.97rem;
  line-height: 1.55;
  margin: 0;
  max-width: 46ch;
  color: #92400e;
}

.results__quota-usage {
  padding: 0.65rem 0.85rem;
  border: 1px dashed #f59e0b;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.65);
}

.results__quota-actions {
  margin-top: 0.15rem;
  display: flex;
  justify-content: center;
}

.results__upgrade-btn {
  padding: 0.72rem 1.4rem;
  border: 1px solid #b45309;
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  color: white;
  font-size: 0.96rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  border-radius: var(--radius-md);
  transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
  box-shadow: 0 8px 18px rgba(180, 83, 9, 0.28);
}

.results__upgrade-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
  box-shadow: 0 12px 20px rgba(180, 83, 9, 0.33);
}

.results__auth-required {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  padding: 3rem 2.5rem;
  text-align: center;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #3b82f6;
  border-radius: var(--radius-lg);
}

.results__auth-required h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e40af;
  margin: 0;
}

.results__auth-required p {
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
  max-width: 420px;
  color: #1e3a8a;
}

.results__auth-required p strong {
  color: #0c4a6e;
  font-weight: 700;
}

.results__auth-required-subtext {
  font-size: 0.95rem;
  color: #0369a1;
}

.results__auth-cta {
  margin-top: 0.5rem;
  padding: 0.75rem 1.75rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}

.results__auth-cta:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

.results__auth-cta:active {
  transform: translateY(0);
}
</style>
