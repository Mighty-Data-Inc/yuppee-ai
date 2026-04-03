<script setup lang="ts">
import type { RefinementWidget, RefinementWidgetValue } from '@yuppee-ai/contracts'

const props = defineProps<{
  widget: RefinementWidget
  modelValue: RefinementWidgetValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RefinementWidgetValue]
}>()

function asBoolean(value: RefinementWidgetValue): boolean {
  return typeof value === 'boolean' ? value : false
}
</script>

<template>
  <div class="widget">
    <label class="widget__switch-row">
      <span class="widget__label-wrap">
        <span class="widget__label">{{ widget.label }}</span>
        <span
          v-if="widget.tooltip"
          class="widget__tooltip"
          :title="widget.tooltip"
          :aria-label="widget.tooltip"
          tabindex="0"
        >
          i
        </span>
      </span>
      <span class="widget__switch-wrap">
        <input
          type="checkbox"
          class="widget__switch-input"
          :checked="asBoolean(modelValue)"
          @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
        />
        <span class="widget__switch-track" :class="{ 'widget__switch-track--on': asBoolean(modelValue) }">
          <span class="widget__switch-knob" :class="{ 'widget__switch-knob--on': asBoolean(modelValue) }" />
        </span>
      </span>
    </label>
  </div>
</template>

<style scoped>
.widget__switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  cursor: pointer;
}

.widget__label-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.widget__label {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: 0.01em;
}

.widget__tooltip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  cursor: help;
  user-select: none;
}

.widget__tooltip:focus-visible {
  outline: 2px solid var(--color-primary-light);
  outline-offset: 1px;
}

.widget__switch-wrap {
  position: relative;
  display: inline-flex;
}

.widget__switch-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.widget__switch-track {
  width: 44px;
  height: 26px;
  border-radius: 999px;
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  transition: background var(--transition), border-color var(--transition);
  display: flex;
  align-items: center;
  padding: 2px;
}

.widget__switch-track--on {
  background: #c7d2fe;
  border-color: var(--color-primary-light);
}

.widget__switch-knob {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
  transform: translateX(0);
  transition: transform var(--transition), background var(--transition);
}

.widget__switch-knob--on {
  transform: translateX(18px);
  background: var(--color-primary);
}
</style>
