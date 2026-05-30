import { get } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { HelpArticle, HelpCategory, HelpSearchResult } from './types'

export async function getCategories(role: string): Promise<HelpCategory[]> {
  const params = new URLSearchParams({ role })
  const data = await get<ApiOk<{ items: HelpCategory[] }>>(`/api/help/categories?${params}`)
  return data.items
}

export async function searchHelp(
  query: string,
  role: string,
  category?: string,
): Promise<HelpSearchResult> {
  const params = new URLSearchParams({ role })
  if (query) params.set('search', query)
  if (category) params.set('category', category)
  const data = await get<ApiOk<HelpSearchResult>>(`/api/help/articles?${params}`)
  return data
}

export async function getArticle(slug: string): Promise<HelpArticle> {
  const data = await get<ApiOk<{ item: HelpArticle }>>(`/api/help/articles/${slug}`)
  return data.item
}
