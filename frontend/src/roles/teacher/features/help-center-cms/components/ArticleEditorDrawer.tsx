import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { X, Save } from 'lucide-react'
import { drawerVariant, modalBackdrop } from '@/design-system/animations'
import type { HelpArticle, HelpArticleSavePayload, HelpCategory } from '../types'
import { ArticleForm } from './ArticleForm'

interface ArticleEditorDrawerProps {
  article: HelpArticle | null
  categories: HelpCategory[]
  open: boolean
  onClose: () => void
  onSave: (payload: HelpArticleSavePayload) => Promise<void>
  isSaving: boolean
}

const EMPTY: HelpArticleSavePayload = {
  category_id: 0,
  title: '',
  content: '',
  visible_roles: 'student',
  featured: false,
  status: 'draft',
  sort_order: 0,
}

function articleToPayload(a: HelpArticle): HelpArticleSavePayload {
  return {
    id: a.id,
    category_id: a.category_id,
    title: a.title,
    content: a.content,
    visible_roles: a.visible_roles,
    featured: a.featured,
    status: a.status,
    sort_order: a.sort_order,
  }
}

const Inner: FC<ArticleEditorDrawerProps> = ({ article, categories, onClose, onSave, isSaving }) => {
  const [form, setForm] = useState<HelpArticleSavePayload>(
    article ? articleToPayload(article) : EMPTY
  )

  async function handleSave(): Promise<void> {
    if (!form.title.trim()) return
    await onSave(form)
    onClose()
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-sm font-bold" style={{ color: 'var(--fg)' }}>
          {article ? 'Edit Article' : 'New Article'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || !form.title.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1 }}
          >
            <Save size={12} />
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <ArticleForm value={form} categories={categories} onChange={setForm} />
      </div>
    </>
  )
}

export const ArticleEditorDrawer: FC<ArticleEditorDrawerProps> = (props) => (
  <AnimatePresence>
    {props.open && (
      <>
        <motion.div key="bd" variants={modalBackdrop} initial="hidden" animate="visible" exit="hidden"
          onClick={props.onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300 }}
        />
        <motion.aside key="drawer" variants={drawerVariant} initial="hidden" animate="visible" exit="hidden"
          style={{
            position: 'fixed', insetBlockStart: 0, insetInlineEnd: 0,
            width: 480, height: '100dvh',
            background: 'var(--bg)', borderInlineStart: '1px solid var(--border)',
            zIndex: 301, display: 'flex', flexDirection: 'column',
          }}
        >
          <Inner key={props.article?.id ?? 'new'} {...props} />
        </motion.aside>
      </>
    )}
  </AnimatePresence>
)
