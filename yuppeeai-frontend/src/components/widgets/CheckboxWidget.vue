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

function isChecked(value: string): boolean {
  return (props.modelValue ?? []).includes(value)
}
</script>

<template>
  <div class="widget">
    <p class="widget__label">{{ widget.label }}</p>
    <div class="widget__checkboxes">
      <label
        v-for="option in widget.options"
        :key="option.value"
        class="widget__checkbox-label"
        :class="{ 'widget__checkbox-label--checked': isChecked(option.value) }"
      >
        <input
          type="checkbox"
          :value="option.value"
          :checked="isChecked(option.value)"
          class="widget__checkbox-input"
          @change="toggle(option.value)"
        />
        <span class="widget__checkbox-custom">
          <svg v-if="isChecked(option.value)" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        {{ option.label }}
      </label>
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

.widget__checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.widget__checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text);
  padding: 0.25rem 0;
  transition: color var(--transition);
  user-select: none;
}

.widget__checkbox-label:hover {
  color: var(--color-primary);
}

.widget__checkbox-input {
  display: none;
}

.widget__checkbox-custom {
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--color-border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition);
  background: white;
}

.widget__checkbox-label--checked .widget__checkbox-custom {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.widget__checkbox-label:hover .widget__checkbox-custom {
  border-color: var(--color-primary);
}
</style>
