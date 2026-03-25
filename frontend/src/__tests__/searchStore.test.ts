import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSearchStore } from '@/stores/searchStore'

describe('searchStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with empty state', () => {
    const store = useSearchStore()
    expect(store.query).toBe('')
    expect(store.results).toHaveLength(0)
    expect(store.widgets).toHaveLength(0)
    expect(store.isLoading).toBe(false)
  })

  it('sets loading state during performSearch', async () => {
    const store = useSearchStore()
    const loadingStates: boolean[] = []

    const promise = store.performSearch('books about history')
    loadingStates.push(store.isLoading) // Should be true at start

    await promise
    loadingStates.push(store.isLoading) // Should be false after

    expect(loadingStates[0]).toBe(true)
    expect(loadingStates[1]).toBe(false)
  })

  it('populates results after performSearch', async () => {
    const store = useSearchStore()
    await store.performSearch('books about Crimean War')
    expect(store.results.length).toBeGreaterThan(0)
    expect(store.query).toBe('books about Crimean War')
  })

  it('populates widgets after performSearch', async () => {
    const store = useSearchStore()
    await store.performSearch('books about history')
    expect(store.widgets.length).toBeGreaterThan(0)
  })

  it('updates widget value with updateWidgetValue', async () => {
    const store = useSearchStore()
    await store.performSearch('books about history')

    const firstWidget = store.widgets[0]
    const newValue = 'nonfiction'
    store.updateWidgetValue(firstWidget.id, newValue)

    const updated = store.widgets.find(w => w.id === firstWidget.id)
    expect(updated?.value).toBe(newValue)
  })

  it('clears state with clearSearch', async () => {
    const store = useSearchStore()
    await store.performSearch('books')
    store.clearSearch()

    expect(store.query).toBe('')
    expect(store.results).toHaveLength(0)
    expect(store.widgets).toHaveLength(0)
    expect(store.isLoading).toBe(false)
  })
})
