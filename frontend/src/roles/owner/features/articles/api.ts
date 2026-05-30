import { apiClient } from '@/core/lib/apiClient'
import type { Article, ArticleListResponse, ArticleActionResponse } from './types'

const URL = '/api/owner/articles'

export function getArticles(): Promise<Article[]> {
  return apiClient.get<ArticleListResponse>(URL).then((r) => r.data.articles)
}

export function saveArticle(form: FormData): Promise<ArticleActionResponse['data']> {
  return apiClient.postForm<ArticleActionResponse>(URL, form).then((r) => r.data)
}

export function deleteArticle(id: number): Promise<ArticleActionResponse['data']> {
  const fd = new FormData()
  fd.append('action', 'delete')
  fd.append('id', String(id))
  return apiClient.postForm<ArticleActionResponse>(URL, fd).then((r) => r.data)
}

export function toggleArticle(id: number): Promise<ArticleActionResponse['data']> {
  const fd = new FormData()
  fd.append('action', 'toggle')
  fd.append('id', String(id))
  return apiClient.postForm<ArticleActionResponse>(URL, fd).then((r) => r.data)
}
