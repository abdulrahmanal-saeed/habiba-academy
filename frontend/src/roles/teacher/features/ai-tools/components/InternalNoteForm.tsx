import { useState, type FC } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { aiToolsApi } from '../api'
import type { InternalNotePayload } from '../types'

interface Props {
  studentId: number
  onSaved?: () => void
}

const NOTE_TYPES: Array<{ value: InternalNotePayload['note_type']; label: string }> = [
  { value: 'general',    label: 'General' },
  { value: 'lesson',     label: 'Lesson' },
  { value: 'review',     label: 'Review' },
  { value: 'risk',       label: 'Risk' },
  { value: 'follow_up',  label: 'Follow-up' },
]

const fieldCls = 'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none'
const labelCls = 'mb-1 block text-xs font-medium text-[var(--text-2)]'

export const InternalNoteForm: FC<Props> = ({ studentId, onSaved }) => {
  const [noteType, setNoteType] = useState<InternalNotePayload['note_type']>('general')
  const [note, setNote]         = useState('')

  const mutation = useMutation({
    mutationFn: () => aiToolsApi.saveInternalNote({ student_id: studentId, note_type: noteType, note }),
    onSuccess: () => {
      setNote('')
      onSaved?.()
    },
  })

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className={labelCls}>Note Type</label>
        <div className="flex gap-1 flex-wrap">
          {NOTE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setNoteType(t.value)}
              className="rounded-lg px-3 py-1 text-xs font-medium"
              style={{
                background: noteType === t.value ? 'var(--accent)' : 'var(--surface)',
                color: noteType === t.value ? '#fff' : 'var(--muted)',
                border: `1px solid ${noteType === t.value ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Note</label>
        <textarea
          className={fieldCls}
          rows={3}
          placeholder="Write a private note about this student…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {mutation.isError && (
        <p className="text-xs" style={{ color: 'var(--error)' }}>Failed to save note. Please try again.</p>
      )}

      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        disabled={mutation.isPending || !note.trim()}
        onClick={() => mutation.mutate()}
        className="rounded-xl py-2 text-sm font-semibold"
        style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', opacity: (!note.trim() || mutation.isPending) ? 0.5 : 1 }}
      >
        {mutation.isPending ? 'Saving…' : 'Save Note'}
      </motion.button>
    </div>
  )
}
