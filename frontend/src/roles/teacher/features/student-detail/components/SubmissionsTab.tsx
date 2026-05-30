import { useState } from 'react'
import type { FC } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Edit2, CheckCircle, Clock, FileText, Mic } from 'lucide-react'
import { fadeInUp, stagger, listItem } from '@/design-system/animations'
import { getSubmissions, deleteHomework } from '../api'
import type { SubmissionItem } from '../types'

interface SubmissionsTabProps {
  studentId: number
  onEditHomework: (homeworkId: number) => void
}

const STATUS_COLORS: Record<string, string> = {
  published: 'var(--success)',
  scheduled: 'var(--accent)',
  draft: 'var(--muted)',
  closed: 'var(--error)',
}

function ItemIcon({ type }: { type: SubmissionItem['item_type'] }) {
  if (type === 'homework') return <FileText size={13} />
  if (type === 'scenario') return <Mic size={13} />
  return <CheckCircle size={13} />
}

export const SubmissionsTab: FC<SubmissionsTabProps> = ({ studentId, onEditHomework }) => {
  const qc = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['student-submissions', studentId],
    queryFn: () => getSubmissions(studentId),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteHomework(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['student-submissions', studentId] })
      setConfirmDelete(null)
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      {submissions.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: 'var(--muted)' }}>
          No submissions yet
        </p>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-2">
          {submissions.map((item) => (
            <motion.div
              key={`${item.item_type}-${item.id}`}
              variants={listItem}
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <span style={{ color: 'var(--muted)' }}>
                <ItemIcon type={item.item_type} />
              </span>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>
                  {item.title}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{item.hw_date}</span>
                  <span
                    className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      background: 'var(--accent-soft)',
                      color: STATUS_COLORS[item.effective_status] ?? 'var(--muted)',
                    }}
                  >
                    {item.effective_status}
                  </span>
                  {item.is_submitted && (
                    <span className="text-xs" style={{ color: 'var(--success)' }}>
                      {item.mcq_total > 0 ? `${item.mcq_score}/${item.mcq_total}` : 'submitted'}
                    </span>
                  )}
                  {item.item_type === 'scenario' && item.recordings_count !== undefined && (
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {item.recordings_count} recording{item.recordings_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {item.item_type === 'homework' && !item.is_submitted && (
                  <button
                    type="button"
                    onClick={() => onEditHomework(item.id)}
                    className="flex items-center justify-center w-7 h-7 rounded-lg"
                    style={{ color: 'var(--accent)', background: 'var(--accent-soft)', border: 'none', cursor: 'pointer' }}
                    aria-label="Edit homework"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
                {item.item_type === 'homework' && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(item.id)}
                    className="flex items-center justify-center w-7 h-7 rounded-lg"
                    style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
                    aria-label="Delete homework"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl p-6 w-full max-w-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock size={18} style={{ color: 'var(--error)' }} />
                <h3 className="text-base font-bold" style={{ color: 'var(--fg)' }}>Delete Homework?</h3>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                This permanently deletes the homework and all related recordings. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 rounded-xl py-2 text-sm font-semibold"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(confirmDelete)}
                  className="flex-1 rounded-xl py-2 text-sm font-semibold"
                  style={{ background: 'var(--error)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
