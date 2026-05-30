import { get } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { HelpArticle } from './types'

export async function getHelpArticles(search?: string): Promise<HelpArticle[]> {
  const params = new URLSearchParams({ role: 'all' })
  if (search) params.set('search', search)
  const data = await get<ApiOk<{ items: HelpArticle[] }>>(`/api/help/articles?${params}`)
  return data.items
}

export async function getHelpArticle(slug: string): Promise<HelpArticle> {
  const data = await get<ApiOk<{ item: HelpArticle }>>(`/api/help/articles/${slug}`)
  return data.item
}
