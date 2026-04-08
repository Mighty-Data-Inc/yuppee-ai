<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
const userId = computed(() => authStore.user?.uid ?? "");
const pricingTableId = import.meta.env.VITE_STRIPE_PRICING_TABLE_ID as string;
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;

const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <div class="subscription-overlay" @click.self="emit('close')">
    <div class="subscription-modal">
      <button class="modal-close" @click="emit('close')" title="Close">✕</button>
      <stripe-pricing-table
        :pricing-table-id="pricingTableId"
        :publishable-key="publishableKey"
        :client-reference-id="userId"
      />
    </div>
  </div>
</template>

<style scoped>
.subscription-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.subscription-modal {
  position: relative;
  background: var(--color-background);
  border-radius: 8px;
  padding: 16px;
  width: 90%;
  max-width: 960px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-secondary);
  line-height: 1;
  z-index: 1;
}

.modal-close:hover {
  color: var(--color-text);
}
</style>
