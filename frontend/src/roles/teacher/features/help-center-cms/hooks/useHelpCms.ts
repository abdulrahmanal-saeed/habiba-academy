import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { helpCmsApi } from '../api'
import type { HelpArticleSavePayload, HelpCategorySavePayload } from '../types'

const QK_ARTICLES   = ['help-articles']
const QK_CATEGORIES = ['help-categories']

export function useHelpCms() {
  const qc = useQueryClient()

  const articlesQuery = useQuery({
    queryKey: QK_ARTICLES,
    queryFn: () => helpCmsApi.getArticles(),
  })

  const categoriesQuery = useQuery({
    queryKey: QK_CATEGORIES,
    queryFn: () => helpCmsApi.getCategories(),
  })

  const saveArticle = useMutation({
    mutationFn: (payload: HelpArticleSavePayload) => helpCmsApi.saveArticle(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK_ARTICLES }),
  })

  const deleteArticle = useMutation({
    mutationFn: (id: number) => helpCmsApi.deleteArticle(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK_ARTICLES }),
  })

  const saveCategory = useMutation({
    mutationFn: (payload: HelpCategorySavePayload) => helpCmsApi.saveCategory(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK_CATEGORIES })
      void qc.invalidateQueries({ queryKey: QK_ARTICLES })
    },
  })

  return {
    articles: articlesQuery.data?.articles ?? [],
    categories: categoriesQuery.data?.categories ?? [],
    isLoadingArticles: articlesQuery.isLoading,
    isLoadingCategories: categoriesQuery.isLoading,
    saveArticle: (p: HelpArticleSavePayload) => saveArticle.mutateAsync(p),
    deleteArticle: (id: number) => deleteArticle.mutate(id),
    saveCategory: (p: HelpCategorySavePayload) => saveCategory.mutateAsync(p),
    isSavingArticle: saveArticle.isPending,
    isDeletingArticle: deleteArticle.isPending,
    isSavingCategory: saveCategory.isPending,
  }
}
