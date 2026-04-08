<script setup lang="ts">
import { ref, computed } from "vue";
import { initiateCheckout } from "@/services/searchService";

const emit = defineEmits<{
  close: [];
}>();

const isLoading = ref(false);
const error = ref<string | null>(null);

interface Tier {
  id: string;
  name: string;
  monthlyQuota: number;
  description: string;
  price?: number;
}

const tiers: Tier[] = [
  {
    id: "basic",
    name: "Basic",
    monthlyQuota: 250,
    description: "For casual users",
  },
  {
    id: "standard",
    name: "Standard",
    monthlyQuota: 1000,
    description: "For regular users",
  },
  {
    id: "pro",
    name: "Pro",
    monthlyQuota: 5000,
    description: "For power users",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyQuota: 20000,
    description: "For organizations",
  },
];

async function handleUpgrade(tierId: string) {
  isLoading.value = true;
  error.value = null;

  try {
    const checkout = await initiateCheckout(tierId);
    if (checkout.sessionUrl) {
      window.location.href = checkout.sessionUrl;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Checkout failed";
    console.error("Checkout error:", err);
  } finally {
    isLoading.value = false;
  }
}

function handleClose() {
  if (!isLoading.value) {
    emit("close");
  }
}
</script>

<template>
  <div class="subscription-modal-overlay">
    <div class="subscription-modal">
      <div class="modal-header">
        <h2>Upgrade Your Subscription</h2>
        <button
          class="modal-close"
          @click="handleClose"
          :disabled="isLoading"
          title="Close"
        >
          ✕
        </button>
      </div>

      <div v-if="error" class="modal-error">
        {{ error }}
      </div>

      <div class="modal-tiers">
        <div v-for="tier in tiers" :key="tier.id" class="tier-card">
          <div class="tier-header">
            <h3>{{ tier.name }}</h3>
            <p class="tier-quota">{{ tier.monthlyQuota.toLocaleString() }} searches/month</p>
          </div>
          <p class="tier-description">{{ tier.description }}</p>
          <button
            class="tier-button"
            @click="() => handleUpgrade(tier.id)"
            :disabled="isLoading"
          >
            {{ isLoading ? "Processing..." : "Select Plan" }}
          </button>
        </div>
      </div>

      <div class="modal-footer">
        <p class="footer-note">
          You will be redirected to Stripe to complete your purchase.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.subscription-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.subscription-modal {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 32px;
  max-width: 900px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 16px;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: color var(--transition);
}

.modal-close:hover:not(:disabled) {
  color: var(--color-text);
}

.modal-close:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.modal-error {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 24px;
  border: 1px solid var(--color-danger);
}

.modal-tiers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.tier-card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: all var(--transition);
}

.tier-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tier-header {
  margin-bottom: 12px;
}

.tier-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.tier-quota {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.tier-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: var(--color-text-secondary);
  flex-grow: 1;
}

.tier-button {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}

.tier-button:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
}

.tier-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-footer {
  border-top: 1px solid var(--color-border);
  padding-top: 16px;
  text-align: center;
}

.footer-note {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}
</style>
