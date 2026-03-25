import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBar from '@/components/SearchBar.vue'

describe('SearchBar', () => {
  it('renders correctly', () => {
    const wrapper = mount(SearchBar)
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('button.search-bar__btn').exists()).toBe(true)
  })

  it('emits search event when Search button is clicked', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input')
    await input.setValue('books about history')
    await wrapper.find('button.search-bar__btn').trigger('click')

    expect(wrapper.emitted('search')).toBeTruthy()
    expect(wrapper.emitted('search')![0]).toEqual(['books about history'])
  })

  it('emits search event when Enter is pressed', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input')
    await input.setValue('crimean war fiction')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('search')).toBeTruthy()
    expect(wrapper.emitted('search')![0]).toEqual(['crimean war fiction'])
  })

  it('does not emit search event for empty query', async () => {
    const wrapper = mount(SearchBar)
    await wrapper.find('button.search-bar__btn').trigger('click')
    expect(wrapper.emitted('search')).toBeFalsy()
  })

  it('does not emit search for whitespace-only query', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input')
    await input.setValue('   ')
    await wrapper.find('button.search-bar__btn').trigger('click')
    expect(wrapper.emitted('search')).toBeFalsy()
  })

  it('displays modelValue as initial input', async () => {
    const wrapper = mount(SearchBar, {
      props: { modelValue: 'initial query' }
    })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('initial query')
  })

  it('applies compact class when compact prop is true', () => {
    const wrapper = mount(SearchBar, {
      props: { compact: true }
    })
    expect(wrapper.find('.search-bar--compact').exists()).toBe(true)
  })
})
