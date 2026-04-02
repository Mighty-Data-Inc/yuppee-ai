<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Widget } from '@/types'
import RangeSliderWidget from '@/components/widgets/RangeSliderWidget.vue'
import ChipGroupWidget from '@/components/widgets/ChipGroupWidget.vue'
import SwitchWidget from '@/components/widgets/SwitchWidget.vue'
import DropdownWidget from '@/components/widgets/DropdownWidget.vue'
import FreeformTextWidget from '@/components/widgets/FreeformTextWidget.vue'

const props = defineProps<{
  widgets: Widget[]
  isLoading: boolean
  query: string
}>()

const emit = defineEmits<{
  refine: [
    widgetValues: Record<string, any>,
    additionalInstructions: string[],
    refinementChanges: string[],
  ]
}>()

const widgetValues = ref<Record<string, any>>({})
const instructionInput = ref('')
const additionalInstructions = ref<string[]>([])
const baselineWidgetValues = ref<Record<string, any>>({})

function cloneValues(values: Record<string, any>): Record<string, any> {
  return JSON.parse(JSON.stringify(values))
}

function hasValueChanges(
  current: Record<string, any>,
  baseline: Record<string, any>,
): boolean {
  return JSON.stringify(current) !== JSON.stringify(baseline)
}

function resetLocalState() {
  widgetValues.value = {}
  instructionInput.value = ''
  additionalInstructions.value = []
  baselineWidgetValues.value = {}
}

watch(() => props.query, (newQuery, oldQuery) => {
  if (newQuery !== oldQuery) {
    resetLocalState()
  }
})

watch(() => props.widgets, (newWidgets) => {
  const newValues: Record<string, any> = {}
  for (const widget of newWidgets) {
    newValues[widget.id] = widgetValues.value[widget.id] ?? widget.value
  }
  widgetValues.value = newValues
  baselineWidgetValues.value = cloneValues(newValues)
}, { immediate: true, deep: true })

function getNextInstructions(): string[] {
  const nextInstructions = [...additionalInstructions.value]
  const trimmedInput = instructionInput.value.trim()
  if (trimmedInput) {
    nextInstructions.push(trimmedInput)
  }
  return nextInstructions
}

function updateValue(widgetId: string, value: any) {
  widgetValues.value[widgetId] = value
}

function resolveLabel(widget: Widget, value: any): any {
  if (widget.type === 'dropdown' && widget.options) {
    const match = widget.options.find(o => o.value === value)
    return match ? match.label : value
  }
  return value
}

function describeSearchRefinementChanges(): string[] {
  const lines: string[] = []
  for (const widget of props.widgets) {
    const previousWidgetValue = baselineWidgetValues.value[widget.id]
    const currentWidgetValue = widgetValues.value[widget.id]
    if (JSON.stringify(previousWidgetValue) !== JSON.stringify(currentWidgetValue)) {
      if (widget.type === 'dropdown') {
        const previousLabel = resolveLabel(widget, previousWidgetValue)
        const currentLabel = resolveLabel(widget, currentWidgetValue)
        if (!previousLabel) {
          lines.push(`${widget.label}: Applying criterion "${currentLabel}"`)
        } else if (!currentLabel) {
          lines.push(`${widget.label}: Removing criterion "${previousLabel}"`)
        } else {
          lines.push(`${widget.label}: "${previousLabel}" → "${currentLabel}"`)
        }
      } else if (widget.type === 'switch') {
        if (currentWidgetValue) {
          lines.push(`Applying criterion "${widget.label}"`)
        } else {
          lines.push(`Removing criterion "${widget.label}"`)
        }
      } else if (widget.type === 'chipgroup') {
        const previousChips: string[] = previousWidgetValue ?? []
        const currentChips: string[] = currentWidgetValue ?? []
        const resolveChipLabel = (value: string) =>
          widget.options?.find(o => o.value === value)?.label ?? value
        const added = currentChips
          .filter(v => !previousChips.includes(v))
          .map(resolveChipLabel)
        const removed = previousChips
          .filter(v => !currentChips.includes(v))
          .map(resolveChipLabel)
        if (added.length) lines.push(`${widget.label}: Adding "${added.join('", "')}"`)
        if (removed.length) lines.push(`${widget.label}: Removing "${removed.join('", "')}"`)

      } else if (widget.type === 'range-slider') {
        const mode = widget.sliderMode ?? 'range'
        if (mode === 'exact') {
          lines.push(`${widget.label}: Changing value from ${previousWidgetValue} to ${currentWidgetValue}`)
        } else if (mode === 'lte') {
          lines.push(`${widget.label}: Changing upper bound from ${previousWidgetValue} to ${currentWidgetValue}`)
        } else if (mode === 'gte') {
          lines.push(`${widget.label}: Changing lower bound from ${previousWidgetValue} to ${currentWidgetValue}`)
        } else if (mode === 'range') {
          if (Array.isArray(previousWidgetValue) && Array.isArray(currentWidgetValue)) {
            const [prevLow, prevHigh] = previousWidgetValue as [number, number]
            const [currLow, currHigh] = currentWidgetValue as [number, number]
            if (prevLow !== currLow) lines.push(`${widget.label}: Changing lower bound from ${prevLow} to ${currLow}`)
            if (prevHigh !== currHigh) lines.push(`${widget.label}: Changing upper bound from ${prevHigh} to ${currHigh}`)
          }
        }
      }
    }
  }
  const trimmedInput = instructionInput.value.trim()
  if (trimmedInput) {
    lines.push(`Adding additional instructions: "${trimmedInput}"`)
  }

  return lines
}

function handleSearchAgain() {
  if (!canSearchAgain.value) return
  const nextInstructions = getNextInstructions()
  const refinementChanges = describeSearchRefinementChanges()
  console.log('Changed filters:', refinementChanges)
  emit('refine', { ...widgetValues.value }, nextInstructions, refinementChanges)
  additionalInstructions.value = nextInstructions
  instructionInput.value = ''
}

function removeInstruction(index: number) {
  additionalInstructions.value = additionalInstructions.value.filter((_, i) => i !== index)
}

const nonFreeformWidgets = () => props.widgets.filter(w => w.type !== 'freeform')
const canSearchAgain = computed(() => {
  if (props.isLoading) return false
  if (hasValueChanges(widgetValues.value, baselineWidgetValues.value)) return true
  return Boolean(instructionInput.value.trim())
})
</script>

<template>
  <div class="widget-panel">
    <div class="widget-panel__header">
      <svg class="widget-panel__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      <h2 class="widget-panel__title">Refine Your Search</h2>
    </div>

    <!-- Loading state (initial load only) -->
    <template v-if="isLoading && widgets.length === 0">
      <p class="widget-panel__loading-message">Analyzing results and devising refinement criteria...</p>
      <div v-for="i in 4" :key="i" class="widget-skeleton">
        <div class="skeleton-line skeleton-line--label" />
        <div class="skeleton-line skeleton-line--control" />
      </div>
    </template>

    <!-- Widgets -->
    <template v-else-if="widgets.length > 0">
      <div class="widget-panel__widgets">
        <template v-for="widget in nonFreeformWidgets()" :key="widget.id">
          <RangeSliderWidget
            v-if="widget.type === 'range-slider'"
            :widget="widget"
            :model-value="widgetValues[widget.id] ?? widget.value"
            @update:model-value="updateValue(widget.id, $event)"
          />
          <ChipGroupWidget
            v-else-if="widget.type === 'chipgroup'"
            :widget="widget"
            :model-value="widgetValues[widget.id] ?? widget.value"
            @update:model-value="updateValue(widget.id, $event)"
          />
          <SwitchWidget
            v-else-if="widget.type === 'switch'"
            :widget="widget"
            :model-value="widgetValues[widget.id] ?? widget.value"
            @update:model-value="updateValue(widget.id, $event)"
          />
          <DropdownWidget
            v-else-if="widget.type === 'dropdown'"
            :widget="widget"
            :model-value="widgetValues[widget.id] ?? widget.value"
            @update:model-value="updateValue(widget.id, $event)"
          />
        </template>
      </div>

      <div class="widget-panel__freeform">
        <p class="widget-panel__freeform-label">Additional instructions...</p>

        <transition-group
          v-if="additionalInstructions.length"
          name="instruction-card"
          tag="div"
          class="widget-panel__instruction-list"
        >
          <div
            v-for="(instruction, index) in additionalInstructions"
            :key="`${instruction}-${index}`"
            class="widget-panel__instruction-card"
          >
            <button
              class="widget-panel__instruction-remove"
              type="button"
              aria-label="Remove additional instruction"
              @click="removeInstruction(index)"
            >
              x
            </button>
            <p class="widget-panel__instruction-text">{{ instruction }}</p>
          </div>
        </transition-group>

        <FreeformTextWidget
          :model-value="instructionInput"
          placeholder="Modify the search results per your explanation, e.g. 'written by a British author, published after 2000'"
          @update:model-value="instructionInput = $event"
        />
      </div>

      <button class="widget-panel__btn" :disabled="!canSearchAgain" @click="handleSearchAgain">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        Search Again
      </button>
    </template>

    <!-- Empty state -->
    <div v-else class="widget-panel__empty">
      <p>Perform a search to see refinement options.</p>
    </div>
  </div>
</template>

<style scoped>
.widget-panel {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: var(--shadow-sm);
}

.widget-panel__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.widget-panel__icon {
  width: 18px;
  height: 18px;
  color: var(--color-primary);
}

.widget-panel__title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.widget-panel__loading-message {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.widget-panel__widgets {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.widget-panel__freeform {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.widget-panel__instruction-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.widget-panel__instruction-card {
  position: relative;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #f8fafc;
  padding: 0.6rem 0.6rem 0.5rem 0.95rem;
  max-width: 100%;
}

.instruction-card-enter-active,
.instruction-card-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.instruction-card-enter-from,
.instruction-card-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}

.instruction-card-move {
  transition: transform 180ms ease;
}

.widget-panel__instruction-text {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.35;
  color: var(--color-text);
  word-break: break-word;
}

.widget-panel__instruction-remove {
  position: absolute;
  top: -0.35rem;
  left: -0.35rem;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: white;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition), color var(--transition), border-color var(--transition);
}

.widget-panel__instruction-card:hover .widget-panel__instruction-remove,
.widget-panel__instruction-remove:focus-visible {
  opacity: 1;
  pointer-events: auto;
}

.widget-panel__instruction-remove:hover,
.widget-panel__instruction-remove:focus-visible {
  color: #b91c1c;
  border-color: #fecaca;
}

.widget-panel__freeform-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.widget-panel__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 500;
  transition: background var(--transition), box-shadow var(--transition), transform var(--transition);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.widget-panel__btn:hover {
  background: var(--color-primary-dark);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.widget-panel__btn:disabled {
  background: #cbd5e1;
  color: #f8fafc;
  cursor: not-allowed;
  box-shadow: none;
}

.widget-panel__btn:active {
  transform: translateY(1px);
}

.widget-panel__empty {
  padding: 1.5rem 0;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

/* Skeleton */
.widget-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.skeleton-line {
  background: linear-gradient(90deg, #f0f4ff 25%, #e8edff 50%, #f0f4ff 75%);
  background-size: 200% 100%;
  border-radius: 999px;
  animation: shimmer 1.5s infinite;
}

.skeleton-line--label {
  height: 12px;
  width: 40%;
}

.skeleton-line--control {
  height: 36px;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
