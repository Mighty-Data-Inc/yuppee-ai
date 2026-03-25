import type { SearchRequest, SearchResponse, SearchResult } from '../types'

const SEARCH_SYSTEM_PROMPT = `You are a helpful search assistant. The user will provide a search query and you will answer it with relevant, accurate, and well-organized information. Be thorough but concise.`

interface SearchProviderConfig {
  openaiApiKey?: string
  model?: string
  useMock?: boolean
}

const MOCK_BOOK_RESULTS: SearchResult[] = [
  { id: 'b1', title: 'The Great Gatsby', url: 'https://example.com/gatsby', snippet: 'A novel by F. Scott Fitzgerald set in the Jazz Age.' },
  { id: 'b2', title: 'To Kill a Mockingbird', url: 'https://example.com/mockingbird', snippet: 'Harper Lee\'s Pulitzer Prize-winning masterpiece.' },
  { id: 'b3', title: '1984', url: 'https://example.com/1984', snippet: 'George Orwell\'s dystopian social science fiction novel.' },
  { id: 'b4', title: 'Pride and Prejudice', url: 'https://example.com/pride', snippet: 'Jane Austen\'s romantic novel of manners.' },
  { id: 'b5', title: 'The Hobbit', url: 'https://example.com/hobbit', snippet: 'J.R.R. Tolkien\'s fantasy novel and prelude to The Lord of the Rings.' },
  { id: 'b6', title: 'Brave New World', url: 'https://example.com/brave', snippet: 'Aldous Huxley\'s dystopian novel set in a futuristic world state.' },
]

const MOCK_MOVIE_RESULTS: SearchResult[] = [
  { id: 'm1', title: 'The Shawshank Redemption', url: 'https://example.com/shawshank', snippet: 'Two imprisoned men bond over years, finding solace and redemption.' },
  { id: 'm2', title: 'The Godfather', url: 'https://example.com/godfather', snippet: 'The aging patriarch of an organized crime dynasty transfers control to his son.' },
  { id: 'm3', title: 'The Dark Knight', url: 'https://example.com/dark-knight', snippet: 'Batman faces the Joker, a criminal mastermind who plunges Gotham into anarchy.' },
  { id: 'm4', title: 'Pulp Fiction', url: 'https://example.com/pulp-fiction', snippet: 'The lives of two mob hitmen, a boxer, and others intertwine in interconnected stories.' },
  { id: 'm5', title: 'Schindler\'s List', url: 'https://example.com/schindler', snippet: 'In German-occupied Poland, Oskar Schindler saves over a thousand Jewish lives.' },
  { id: 'm6', title: 'Inception', url: 'https://example.com/inception', snippet: 'A thief who steals corporate secrets through dream-sharing technology.' },
]

const MOCK_GENERAL_RESULTS: SearchResult[] = [
  { id: 'g1', title: 'Introduction to Artificial Intelligence', url: 'https://example.com/ai-intro', snippet: 'A comprehensive overview of AI concepts, history, and applications.' },
  { id: 'g2', title: 'The Future of Technology', url: 'https://example.com/tech-future', snippet: 'Exploring emerging technologies shaping the world in the next decade.' },
  { id: 'g3', title: 'Understanding Machine Learning', url: 'https://example.com/ml', snippet: 'An accessible guide to machine learning algorithms and use cases.' },
  { id: 'g4', title: 'Climate Change: An Overview', url: 'https://example.com/climate', snippet: 'The science behind climate change and its global implications.' },
  { id: 'g5', title: 'Healthy Living Tips', url: 'https://example.com/health', snippet: 'Evidence-based strategies for improving your physical and mental health.' },
  { id: 'g6', title: 'World History: A Timeline', url: 'https://example.com/history', snippet: 'Key events and developments in human civilization from ancient times to present.' },
]

export class SearchProvider {
  private readonly config: Required<SearchProviderConfig>

  constructor(config: SearchProviderConfig = {}) {
    this.config = {
      openaiApiKey: config.openaiApiKey ?? '',
      model: config.model ?? 'gpt-4o-mini',
      useMock: config.useMock ?? true,
    }
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    const page = request.page ?? 1
    const pageSize = request.pageSize ?? 10

    if (this.config.useMock) {
      return this.mockSearch(request, page, pageSize)
    }

    return this.realSearch(request, page, pageSize)
  }

  private mockSearch(request: SearchRequest, page: number, pageSize: number): SearchResponse {
    const query = request.query.toLowerCase()
    let results: SearchResult[]

    if (query.includes('book') || query.includes('novel') || query.includes('read')) {
      results = MOCK_BOOK_RESULTS
    } else if (query.includes('movie') || query.includes('film') || query.includes('cinema')) {
      results = MOCK_MOVIE_RESULTS
    } else {
      results = MOCK_GENERAL_RESULTS
    }

    return {
      results,
      totalCount: results.length,
      page,
      pageSize,
      query: request.query,
    }
  }

  private async realSearch(request: SearchRequest, page: number, pageSize: number): Promise<SearchResponse> {
    if (!this.config.openaiApiKey) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in your environment.')
    }

    if (page > 1) {
      return { results: [], totalCount: 1, page, pageSize, query: request.query }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: SEARCH_SYSTEM_PROMPT },
          { role: 'user', content: request.query },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as { choices?: Array<{ message: { content: string } }> }
    if (!Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error('Unexpected response from OpenAI API: missing choices')
    }
    const content = data.choices[0].message.content

    const result: SearchResult = {
      id: 'gpt-response',
      title: `GPT response for: "${request.query}"`,
      url: '',
      snippet: content,
    }

    return {
      results: [result],
      totalCount: 1,
      page,
      pageSize,
      query: request.query,
    }
  }
}
