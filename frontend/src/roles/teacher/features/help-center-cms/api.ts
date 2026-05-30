import { get, post, postForm } from '@/core/lib/apiClient'
import type { HelpArticle, HelpCategory, HelpArticleSavePayload, HelpCategorySavePayload } from './types'

const ARTICLES_URL   = '/api/teacher/help-articles.php'
const CATEGORIES_URL = '/api/teacher/help-categories.php'

export const helpCmsApi = {
  async getArticles(filters?: {
    status?: string
    category_id?: number
    q?: string
    featured?: boolean
  }): Promise<{ articles: HelpArticle[]; total: number }> {
    const search = new URLSearchParams()
    if (filters?.status)                   search.set('status', filters.status)
    if (filters?.category_id !== undefined) search.set('category_id', String(filters.category_id))
    if (filters?.q)                        search.set('q', filters.q)
    if (filters?.featured)                 search.set('featured', '1')
    const qs = search.toString()
    return get(`${ARTICLES_URL}${qs ? '?' + qs : ''}`)
  },

  async saveArticle(payload: HelpArticleSavePayload): Promise<{ id: number; slug: string }> {
    return post(ARTICLES_URL, payload as unknown as Record<string, unknown>)
  },

  async deleteArticle(id: number): Promise<{ deleted: number }> {
    return postForm(ARTICLES_URL, { action: 'delete', id })
  },

  async getCategories(): Promise<{ categories: HelpCategory[] }> {
    return get(CATEGORIES_URL)
  },

  async saveCategory(payload: HelpCategorySavePayload): Promise<{ id: number }> {
    return post(CATEGORIES_URL, payload as unknown as Record<string, unknown>)
  },
}
