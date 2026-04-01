<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Slider from '@vueform/slider'
import '@vueform/slider/themes/default.css'
import type { Widget } from '@/types'

const props = defineProps<{
  widget: Widget
  modelValue: number | [number, number]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | [number, number]]
}>()

const sliderMode = computed(() => props.widget.sliderMode ?? 'range')

const normalizedValue = computed<number | [number, number]>(() => {
  const min = props.widget.min ?? 0
  const max = props.widget.max ?? 100
  const val = props.modelValue

  if (sliderMode.value === 'range') {
    if (Array.isArray(val) && val.length >= 2) {
      return [Number(val[0]), Number(val[1])]
    }
    return [min, max]
  }

  if (typeof val === 'number') {
    return Number(val)
  }

  if (Array.isArray(val) && val.length > 0) {
    return Number(val[0])
  }

  if (sliderMode.value === 'lte') {
    return max
  }

  return min
})

const internalValue = ref<number | [number, number]>(normalizedValue.value)

watch(normalizedValue, (val) => {
  if (JSON.stringify(val) !== JSON.stringify(internalValue.value)) {
    internalValue.value = val
  }
}, { immediate: true })

watch(internalValue, (val) => {
  emit('update:modelValue', val)
})

const connect = computed(() => {
  if (sliderMode.value === 'range') return true
  if (sliderMode.value === 'lte') return 'lower'
  if (sliderMode.value === 'gte') return 'upper'
  return false
})

const singleInputLabel = computed(() => {
  if (sliderMode.value === 'lte') return 'At Most'
  if (sliderMode.value === 'gte') return 'At Least'
  return 'Exactly'
})

const lowerBoundValue = computed(() => {
  if (Array.isArray(internalValue.value)) return internalValue.value[0]
  if (sliderMode.value === 'lte') return props.widget.min ?? 0
  return internalValue.value
})

const upperBoundValue = computed(() => {
  if (Array.isArray(internalValue.value)) return internalValue.value[1]
  if (sliderMode.value === 'gte') return props.widget.max ?? 100
  return internalValue.value
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
    <div class="widget__range">
      <div v-if="sliderMode === 'range'" class="widget__range-inputs">
        <div class="widget__range-group">
          <label class="widget__range-label">From</label>
          <input
            type="number"
            class="widget__range-input"
            :min="widget.min"
            :max="widget.max"
            :step="widget.step ?? 1"
            :value="lowerBoundValue"
            @change="internalValue = sliderMode === 'range' ? [Number(($event.target as HTMLInputElement).value), upperBoundValue] : Number(($event.target as HTMLInputElement).value)"
          />
        </div>
        <span v-if="sliderMode === 'range'" class="widget__range-sep">–</span>
        <div class="widget__range-group">
          <label class="widget__range-label">To</label>
          <input
            type="number"
            class="widget__range-input"
            :min="widget.min"
            :max="widget.max"
            :step="widget.step ?? 1"
            :value="upperBoundValue"
            @change="internalValue = [lowerBoundValue, Number(($event.target as HTMLInputElement).value)]"
          />
        </div>
      </div>
      <div v-else class="widget__range-group">
        <label class="widget__range-label">{{ singleInputLabel }}</label>
        <input
          type="number"
          class="widget__range-input"
          :min="widget.min"
          :max="widget.max"
          :step="widget.step ?? 1"
          :value="internalValue"
          @change="internalValue = Number(($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="widget__slider-wrap">
        <Slider
          v-model="internalValue"
          class="widget__slider"
          :min="widget.min ?? 0"
          :max="widget.max ?? 100"
          :step="widget.step ?? 1"
          :connect="connect"
          :tooltips="false"
          :lazy="false"
        />
      </div>
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

.widget__range {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
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

.widget__slider-wrap {
  padding: 0.15rem 0.2rem;
}

:deep(.widget__slider) {
  --slider-connect-bg: var(--color-primary);
  --slider-bg: #e5e7eb;
  --slider-height: 6px;
  --slider-handle-width: 18px;
  --slider-handle-height: 18px;
  --slider-handle-bg: #fff;
  --slider-handle-shadow: 0 1px 4px rgba(15, 23, 42, 0.25);
  --slider-handle-ring-width: 3px;
  --slider-handle-ring-color: rgba(99, 102, 241, 0.2);
}
</style>
