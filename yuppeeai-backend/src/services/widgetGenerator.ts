import type { Widget, WidgetsRequest } from '../types'

interface WidgetGeneratorConfig {
  openaiApiKey?: string
  model?: string
  useMock?: boolean
}

const WIDGET_GENERATION_PROMPT = `You are a search UI assistant. Given a search query, generate an array of filter widgets that would help the user refine their search results.

Return a JSON array of widget objects. Each widget must have:
- id: unique snake_case string
- type: one of "radio", "range-slider", "checkbox", "dropdown", "freeform"
- label: human-readable label
- options: array of {label, value} for radio/checkbox/dropdown types
- min, max, step: numbers for range-slider type
- defaultValue: optional default

Keep the list concise (3-6 widgets). Match widgets to the domain of the query.
Return only the JSON array, no explanation.`

export class WidgetGenerator {
  private readonly config: Required<WidgetGeneratorConfig>

  constructor(config: WidgetGeneratorConfig = {}) {
    this.config = {
      openaiApiKey: config.openaiApiKey ?? '',
      model: config.model ?? 'gpt-4o-mini',
      useMock: config.useMock ?? true,
    }
  }

  async generateWidgets(request: WidgetsRequest): Promise<Widget[]> {
    if (this.config.useMock) {
      return this.mockGenerateWidgets(request)
    }

    return this.realGenerateWidgets(request)
  }

  private mockGenerateWidgets(request: WidgetsRequest): Widget[] {
    const query = request.query.toLowerCase()
    const filters = request.currentFilters ?? {}

    if (query.includes('book') || query.includes('novel') || query.includes('read')) {
      return this.buildBookWidgets(filters)
    }

    if (query.includes('movie') || query.includes('film') || query.includes('cinema')) {
      return this.buildMovieWidgets()
    }

    return this.buildDefaultWidgets()
  }

  private buildBookWidgets(filters: Record<string, unknown>): Widget[] {
    const widgets: Widget[] = [
      {
        id: 'fiction',
        type: 'radio',
        label: 'Fiction or Nonfiction',
        options: [
          { label: 'Fiction', value: 'fiction' },
          { label: 'Nonfiction', value: 'nonfiction' },
        ],
        defaultValue: 'fiction',
      },
      {
        id: 'year',
        type: 'range-slider',
        label: 'Publication Year',
        min: 1900,
        max: new Date().getFullYear(),
        step: 1,
        defaultValue: [1900, new Date().getFullYear()],
      },
      {
        id: 'pages',
        type: 'range-slider',
        label: 'Number of Pages',
        min: 50,
        max: 1500,
        step: 10,
        defaultValue: [50, 1500],
      },
    ]

    if (filters['fiction'] === 'nonfiction') {
      widgets.push({
        id: 'genre',
        type: 'checkbox',
        label: 'Genre',
        options: [
          { label: 'Biography', value: 'biography' },
          { label: 'History', value: 'history' },
          { label: 'Science', value: 'science' },
          { label: 'Self-Help', value: 'self-help' },
          { label: 'Travel', value: 'travel' },
        ],
      })
      widgets.push({
        id: 'scholarly_level',
        type: 'dropdown',
        label: 'Scholarly Level',
        options: [
          { label: 'Popular', value: 'popular' },
          { label: 'Academic', value: 'academic' },
          { label: 'Peer-Reviewed', value: 'peer-reviewed' },
        ],
        defaultValue: 'popular',
      })
    } else if (filters['fiction'] === 'fiction') {
      widgets.push({
        id: 'genre',
        type: 'checkbox',
        label: 'Fiction Genre',
        options: [
          { label: 'Fantasy', value: 'fantasy' },
          { label: 'Science Fiction', value: 'sci-fi' },
          { label: 'Mystery', value: 'mystery' },
          { label: 'Romance', value: 'romance' },
          { label: 'Thriller', value: 'thriller' },
          { label: 'Literary Fiction', value: 'literary' },
        ],
      })
    } else {
      widgets.push({
        id: 'genre',
        type: 'checkbox',
        label: 'Genre',
        options: [
          { label: 'Fantasy', value: 'fantasy' },
          { label: 'Science Fiction', value: 'sci-fi' },
          { label: 'Mystery', value: 'mystery' },
          { label: 'Romance', value: 'romance' },
          { label: 'Biography', value: 'biography' },
          { label: 'History', value: 'history' },
        ],
      })
    }

    widgets.push({
      id: 'reading_level',
      type: 'dropdown',
      label: 'Reading Level',
      options: [
        { label: 'Children', value: 'children' },
        { label: 'Young Adult', value: 'ya' },
        { label: 'Adult', value: 'adult' },
      ],
      defaultValue: 'adult',
    })

    return widgets
  }

  private buildMovieWidgets(): Widget[] {
    return [
      {
        id: 'genre',
        type: 'checkbox',
        label: 'Genre',
        options: [
          { label: 'Action', value: 'action' },
          { label: 'Comedy', value: 'comedy' },
          { label: 'Drama', value: 'drama' },
          { label: 'Horror', value: 'horror' },
          { label: 'Sci-Fi', value: 'sci-fi' },
          { label: 'Documentary', value: 'documentary' },
        ],
      },
      {
        id: 'year',
        type: 'range-slider',
        label: 'Release Year',
        min: 1900,
        max: new Date().getFullYear(),
        step: 1,
        defaultValue: [1990, new Date().getFullYear()],
      },
      {
        id: 'rating',
        type: 'dropdown',
        label: 'Rating',
        options: [
          { label: 'Any', value: 'any' },
          { label: 'G', value: 'g' },
          { label: 'PG', value: 'pg' },
          { label: 'PG-13', value: 'pg-13' },
          { label: 'R', value: 'r' },
        ],
        defaultValue: 'any',
      },
      {
        id: 'format',
        type: 'radio',
        label: 'Format',
        options: [
          { label: 'Theatrical', value: 'theatrical' },
          { label: 'Streaming', value: 'streaming' },
          { label: 'Both', value: 'both' },
        ],
        defaultValue: 'both',
      },
    ]
  }

  private buildDefaultWidgets(): Widget[] {
    return [
      {
        id: 'date_range',
        type: 'range-slider',
        label: 'Date Range',
        min: 2000,
        max: new Date().getFullYear(),
        step: 1,
        defaultValue: [2000, new Date().getFullYear()],
      },
      {
        id: 'sort_by',
        type: 'dropdown',
        label: 'Sort By',
        options: [
          { label: 'Relevance', value: 'relevance' },
          { label: 'Date (Newest)', value: 'date_desc' },
          { label: 'Date (Oldest)', value: 'date_asc' },
        ],
        defaultValue: 'relevance',
      },
      {
        id: 'keywords',
        type: 'freeform',
        label: 'Additional Keywords',
      },
    ]
  }

  private async realGenerateWidgets(request: WidgetsRequest): Promise<Widget[]> {
    // TODO: Implement real widget generation using OpenAI API
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${this.config.openaiApiKey}`,
    //   },
    //   body: JSON.stringify({
    //     model: this.config.model,
    //     messages: [
    //       { role: 'system', content: WIDGET_GENERATION_PROMPT },
    //       { role: 'user', content: `Query: "${request.query}"\nCurrent filters: ${JSON.stringify(request.currentFilters ?? {})}` },
    //     ],
    //     response_format: { type: 'json_object' },
    //   }),
    // })
    //
    // if (!response.ok) {
    //   throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    // }
    //
    // const data = await response.json()
    // const content = data.choices[0]?.message?.content
    // return JSON.parse(content) as Widget[]
    void request
    void WIDGET_GENERATION_PROMPT
    throw new Error('Real widget generation not yet implemented. Set USE_MOCK=true or implement the OpenAI integration.')
  }
}
