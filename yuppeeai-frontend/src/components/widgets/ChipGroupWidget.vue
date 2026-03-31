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
    <p class="widget__label">{{ widget.label }}</p>
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
.widget__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.5rem;
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
