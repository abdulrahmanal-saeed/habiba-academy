import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Plus } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { useHelpCms } from './hooks/useHelpCms'
import { ArticleList } from './components/ArticleList'
import { ArticleEditorDrawer } from './components/ArticleEditorDrawer'
import { CategoryList } from './components/CategoryList'
import { CategoryEditorDrawer } from './components/CategoryEditorDrawer'
import type { HelpArticle, HelpArticleSavePayload, HelpCategory, HelpCategorySavePayload } from './types'

export const HelpCenterCmsPage: FC = () => {
  const {
    articles, categories,
    isLoadingArticles, isLoadingCategories,
    saveArticle, deleteArticle, saveCategory,
    isSavingArticle, isSavingCategory,
  } = useHelpCms()

  const [editArticle, setEditArticle]   = useState<HelpArticle | null>(null)
  const [articleDrawer, setArticleDrawer] = useState(false)
  const [editCategory, setEditCategory] = useState<HelpCategory | null>(null)
  const [categoryDrawer, setCategoryDrawer] = useState(false)

  function openNewArticle(): void { setEditArticle(null); setArticleDrawer(true) }
  function openEditArticle(a: HelpArticle): void { setEditArticle(a); setArticleDrawer(true) }
  function openNewCategory(): void { setEditCategory(null); setCategoryDrawer(true) }
  function openEditCategory(c: HelpCategory): void { setEditCategory(c); setCategoryDrawer(true) }

  async function handleSaveArticle(payload: HelpArticleSavePayload): Promise<void> {
    await saveArticle(payload)
  }

  async function handleSaveCategory(payload: HelpCategorySavePayload): Promise<void> {
    await saveCategory(payload)
  }

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-col gap-5 p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Help Center CMS</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Manage help articles and categories</p>
        </div>
        <button
          type="button"
          onClick={openNewArticle}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          <Plus size={13} /> New Article
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5" style={{ gridTemplateColumns: '1fr 260px' }}>
        {/* Articles */}
        <div>
          <p className="text-xs font-bold mb-3" style={{ color: 'var(--muted)' }}>
            ARTICLES ({articles.length})
          </p>
          {isLoadingArticles ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <ArticleList articles={articles} onEdit={openEditArticle} onDelete={deleteArticle} />
          )}
        </div>

        {/* Categories sidebar */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', height: 'fit-content' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>CATEGORIES</p>
            <button
              type="button"
              onClick={openNewCategory}
              className="flex items-center justify-center w-6 h-6 rounded-lg"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}
              aria-label="New category"
            >
              <Plus size={12} />
            </button>
          </div>
          {isLoadingCategories ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <CategoryList categories={categories} onEdit={openEditCategory} />
          )}
        </div>
      </div>

      <ArticleEditorDrawer
        article={editArticle}
        categories={categories}
        open={articleDrawer}
        onClose={() => setArticleDrawer(false)}
        onSave={handleSaveArticle}
        isSaving={isSavingArticle}
      />

      <CategoryEditorDrawer
        category={editCategory}
        open={categoryDrawer}
        onClose={() => setCategoryDrawer(false)}
        onSave={handleSaveCategory}
        isSaving={isSavingCategory}
      />
    </motion.div>
  )
}
