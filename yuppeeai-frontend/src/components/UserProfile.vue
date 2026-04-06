<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
const isOpen = ref(false);

async function handleLogout() {
  try {
    await authStore.logout();
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
        v-if="authStore.user?.photoURL"
        :src="authStore.user.photoURL"
        :alt="authStore.user?.displayName || 'User'"
        class="profile-avatar"
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
