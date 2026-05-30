export interface HelpCategory {
  id: number
  slug: string
  title: string
  icon: string
  sort_order: number
  roles: string
  active: boolean
  article_count?: number
}

export interface HelpArticle {
  id: number
  category_id: number
  category_title?: string
  slug: string
  title: string
  content: string
  visible_roles: string
  featured: boolean
  status: 'published' | 'draft'
  sort_order: number
  created_at: string
  updated_at: string
}

export interface HelpArticleSavePayload {
  id?: number
  category_id: number
  title: string
  content: string
  visible_roles: string
  featured: boolean
  status: 'published' | 'draft'
  sort_order: number
}

export interface HelpCategorySavePayload {
  id?: number | null
  title: string
  icon: string
  sort_order: number
  roles: string
  active: boolean
}

export const ROLE_OPTIONS = ['student', 'teacher', 'parent', 'owner'] as const
export type HelpRole = typeof ROLE_OPTIONS[number]
