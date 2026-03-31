<script setup lang="ts">
import type { Widget } from '@/types'

const props = defineProps<{
  widget: Widget
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

function toggle(value: string) {
  const current = [...(props.modelValue ?? [])]
  const idx = current.indexOf(value)
  if (idx === -1) {
    current.push(value)
  } else {
    current.splice(idx, 1)
  }
  emit('update:modelValue', current)
}

function isSelected(value: string): boolean {
  return (props.modelValue ?? []).includes(value)
}
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
    <div class="widget__chips">
      <button
        v-for="option in widget.options"
        :key="option.value"
        type="button"
        class="widget__chip"
        :class="{ 'widget__chip--selected': isSelected(option.value) }"
        @click="toggle(option.value)"
      >
        {{ option.label }}
      </button>
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

.widget__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.widget__chip {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: white;
  color: var(--color-text);
  font-size: 0.82rem;
  line-height: 1;
  padding: 0.45rem 0.75rem;
  cursor: pointer;
  transition: border-color var(--transition), background var(--transition), color var(--transition), box-shadow var(--transition);
}

.widget__chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.widget__chip--selected {
  border-color: var(--color-primary);
  background: #eef2ff;
  color: var(--color-primary-dark);
  box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.15);
}
</style>
