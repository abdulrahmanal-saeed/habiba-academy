export type ArticleStatus = 'published' | 'draft'

export interface Article {
  id: number
  title: string
  slug: string
  excerpt: string
  body: string
  cover_image: string | null
  status: ArticleStatus
  show_on_homepage: boolean
  sort_order: number
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
}

export interface ArticleSavePayload {
  id?: number
  title: string
  slug: string
  excerpt: string
  body: string
  status: ArticleStatus
  show_on_homepage: boolean
  sort_order: number
  meta_title: string
  meta_description: string
  existing_cover_image: string
}

export interface ArticleListResponse {
  ok: boolean
  data: { articles: Article[] }
}

export interface ArticleActionResponse {
  ok: boolean
  data: {
    id?: number
    slug?: string
    status?: ArticleStatus
    status_label?: string
    message?: string
  }
}
