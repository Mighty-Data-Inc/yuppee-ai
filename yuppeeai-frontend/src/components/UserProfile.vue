<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { fetchUsage, type UsageResponse } from "@/services/searchService";

const authStore = useAuthStore();
const isOpen = ref(false);
const didAvatarFailToLoad = ref(false);
const usage = ref<UsageResponse | null>(null);
const isLoadingUsage = ref(false);

const avatarUrl = computed(() => authStore.user?.photoURL ?? "");
const shouldShowAvatarImage = computed(
  () => avatarUrl.value !== "" && !didAvatarFailToLoad.value,
);

watch(avatarUrl, () => {
  // Reset fallback state when auth provider updates the profile image URL.
  didAvatarFailToLoad.value = false;
});

watch(isOpen, async (open) => {
  if (!open || !authStore.isAuthenticated) {
    return;
  }

  isLoadingUsage.value = true;
  try {
    usage.value = await fetchUsage();
  } catch (err) {
    console.warn("Failed to load usage details:", err);
    usage.value = null;
  } finally {
    isLoadingUsage.value = false;
  }
});

const tierLabel = computed(() => usage.value?.tierName || usage.value?.tier || "n/a");

const monthlyUsageLabel = computed(() => {
  if (!usage.value) {
    return "n/a";
  }

  return `${usage.value.periodSearchesUsed} of ${usage.value.monthlyQuota}`;
});

const usagePercent = computed(() => {
  if (!usage.value || usage.value.monthlyQuota <= 0) {
    return 0;
  }

  const percent = (usage.value.periodSearchesUsed / usage.value.monthlyQuota) * 100;
  return Math.min(100, Math.max(0, percent));
});

const usageBarClass = computed(() => {
  if (usagePercent.value >= 90) {
    return "profile-usage-fill--danger";
  }
  if (usagePercent.value >= 60) {
    return "profile-usage-fill--warning";
  }
  return "profile-usage-fill--ok";
});

async function handleLogout() {
  try {
    await authStore.logout();
    usage.value = null;
    isOpen.value = false;
  } catch (err) {
    console.error("Logout failed:", err);
  }
}

function toggleMenu() {
  isOpen.value = !isOpen.value;
}

function closeMenu() {
  isOpen.value = false;
}

function handleAvatarLoadError() {
  didAvatarFailToLoad.value = true;
}
</script>

<template>
  <div class="user-profile">
    <button
      v-if="authStore.isAuthenticated"
      class="profile-button"
      @click="toggleMenu"
      :title="authStore.userEmail || 'User profile'"
    >
      <img
        v-if="shouldShowAvatarImage"
        :key="avatarUrl"
        :src="avatarUrl"
        :alt="authStore.user?.displayName || 'User'"
        class="profile-avatar"
        referrerpolicy="no-referrer"
        @error="handleAvatarLoadError"
      />
      <div v-else class="profile-avatar-placeholder">
        {{ (authStore.user?.displayName || authStore.userEmail || "U")[0].toUpperCase() }}
      </div>
    </button>

    <div v-if="isOpen" class="profile-dropdown">
      <div class="profile-info">
        <div v-if="authStore.user?.displayName" class="profile-name">
          {{ authStore.user.displayName }}
        </div>
        <div class="profile-email">
          {{ authStore.userEmail }}
        </div>

        <div class="profile-subscription">
          <template v-if="isLoadingUsage">
            Loading subscription info...
          </template>
          <template v-else>
            <div>Subscription: <strong>{{ tierLabel }}</strong></div>
            <div class="profile-usage-line">
              Searches this month:
              <span class="profile-usage-value">{{ monthlyUsageLabel }}</span>
            </div>
            <div class="profile-usage-track" aria-hidden="true">
              <div
                class="profile-usage-fill"
                :class="usageBarClass"
                :style="{ width: `${usagePercent}%` }"
              />
            </div>
          </template>
        </div>
      </div>

      <div class="profile-divider" />

      <button class="profile-logout" @click="handleLogout">
        Sign Out
      </button>
    </div>
  </div>

  <!-- Close menu when clicking outside -->
  <div
    v-if="isOpen"
    class="profile-backdrop"
    @click="closeMenu"
  />
</template>

<style scoped>
.user-profile {
  position: relative;
}

.profile-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: transform var(--transition);
}

.profile-button:hover {
  transform: scale(1.05);
}

.profile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.profile-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  min-width: 200px;
  z-index: 100;
}

.profile-info {
  padding: 0.75rem 1rem;
}

.profile-name {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.875rem;
}

.profile-email {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.profile-subscription {
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  display: grid;
  gap: 0.2rem;
}

.profile-usage-track {
  margin-top: 0.35rem;
  width: 100%;
  height: 6px;
  background: var(--color-border);
  border-radius: 999px;
  overflow: hidden;
}

.profile-usage-value {
  white-space: nowrap;
}

.profile-usage-line {
  line-height: 1.3;
}

.profile-usage-fill {
  height: 100%;
  transition: width 0.2s ease;
}

.profile-usage-fill--ok {
  background: #16a34a;
}

.profile-usage-fill--warning {
  background: #eab308;
}

.profile-usage-fill--danger {
  background: #dc2626;
}

.profile-divider {
  height: 1px;
  background: var(--color-border);
}

.profile-logout {
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  text-align: left;
  color: var(--color-text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color var(--transition);
}

.profile-logout:hover {
  background-color: var(--color-surface);
  color: var(--color-error);
}

.profile-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}
</style>
