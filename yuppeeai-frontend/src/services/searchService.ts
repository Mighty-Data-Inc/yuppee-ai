import type { SearchResult, Widget } from '@/types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

export async function search(
  query: string,
  filters?: Record<string, any>
): Promise<SearchResult[]> {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, filters }),
  })
  if (!response.ok) {
    throw new Error(`Search request failed: ${response.status}`)
  }
  const data = await response.json()
  return data.results as SearchResult[]
}

export async function generateWidgets(
  query: string,
  currentFilters?: Record<string, any>
): Promise<Widget[]> {
  await new Promise(resolve => setTimeout(resolve, 400))
  const q = query.toLowerCase()

  if (q.includes('book') || q.includes('novel') || q.includes('fiction') || q.includes('crimean') || q.includes('literature')) {
    const widgets: Widget[] = [
      {
        id: 'fiction-type',
        type: 'radio',
        label: 'Fiction / Nonfiction',
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Fiction', value: 'fiction' },
          { label: 'Nonfiction', value: 'nonfiction' }
        ],
        value: currentFilters?.['fiction-type'] ?? 'any'
      },
      {
        id: 'year-range',
        type: 'range-slider',
        label: 'Publication Year',
        min: 1800,
        max: 2024,
        step: 1,
        value: currentFilters?.['year-range'] ?? [1800, 2024]
      },
      {
        id: 'pages-range',
        type: 'range-slider',
        label: 'Page Count',
        min: 50,
        max: 1000,
        step: 10,
        value: currentFilters?.['pages-range'] ?? [50, 1000]
      },
      {
        id: 'genres',
        type: 'checkbox',
        label: 'Genres',
        options: [
          { label: 'History', value: 'history' },
          { label: 'Biography', value: 'biography' },
          { label: 'Military', value: 'military' },
          { label: 'Politics', value: 'politics' },
          { label: 'Adventure', value: 'adventure' }
        ],
        value: currentFilters?.['genres'] ?? []
      },
      {
        id: 'reading-level',
        type: 'dropdown',
        label: 'Reading Level',
        options: [
          { label: 'Any level', value: 'any' },
          { label: 'General audience', value: 'general' },
          { label: 'Intermediate', value: 'intermediate' },
          { label: 'Academic / Scholarly', value: 'academic' }
        ],
        value: currentFilters?.['reading-level'] ?? 'any'
      }
    ]

    const fictionType = currentFilters?.['fiction-type']
    if (fictionType === 'nonfiction') {
      widgets.push({
        id: 'scholarly-level',
        type: 'dropdown',
        label: 'Scholarly Level',
        options: [
          { label: 'Popular nonfiction', value: 'popular' },
          { label: 'Narrative nonfiction', value: 'narrative' },
          { label: 'Academic paper', value: 'academic-paper' },
          { label: 'Textbook', value: 'textbook' }
        ],
        value: currentFilters?.['scholarly-level'] ?? 'popular'
      })
    }

    if (fictionType === 'fiction') {
      widgets.push({
        id: 'fiction-genres',
        type: 'checkbox',
        label: 'Fiction Genres',
        options: [
          { label: 'Fantasy', value: 'fantasy' },
          { label: 'Sci-Fi', value: 'sci-fi' },
          { label: 'Historical', value: 'historical' },
          { label: 'Romance', value: 'romance' },
          { label: 'Mystery', value: 'mystery' }
        ],
        value: currentFilters?.['fiction-genres'] ?? []
      })
    }

    return widgets
  }

  if (q.includes('movie') || q.includes('film') || q.includes('cinema') || q.includes('watch')) {
    return [
      {
        id: 'movie-genres',
        type: 'checkbox',
        label: 'Genre',
        options: [
          { label: 'Action', value: 'action' },
          { label: 'Comedy', value: 'comedy' },
          { label: 'Drama', value: 'drama' },
          { label: 'Horror', value: 'horror' },
          { label: 'Sci-Fi', value: 'sci-fi' },
          { label: 'Documentary', value: 'documentary' }
        ],
        value: currentFilters?.['movie-genres'] ?? []
      },
      {
        id: 'movie-year',
        type: 'range-slider',
        label: 'Release Year',
        min: 1900,
        max: 2024,
        step: 1,
        value: currentFilters?.['movie-year'] ?? [1990, 2024]
      },
      {
        id: 'rating',
        type: 'dropdown',
        label: 'Minimum Rating',
        options: [
          { label: 'Any rating', value: 'any' },
          { label: '6+ / 10', value: '6' },
          { label: '7+ / 10', value: '7' },
          { label: '8+ / 10', value: '8' },
          { label: '9+ / 10', value: '9' }
        ],
        value: currentFilters?.['rating'] ?? 'any'
      },
      {
        id: 'format',
        type: 'radio',
        label: 'Format',
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Theatrical', value: 'theatrical' },
          { label: 'Streaming', value: 'streaming' }
        ],
        value: currentFilters?.['format'] ?? 'any'
      }
    ]
  }

  return [
    {
      id: 'date-range',
      type: 'range-slider',
      label: 'Date Range',
      min: 2000,
      max: 2024,
      step: 1,
      value: currentFilters?.['date-range'] ?? [2010, 2024]
    },
    {
      id: 'sort-by',
      type: 'dropdown',
      label: 'Sort By',
      options: [
        { label: 'Most relevant', value: 'relevance' },
        { label: 'Most recent', value: 'recent' },
        { label: 'Most popular', value: 'popular' },
        { label: 'Highest rated', value: 'rated' }
      ],
      value: currentFilters?.['sort-by'] ?? 'relevance'
    },
    {
      id: 'freeform',
      type: 'freeform',
      label: 'Additional Criteria',
      value: currentFilters?.['freeform'] ?? ''
    }
  ]
}
