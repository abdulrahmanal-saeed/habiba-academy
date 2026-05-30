export interface Article {
  id: number
  slug: string
  title: string
  excerpt: string
  body: string
  coverUrl?: string
  category: string
  authorName: string
  publishedAt: string
  readingTimeMinutes: number
}

export interface ArticlesListResponse {
  items: Article[]
  total: number
  page: number
  totalPages: number
}
