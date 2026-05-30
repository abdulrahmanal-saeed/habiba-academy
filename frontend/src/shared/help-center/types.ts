export interface HelpCategory {
  slug: string
  name: string
  icon: string
  articleCount: number
}

export interface HelpArticle {
  id: number
  slug: string
  title: string
  category: string
  excerpt: string
  body: string
  role: string
  updatedAt: string
}

export interface HelpSearchResult {
  articles: HelpArticle[]
  total: number
}
