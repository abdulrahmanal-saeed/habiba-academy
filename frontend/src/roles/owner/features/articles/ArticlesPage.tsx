import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Plus } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { useArticles, useSaveArticle, useDeleteArticle, useToggleArticle } from './hooks/useArticles'
import { ArticlesTable } from './components/ArticlesTable'
import { ArticleEditorDrawer } from './components/ArticleEditorDrawer'
import type { Article } from './types'

export const ArticlesPage: FC = () => {
  const [selected, setSelected] = useState<Article | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data, isLoading, isError } = useArticles()
  const save   = useSaveArticle()
  const del    = useDeleteArticle()
  const toggle = useToggleArticle()

  function openNew(): void {
    setSelected(null)
    setDrawerOpen(true)
  }

  function openEdit(article: Article): void {
    setSelected(article)
    setDrawerOpen(true)
  }

  function handleDelete(id: number): void {
    if (!window.confirm('Delete this article? This cannot be undone.')) return
    del.mutate(id)
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="p-4 lg:p-6 flex flex-col gap-5 max-w-[960px] mx-auto"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black" style={{ color: 'var(--fg)' }}>Articles</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Manage published and draft articles.</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          <Plus size={14} /> New Article
        </button>
      </div>

      {isLoading && <div className="flex justify-center py-10"><Spinner /></div>}
      {isError && <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>Failed to load articles.</p>}
      {data && (
        <ArticlesTable
          articles={data}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggle={(id) => toggle.mutate(id)}
          isToggling={toggle.isPending}
          isDeleting={del.isPending}
        />
      )}

      <ArticleEditorDrawer
        article={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={async (fd) => { await save.mutateAsync(fd) }}
        isSaving={save.isPending}
      />
    </motion.div>
  )
}
