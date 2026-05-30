import { AnimatePresence, motion } from 'framer-motion'
import { useState, type ChangeEvent, type FC } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CourseMaterial, MaterialLanguage, MaterialSavePayload, MaterialStatus, MaterialType } from '../types'
import { materialsApi } from '../api'

const TYPES: MaterialType[] = [
  'link', 'video', 'video_link', 'audio', 'pdf', 'pptx', 'document', 'image', 'article', 'html', 'mixed',
]
const CATEGORIES = [
  '', 'lesson_slides', 'reading_practice', 'listening_practice', 'speaking_support',
  'writing_practice', 'vocabulary', 'grammar_support', 'child_literacy',
  'work_arabic', 'emirati_dialect', 'egyptian_dialect', 'homework_support', 'review_material',
]
const STATUSES: MaterialStatus[] = ['published', 'draft', 'hidden', 'archived']
const LANGS: MaterialLanguage[] = ['both', 'arabic', 'english']

const buildInit = (m: CourseMaterial | null, sid: number): MaterialSavePayload => ({
  id: m?.id ?? 0,
  student_id: m?.student_id ?? sid,
  title: m?.title ?? '',
  type: m?.type ?? 'link',
  category: m?.category ?? '',
  level: m?.level ?? '',
  tags: m?.tags ?? '',
  language: m?.language ?? 'both',
  estimated_study_minutes: m?.estimated_study_minutes ?? 0,
  description: m?.description ?? '',
  sort_order: m?.sort_order ?? 0,
  status: m?.status ?? 'published',
  show_on_homepage: m?.show_on_homepage ? 1 : 0,
  allow_download: m?.allow_download !== false ? 1 : 0,
  source_type: m?.source_type ?? 'url',
  url: m?.source_type === 'url' ? (m?.href ?? '') : '',
})

interface Props {
  isOpen: boolean
  material: CourseMaterial | null
  studentId: number
  onClose: () => void
  onSaved: () => void
}

export const MaterialFormDrawer: FC<Props> = ({ isOpen, material, studentId, onClose, onSaved }) => {
  const qc = useQueryClient()
  const [form, setForm] = useState<MaterialSavePayload>(() => buildInit(material, studentId))
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  const set = (field: keyof MaterialSavePayload, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }))

  const mutation = useMutation({
    mutationFn: () => materialsApi.saveMaterial(form, file ?? undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-materials', studentId] })
      onSaved()
    },
    onError: (e: Error) => setError(e.message),
  })

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null)
  }

  const inputCls = 'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none'
  const labelCls = 'mb-1 block text-xs font-medium text-[var(--text-2)]'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40" onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col bg-[var(--bg)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
              <h2 className="text-lg font-bold text-[var(--text-1)]">
                {material ? 'Edit Material' : 'Add Material'}
              </h2>
              <button onClick={onClose} className="rounded-lg p-2 text-[var(--text-2)] hover:bg-[var(--surface-2)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div>
                <label className={labelCls}>Source Type</label>
                <div className="flex gap-2">
                  {(['url', 'file'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => set('source_type', st)}
                      className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
                        form.source_type === st
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)]'
                      }`}
                    >
                      {st === 'url' ? 'URL / Link' : 'File Upload'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Title *</label>
                <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Material title" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value as MaterialType)}>
                    {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value as MaterialStatus)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {form.source_type === 'url' ? (
                <div>
                  <label className={labelCls}>URL</label>
                  <input className={inputCls} type="url" value={form.url ?? ''} onChange={(e) => set('url', e.target.value)} placeholder="https://…" />
                </div>
              ) : (
                <div>
                  <label className={labelCls}>File {material?.original_filename && `(current: ${material.original_filename})`}</label>
                  <input className={inputCls} type="file" onChange={handleFile} accept="application/pdf,audio/*,video/*,image/*,.doc,.docx,.ppt,.pptx,.html,.htm" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Category</label>
                  <select className={inputCls} value={form.category ?? ''} onChange={(e) => set('category', e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c ? c.replace(/_/g, ' ') : '— none —'}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Language</label>
                  <select className={inputCls} value={form.language} onChange={(e) => set('language', e.target.value as MaterialLanguage)}>
                    {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Est. Minutes</label>
                  <input className={inputCls} type="number" min="0" max="999" value={form.estimated_study_minutes ?? 0} onChange={(e) => set('estimated_study_minutes', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelCls}>Sort Order</label>
                  <input className={inputCls} type="number" min="0" value={form.sort_order ?? 0} onChange={(e) => set('sort_order', Number(e.target.value))} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea className={inputCls} rows={3} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="Optional description…" />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-[var(--text-2)]">
                  <input type="checkbox" checked={form.allow_download === 1} onChange={(e) => set('allow_download', e.target.checked ? 1 : 0)} className="accent-[var(--accent)]" />
                  Allow download
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--text-2)]">
                  <input type="checkbox" checked={form.show_on_homepage === 1} onChange={(e) => set('show_on_homepage', e.target.checked ? 1 : 0)} className="accent-[var(--accent)]" />
                  Show on homepage
                </label>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="border-t border-[var(--border)] p-5">
              <motion.button
                whileHover={{ y: -1 }}
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
                className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-50"
              >
                {mutation.isPending ? 'Saving…' : material ? 'Update Material' : 'Add Material'}
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
