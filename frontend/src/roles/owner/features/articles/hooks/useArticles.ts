import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getArticles, saveArticle, deleteArticle, toggleArticle } from '../api'
import type { Article, ArticleStatus } from '../types'

const QK = ['owner-articles'] as const

export function useArticles() {
  return useQuery({ queryKey: QK, queryFn: getArticles, staleTime: 30_000 })
}

export function useSaveArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: FormData) => saveArticle(form),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useDeleteArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteArticle(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useToggleArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => toggleArticle(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK })
      const prev = qc.getQueryData<Article[]>(QK)
      qc.setQueryData<Article[]>(QK, (old) =>
        old?.map((a) =>
          a.id === id
            ? { ...a, status: (a.status === 'published' ? 'draft' : 'published') as ArticleStatus }
            : a
        )
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData<Article[]>(QK, ctx.prev)
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}
