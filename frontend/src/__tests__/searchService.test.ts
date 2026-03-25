import { describe, it, expect } from 'vitest'
import { search, generateWidgets } from '@/services/searchService'

describe('searchService.search', () => {
  it('returns results for book-related queries', async () => {
    const results = await search('Books about Crimean War')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]).toHaveProperty('id')
    expect(results[0]).toHaveProperty('title')
    expect(results[0]).toHaveProperty('url')
    expect(results[0]).toHaveProperty('snippet')
  })

  it('returns results for movie-related queries', async () => {
    const results = await search('best sci-fi movies')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].url).toMatch(/imdb|rottentomatoes|metacritic|letterboxd|a24/i)
  })

  it('returns default results for generic queries', async () => {
    const results = await search('artificial intelligence search')
    expect(results.length).toBeGreaterThan(0)
  })

  it('returns 6 results', async () => {
    const results = await search('books about history')
    expect(results).toHaveLength(6)
  })
})

describe('searchService.generateWidgets', () => {
  it('returns book widgets for book queries', async () => {
    const widgets = await generateWidgets('Books about Crimean War')
    const types = widgets.map(w => w.type)
    expect(types).toContain('radio')
    expect(types).toContain('range-slider')
    expect(types).toContain('checkbox')
    expect(types).toContain('dropdown')
  })

  it('returns movie widgets for movie queries', async () => {
    const widgets = await generateWidgets('best sci-fi movies')
    const types = widgets.map(w => w.type)
    expect(types).toContain('checkbox')
    expect(types).toContain('range-slider')
    expect(types).toContain('dropdown')
    expect(types).toContain('radio')
  })

  it('returns default widgets for generic queries', async () => {
    const widgets = await generateWidgets('artificial intelligence')
    expect(widgets.length).toBeGreaterThan(0)
    const types = widgets.map(w => w.type)
    expect(types).toContain('dropdown')
  })

  it('adds scholarly-level widget when fiction-type is nonfiction', async () => {
    const widgets = await generateWidgets('books', { 'fiction-type': 'nonfiction' })
    const ids = widgets.map(w => w.id)
    expect(ids).toContain('scholarly-level')
  })

  it('adds fiction-genres widget when fiction-type is fiction', async () => {
    const widgets = await generateWidgets('books', { 'fiction-type': 'fiction' })
    const ids = widgets.map(w => w.id)
    expect(ids).toContain('fiction-genres')
  })
})
