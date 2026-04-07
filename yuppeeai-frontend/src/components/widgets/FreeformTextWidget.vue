<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  disabled?: boolean
}>(), {
  placeholder: 'Describe additional criteria...',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <textarea
    class="freeform"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    rows="3"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>

<style scoped>
.freeform {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--color-text);
  background: white;
  outline: none;
  resize: vertical;
  min-height: 80px;
  transition: border-color var(--transition), box-shadow var(--transition);
  line-height: 1.6;
}

.freeform:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.freeform::placeholder {
  color: var(--color-text-light);
  font-style: italic;
}

.freeform:disabled {
  background: #f8fafc;
  color: var(--color-text-light);
  cursor: not-allowed;
}
</style>
