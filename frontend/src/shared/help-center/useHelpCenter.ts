import { useQuery } from '@tanstack/react-query'
import { STALE } from '@/core/lib/queryClient'
import { getArticle, getCategories, searchHelp } from './api'
import type { HelpCategory, HelpArticle, HelpSearchResult } from './types'

export function useHelpCategories(role: string) {
  return useQuery<HelpCategory[]>({
    queryKey: ['help', 'categories', role],
    queryFn: () => getCategories(role),
    staleTime: STALE.help,
  })
}

export function useHelpArticles(
  role: string,
  params: { query?: string; category?: string },
) {
  return useQuery<HelpSearchResult>({
    queryKey: ['help', 'articles', role, params.query ?? '', params.category ?? ''],
    queryFn: () => searchHelp(params.query ?? '', role, params.category),
    staleTime: STALE.help,
  })
}

export function useHelpArticle(slug: string) {
  return useQuery<HelpArticle>({
    queryKey: ['help', 'article', slug],
    queryFn: () => getArticle(slug),
    staleTime: STALE.help,
    enabled: Boolean(slug),
  })
}
