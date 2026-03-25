import type { SearchResult, Widget } from '@/types'

const bookResults: SearchResult[] = [
  {
    id: '1',
    title: 'The Crimean War: A History – Orlando Figes',
    url: 'https://www.goodreads.com/book/show/12551500',
    snippet: 'A landmark history of the Crimean War (1853–1856), drawing on archives in six countries. Orlando Figes reveals a conflict that shaped the modern world in ways still felt today.'
  },
  {
    id: '2',
    title: 'Crimea: The Last Crusade – Orlando Figes | Penguin Books',
    url: 'https://www.penguin.co.uk/books/57398/crimea',
    snippet: 'The definitive account of the Crimean War, a conflict that pitted Russia against an alliance of Britain, France, and the Ottoman Empire on the Crimean Peninsula.'
  },
  {
    id: '3',
    title: 'Sevastopol Sketches – Leo Tolstoy',
    url: 'https://www.gutenberg.org/ebooks/1630',
    snippet: 'Tolstoy\'s autobiographical sketches based on his experience as an artillery officer during the Siege of Sevastopol, one of the bloodiest episodes of the Crimean War.'
  },
  {
    id: '4',
    title: 'The Reason Why – Cecil Woodham-Smith',
    url: 'https://www.amazon.com/Reason-Why-Cecil-Woodham-Smith/dp/0070717915',
    snippet: 'The story of the disastrous Charge of the Light Brigade at the Battle of Balaclava, exploring the class system and military incompetence of Victorian England.'
  },
  {
    id: '5',
    title: 'Florence Nightingale: The Crimean War – Lynn McDonald',
    url: 'https://www.uoguelph.ca/~cwfn/collected-works',
    snippet: 'A comprehensive collection of Nightingale\'s writings about her experiences as a nurse during the Crimean War, with historical context and commentary.'
  },
  {
    id: '6',
    title: 'The Light Brigade – Mark Adkin',
    url: 'https://www.pen-and-sword.co.uk/The-Light-Brigade-Hardback',
    snippet: 'A military history account examining the famous charge at Balaclava, offering tactical analysis and personal testimonies from participants in the battle.'
  }
]

const movieResults: SearchResult[] = [
  {
    id: '1',
    title: 'Inception (2010) – Christopher Nolan | IMDb',
    url: 'https://www.imdb.com/title/tt1375666/',
    snippet: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.'
  },
  {
    id: '2',
    title: 'The Dark Knight (2008) | Rotten Tomatoes',
    url: 'https://www.rottentomatoes.com/m/the_dark_knight',
    snippet: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.'
  },
  {
    id: '3',
    title: 'Interstellar (2014) – Matthew McConaughey | Metacritic',
    url: 'https://www.metacritic.com/movie/interstellar/',
    snippet: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival. A visually stunning journey through time and space.'
  },
  {
    id: '4',
    title: 'Parasite (2019) | Bong Joon-ho – Official Site',
    url: 'https://www.parasitemovie.com/',
    snippet: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.'
  },
  {
    id: '5',
    title: 'The Grand Budapest Hotel (2014) | Letterboxd',
    url: 'https://letterboxd.com/film/the-grand-budapest-hotel/',
    snippet: 'A writer encounters the owner of an aging European hotel between the wars and learns of his friendship with a young employee who becomes his trusted protégé.'
  },
  {
    id: '6',
    title: 'Everything Everywhere All at Once (2022) | A24',
    url: 'https://a24films.com/films/everything-everywhere-all-at-once',
    snippet: 'An aging Chinese immigrant is swept up in an insane adventure in which she alone can save existence by exploring other universes and connecting with the lives she could have led.'
  }
]

const defaultResults: SearchResult[] = [
  {
    id: '1',
    title: 'Yuppee.AI – AI-Powered Search Results',
    url: 'https://yuppee.ai/results',
    snippet: 'Discover the most relevant results powered by advanced AI. Our intelligent search engine understands context, intent, and nuance to deliver precise answers.'
  },
  {
    id: '2',
    title: 'Understanding Modern AI Search Technology',
    url: 'https://en.wikipedia.org/wiki/Semantic_search',
    snippet: 'Semantic search seeks to improve search accuracy by understanding the searcher\'s intent and the contextual meaning of terms as they appear in the searchable dataspace.'
  },
  {
    id: '3',
    title: 'The Future of Information Retrieval',
    url: 'https://arxiv.org/abs/2301.00234',
    snippet: 'This paper surveys recent advances in neural information retrieval, including dense retrieval, cross-encoder reranking, and generative question answering systems.'
  },
  {
    id: '4',
    title: 'How AI Is Transforming Web Search',
    url: 'https://www.wired.com/story/ai-search-transformation',
    snippet: 'From Google\'s Search Generative Experience to Perplexity AI, a new generation of AI-powered search tools is changing how we find and interact with information online.'
  },
  {
    id: '5',
    title: 'Natural Language Processing in Search Engines',
    url: 'https://towardsdatascience.com/nlp-in-search',
    snippet: 'Modern search engines use transformer-based models to understand queries in natural language, enabling more accurate and contextually aware search results.'
  },
  {
    id: '6',
    title: 'Knowledge Graphs and Semantic Search',
    url: 'https://developers.google.com/knowledge-graph',
    snippet: 'Knowledge graphs allow search engines to understand entities, relationships, and concepts, enabling richer and more structured search results.'
  }
]

export async function search(
  query: string,
  _filters?: Record<string, any>
): Promise<SearchResult[]> {
  await new Promise(resolve => setTimeout(resolve, 600))
  const q = query.toLowerCase()
  if (q.includes('book') || q.includes('novel') || q.includes('fiction') || q.includes('crimean') || q.includes('literature')) {
    return bookResults.map(r => ({ ...r }))
  }
  if (q.includes('movie') || q.includes('film') || q.includes('cinema') || q.includes('watch')) {
    return movieResults.map(r => ({ ...r }))
  }
  return defaultResults.map(r => ({ ...r }))
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
