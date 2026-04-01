<script setup lang="ts">
import { computed } from 'vue'
import type { Widget } from '@/types'

const props = defineProps<{
  widget: Widget
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const hasEmptyOption = computed(() =>
  (props.widget.options ?? []).some((option) => option.value === ''),
)

const isPlaceholderActive = computed(
  () => !hasEmptyOption.value && props.modelValue === '',
)

const placeholderText = computed(() => {
  const customPlaceholder = props.widget.dropdownPlaceholder?.trim()
  return customPlaceholder || 'Select an option'
})
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
    <div class="widget__select-wrapper">
      <select
        :class="['widget__select', { 'widget__select--placeholder': isPlaceholderActive }]"
        :value="modelValue"
        @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <option v-if="!hasEmptyOption" value="" disabled hidden>{{ placeholderText }}</option>
        <option
          v-for="option in props.widget.options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <button
        v-if="modelValue !== ''"
        type="button"
        class="widget__clear"
        aria-label="Clear selection"
        @mousedown.prevent
        @click.stop="emit('update:modelValue', '')"
      >
        x
      </button>
      <svg class="widget__select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.widget__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.widget__label-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
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

.widget__select-wrapper {
  position: relative;
}

.widget__select {
  width: 100%;
  padding: 0.55rem 3.9rem 0.55rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--color-text);
  background: white;
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.widget__select--placeholder {
  color: var(--color-text-muted);
}

.widget__select option {
  color: var(--color-text);
}

.widget__select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.widget__select:hover {
  border-color: var(--color-primary-light);
}

.widget__clear {
  position: absolute;
  right: 1.95rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition), color var(--transition), background-color var(--transition);
  z-index: 1;
}

.widget:hover .widget__clear,
.widget:focus-within .widget__clear {
  opacity: 1;
  pointer-events: auto;
}

.widget__clear:hover {
  color: var(--color-text);
  background-color: rgba(15, 23, 42, 0.08);
}

.widget__clear:focus-visible {
  opacity: 1;
  pointer-events: auto;
  outline: 2px solid var(--color-primary-light);
  outline-offset: 1px;
}

.widget__select-arrow {
  position: absolute;
  right: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
  pointer-events: none;
}
</style>
