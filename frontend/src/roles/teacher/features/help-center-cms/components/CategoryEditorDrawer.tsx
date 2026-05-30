import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { X, Save } from 'lucide-react'
import { drawerVariant, modalBackdrop } from '@/design-system/animations'
import type { HelpCategory, HelpCategorySavePayload } from '../types'
import { ROLE_OPTIONS } from '../types'

interface CategoryEditorDrawerProps {
  category: HelpCategory | null
  open: boolean
  onClose: () => void
  onSave: (payload: HelpCategorySavePayload) => Promise<void>
  isSaving: boolean
}

const EMPTY: HelpCategorySavePayload = {
  title: '', icon: 'HelpCircle', sort_order: 0,
  roles: 'student,teacher,parent', active: true,
}

const Inner: FC<CategoryEditorDrawerProps> = ({ category, onClose, onSave, isSaving }) => {
  const [form, setForm] = useState<HelpCategorySavePayload>(
    category ? { id: category.id, title: category.title, icon: category.icon, sort_order: category.sort_order, roles: category.roles, active: category.active } : EMPTY
  )

  const selectedRoles = form.roles.split(',').filter(Boolean)

  function toggleRole(role: string): void {
    const next = selectedRoles.includes(role) ? selectedRoles.filter((r) => r !== role) : [...selectedRoles, role]
    setForm((f) => ({ ...f, roles: next.join(',') }))
  }

  async function handleSave(): Promise<void> {
    if (!form.title.trim()) return
    await onSave(form)
    onClose()
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-sm font-bold" style={{ color: 'var(--fg)' }}>
          {category ? 'Edit Category' : 'New Category'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button" onClick={() => void handleSave()} disabled={isSaving || !form.title.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1 }}
          >
            <Save size={12} /> {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Title *</label>
          <input className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', outline: 'none' }}
            value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Category title" />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Icon (Lucide name)</label>
          <input className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', outline: 'none' }}
            value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} placeholder="BookOpen" />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>Visible to</label>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((role) => (
              <button key={role} type="button" onClick={() => toggleRole(role)}
                className="px-3 py-1 rounded-xl text-xs font-semibold capitalize"
                style={{
                  background: selectedRoles.includes(role) ? 'var(--accent)' : 'var(--surface)',
                  color: selectedRoles.includes(role) ? '#fff' : 'var(--muted)',
                  border: `1px solid ${selectedRoles.includes(role) ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: 'pointer',
                }}
              >{role}</button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="w-4 h-4 rounded" style={{ accentColor: 'var(--accent)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Active</span>
        </label>
      </div>
    </>
  )
}

export const CategoryEditorDrawer: FC<CategoryEditorDrawerProps> = (props) => (
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
            width: 380, height: '100dvh',
            background: 'var(--bg)', borderInlineStart: '1px solid var(--border)',
            zIndex: 301, display: 'flex', flexDirection: 'column',
          }}
        >
          <Inner key={props.category?.id ?? 'new'} {...props} />
        </motion.aside>
      </>
    )}
  </AnimatePresence>
)
