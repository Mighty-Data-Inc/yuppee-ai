<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Widget } from '@/types'

const props = defineProps<{
  widget: Widget
  modelValue: [number, number]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: [number, number]]
}>()

const minVal = ref(props.modelValue[0])
const maxVal = ref(props.modelValue[1])

watch(() => props.modelValue, (val) => {
  minVal.value = val[0]
  maxVal.value = val[1]
})

function updateMin(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (v <= maxVal.value) {
    minVal.value = v
    emit('update:modelValue', [minVal.value, maxVal.value])
  }
}

function updateMax(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (v >= minVal.value) {
    maxVal.value = v
    emit('update:modelValue', [minVal.value, maxVal.value])
  }
}
</script>

<template>
  <div class="widget">
    <p class="widget__label">{{ widget.label }}</p>
    <div class="widget__range">
      <div class="widget__range-inputs">
        <div class="widget__range-group">
          <label class="widget__range-label">From</label>
          <input
            type="number"
            class="widget__range-input"
            :min="widget.min"
            :max="widget.max"
            :step="widget.step ?? 1"
            :value="minVal"
            @change="updateMin"
          />
        </div>
        <span class="widget__range-sep">–</span>
        <div class="widget__range-group">
          <label class="widget__range-label">To</label>
          <input
            type="number"
            class="widget__range-input"
            :min="widget.min"
            :max="widget.max"
            :step="widget.step ?? 1"
            :value="maxVal"
            @change="updateMax"
          />
        </div>
      </div>
      <div class="widget__sliders">
        <input
          type="range"
          class="widget__slider"
          :min="widget.min"
          :max="widget.max"
          :step="widget.step ?? 1"
          :value="minVal"
          @input="updateMin"
        />
        <input
          type="range"
          class="widget__slider"
          :min="widget.min"
          :max="widget.max"
          :step="widget.step ?? 1"
          :value="maxVal"
          @input="updateMax"
        />
      </div>
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

.widget__range {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.widget__range-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.widget__range-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.widget__range-label {
  font-size: 0.72rem;
  color: var(--color-text-light);
  font-weight: 500;
}

.widget__range-input {
  width: 100%;
  padding: 0.4rem 0.5rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--color-text);
  background: white;
  outline: none;
  transition: border-color var(--transition);
  -moz-appearance: textfield;
}

.widget__range-input::-webkit-inner-spin-button,
.widget__range-input::-webkit-outer-spin-button {
  opacity: 1;
}

.widget__range-input:focus {
  border-color: var(--color-primary);
}

.widget__range-sep {
  font-size: 1rem;
  color: var(--color-text-muted);
  padding-top: 1.2rem;
  flex-shrink: 0;
}

.widget__sliders {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.widget__slider {
  width: 100%;
  height: 4px;
  appearance: none;
  background: linear-gradient(to right, #c7d2fe, var(--color-primary));
  border-radius: 999px;
  outline: none;
  cursor: pointer;
}

.widget__slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(99, 102, 241, 0.4);
  transition: transform var(--transition);
}

.widget__slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.widget__slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 50%;
  border: none;
  cursor: pointer;
}
</style>
