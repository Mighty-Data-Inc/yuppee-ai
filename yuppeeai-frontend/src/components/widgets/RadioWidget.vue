<script setup lang="ts">
import type { Widget } from '@/types'

const props = defineProps<{
  widget: Widget
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="widget">
    <div class="widget__label-row">
      <p class="widget__label">{{ widget.label }}</p>
      <span
        v-if="widget.tooltip"
        class="widget__tooltip"
        :title="widget.tooltip"
        :aria-label="widget.tooltip"
        tabindex="0"
      >
        i
      </span>
    </div>
    <div class="widget__options">
      <label
        v-for="option in widget.options"
        :key="option.value"
        class="widget__radio-label"
        :class="{ 'widget__radio-label--active': modelValue === option.value }"
      >
        <input
          type="radio"
          :name="widget.id"
          :value="option.value"
          :checked="modelValue === option.value"
          class="widget__radio-input"
          @change="emit('update:modelValue', option.value)"
        />
        <span class="widget__radio-custom" />
        {{ option.label }}
      </label>
    </div>
  </div>
</template>

<style scoped>
.widget__label-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.widget__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
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

.widget__options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.widget__radio-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  transition: all var(--transition);
  user-select: none;
}

.widget__radio-label:hover {
  border-color: var(--color-primary-light);
  color: var(--color-primary);
}

.widget__radio-label--active {
  border-color: var(--color-primary);
  background: #eef2ff;
  color: var(--color-primary);
  font-weight: 500;
}

.widget__radio-input {
  display: none;
}

.widget__radio-custom {
  display: none;
}
</style>
