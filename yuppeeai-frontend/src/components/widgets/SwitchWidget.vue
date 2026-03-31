<script setup lang="ts">
import type { Widget } from '@/types'

const props = defineProps<{
  widget: Widget
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <div class="widget">
    <label class="widget__switch-row">
      <span class="widget__label">{{ widget.label }}</span>
      <span class="widget__switch-wrap">
        <input
          type="checkbox"
          class="widget__switch-input"
          :checked="modelValue"
          @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
        />
        <span class="widget__switch-track" :class="{ 'widget__switch-track--on': modelValue }">
          <span class="widget__switch-thumb" :class="{ 'widget__switch-thumb--on': modelValue }" />
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

.widget__label {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: 0.01em;
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

.widget__switch-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
  transform: translateX(0);
  transition: transform var(--transition), background var(--transition);
}

.widget__switch-thumb--on {
  transform: translateX(18px);
  background: var(--color-primary);
}
</style>
