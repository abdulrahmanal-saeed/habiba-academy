import { get } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { Article, ArticlesListResponse } from './types'

export async function getArticles(page = 1, category?: string): Promise<ArticlesListResponse> {
  const params = new URLSearchParams({ page: String(page) })
  if (category) params.set('category', category)
  const data = await get<ApiOk<ArticlesListResponse>>(`/api/public/articles?${params}`)
  return { items: data.items, total: data.total, page: data.page, totalPages: data.totalPages }
}

export async function getArticle(slug: string): Promise<Article> {
  const data = await get<ApiOk<{ item: Article }>>(`/api/public/articles/${slug}`)
  return data.item
}
