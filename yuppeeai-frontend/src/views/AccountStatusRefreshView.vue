<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { refreshTier } from "@/services/searchService";

const router = useRouter();

onMounted(async () => {
  try {
    await refreshTier();
  } catch (err) {
    console.warn("[AccountStatusRefresh] Tier refresh failed, redirecting anyway", err);
  }
  router.replace({ name: "search" });
});
</script>

<template>
  <div class="refresh-container">
    <p>Updating your account…</p>
  </div>
</template>

<style scoped>
.refresh-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-size: 1rem;
  color: var(--color-text-muted);
}
</style>
