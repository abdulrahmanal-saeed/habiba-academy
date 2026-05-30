import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { drawerVariant, modalBackdrop } from '@/design-system/animations'
import { reviewsApi } from '../api'
import { SchemaBuilder } from './SchemaBuilder'
import type { ReviewListItem, ReviewSchema, ReviewStatus, ReviewType } from '../types'

interface ReviewCreateDrawerProps {
  studentId: number
  editing: ReviewListItem | null
  onClose: () => void
}

const EMPTY_SCHEMA: ReviewSchema = { meta: { title_en: '', title: '' }, sections: [] }

export const ReviewCreateDrawer: FC<ReviewCreateDrawerProps> = ({ studentId, editing, onClose }) => {
  const qc = useQueryClient()

  const [reviewType, setReviewType] = useState<ReviewType>(() => editing?.review_type ?? 'weekly_review')
  const [title, setTitle] = useState(() => editing?.title ?? '')
  const [reviewDate, setReviewDate] = useState(() => editing?.review_date ?? new Date().toISOString().slice(0, 10))
  const [publishTime, setPublishTime] = useState('')
  const [status, setStatus] = useState<ReviewStatus>(() => editing?.status ?? 'draft')
  const [schema, setSchema] = useState<ReviewSchema>(EMPTY_SCHEMA)
  const [jsonMode, setJsonMode] = useState(false)
  const [rawJson, setRawJson] = useState(() => JSON.stringify(EMPTY_SCHEMA, null, 2))
  const [jsonError, setJsonError] = useState('')

  const isEditing = editing !== null

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => {
      let finalSchema = schema
      if (jsonMode) {
        try {
          finalSchema = JSON.parse(rawJson) as ReviewSchema
        } catch {
          throw new Error('Invalid JSON')
        }
      }
      const schemaJson = JSON.stringify(finalSchema)
      if (isEditing) {
        return reviewsApi.updateReview({
          review_id: editing.id,
          student_id: studentId,
          review_type: reviewType,
          title,
          review_date: reviewDate,
          publish_time: publishTime || undefined,
          status,
          schema_json: schemaJson,
        })
      }
      return reviewsApi.createReview({
        student_id: studentId,
        review_type: reviewType,
        title,
        review_date: reviewDate,
        publish_time: publishTime || undefined,
        status,
        schema_json: schemaJson,
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['student-reviews', studentId] })
      onClose()
    },
  })

  const handleJsonChange = (v: string) => {
    setRawJson(v)
    try {
      setSchema(JSON.parse(v) as ReviewSchema)
      setJsonError('')
    } catch {
      setJsonError('Invalid JSON')
    }
  }

  const switchToJson = () => {
    setRawJson(JSON.stringify(schema, null, 2))
    setJsonMode(true)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-40 bg-black/40"
        variants={modalBackdrop}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
      />
      <motion.aside
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[var(--surface-1)] shadow-2xl flex flex-col"
        variants={drawerVariant}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--text-1)]">
            {isEditing ? 'Edit Review' : 'New Review'}
          </h2>
          <button onClick={onClose} className="text-[var(--text-3)] hover:text-[var(--text-1)] text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-2)]">Type</label>
              <select
                className="w-full mt-1 text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface-1)] focus:outline-none focus:border-[var(--accent)]"
                value={reviewType}
                onChange={e => setReviewType(e.target.value as ReviewType)}
              >
                <option value="weekly_review">Weekly Review</option>
                <option value="monthly_review">Monthly Review</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-2)]">Status</label>
              <select
                className="w-full mt-1 text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface-1)] focus:outline-none focus:border-[var(--accent)]"
                value={status}
                onChange={e => setStatus(e.target.value as ReviewStatus)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-2)]">Title (optional — auto from schema)</label>
            <input
              className="w-full mt-1 text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface-1)] focus:outline-none focus:border-[var(--accent)]"
              placeholder="Leave blank to auto-generate"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-2)]">Review Date</label>
              <input
                type="date"
                className="w-full mt-1 text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface-1)] focus:outline-none focus:border-[var(--accent)]"
                value={reviewDate}
                onChange={e => setReviewDate(e.target.value)}
              />
            </div>
            {status === 'published' && (
              <div>
                <label className="text-xs font-medium text-[var(--text-2)]">Publish Time</label>
                <input
                  type="time"
                  className="w-full mt-1 text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface-1)] focus:outline-none focus:border-[var(--accent)]"
                  value={publishTime}
                  onChange={e => setPublishTime(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[var(--text-1)]">Review Schema</label>
              <button
                onClick={() => jsonMode ? setJsonMode(false) : switchToJson()}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                {jsonMode ? 'Builder view' : 'JSON editor'}
              </button>
            </div>

            {jsonMode ? (
              <div>
                <textarea
                  className="w-full h-64 font-mono text-xs border border-[var(--border)] rounded-lg p-3 bg-[var(--surface-2)] focus:outline-none focus:border-[var(--accent)] resize-none"
                  value={rawJson}
                  onChange={e => handleJsonChange(e.target.value)}
                />
                {jsonError && <p className="text-xs text-red-500 mt-1">{jsonError}</p>}
              </div>
            ) : (
              <SchemaBuilder schema={schema} onChange={setSchema} />
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[var(--border)] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-2)] hover:border-[var(--accent)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => save()}
            disabled={isPending || (status === 'published' && !publishTime)}
            className="flex-1 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Review'}
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
