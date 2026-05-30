import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { drawerVariant, modalBackdrop } from '@/design-system/animations'
import { reviewsApi } from '../api'
import type { ManualScoreRow, ReviewSection, TeacherVerdict } from '../types'

interface GradeDrawerProps {
  studentId: number
  submissionId: number
  onClose: () => void
}

const MANUAL_SECTION_IDS = new Set(['writing', 'speaking', 'scenario'])

export const GradeDrawer: FC<GradeDrawerProps> = ({ studentId, submissionId, onClose }) => {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['review-submission', submissionId],
    queryFn: () => reviewsApi.getSubmission(submissionId),
  })

  const [teacherNote, setTeacherNote] = useState(() => data?.submission?.teacher_note ?? '')
  const [scores, setScores] = useState<ManualScoreRow[]>(() => data?.manual_scores ?? [])
  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      reviewsApi.gradeReview({
        submission_id: submissionId,
        teacher_note: teacherNote,
        scores_json: JSON.stringify(scores),
        overrides_json: JSON.stringify(data?.section_overrides ?? []),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['student-reviews', studentId] })
      void qc.invalidateQueries({ queryKey: ['review-submission', submissionId] })
      onClose()
    },
  })

  const setVerdict = (sectionId: string, itemId: string, maxPoints: number, verdict: TeacherVerdict | null) => {
    setScores(prev => {
      const next = prev.filter(s => !(s.section_id === sectionId && s.item_id === itemId))
      next.push({
        section_id: sectionId,
        item_id: itemId,
        max_points: maxPoints,
        score: verdict === 'correct' ? maxPoints : verdict === 'wrong' ? 0 : 0,
        teacher_verdict: verdict,
        feedback: prev.find(s => s.section_id === sectionId && s.item_id === itemId)?.feedback ?? '',
      })
      return next
    })
  }

  const setScore = (sectionId: string, itemId: string, maxPoints: number, score: number) => {
    setScores(prev => {
      const existing = prev.find(s => s.section_id === sectionId && s.item_id === itemId)
      const next = prev.filter(s => !(s.section_id === sectionId && s.item_id === itemId))
      next.push({ section_id: sectionId, item_id: itemId, max_points: maxPoints, score, teacher_verdict: null, feedback: existing?.feedback ?? '' })
      return next
    })
  }

  const setFeedback = (sectionId: string, itemId: string, feedback: string) => {
    setScores(prev =>
      prev.map(s => s.section_id === sectionId && s.item_id === itemId ? { ...s, feedback } : s)
    )
  }

  const getRow = (sectionId: string, itemId: string): ManualScoreRow | undefined =>
    scores.find(s => s.section_id === sectionId && s.item_id === itemId)

  if (isLoading || !data) {
    return (
      <AnimatePresence>
        <motion.div className="fixed inset-0 z-40 bg-black/40" variants={modalBackdrop} initial="hidden" animate="visible" exit="hidden" onClick={onClose} />
        <motion.aside
          className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[var(--surface-1)] shadow-2xl flex items-center justify-center"
          variants={drawerVariant}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <p className="text-[var(--text-3)] text-sm">Loading submission…</p>
        </motion.aside>
      </AnimatePresence>
    )
  }

  const { submission, review } = data
  let parsedSchema
  try { parsedSchema = JSON.parse(review.schema_json) as { sections: ReviewSection[] } } catch { parsedSchema = { sections: [] } }
  const manualSections = parsedSchema.sections.filter(s => MANUAL_SECTION_IDS.has(s.section_id))

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-40 bg-black/40" variants={modalBackdrop} initial="hidden" animate="visible" exit="hidden" onClick={onClose} />
      <motion.aside
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[var(--surface-1)] shadow-2xl flex flex-col"
        variants={drawerVariant}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-semibold text-[var(--text-1)]">Grade Submission</h2>
            <p className="text-xs text-[var(--text-3)] mt-0.5">{review.title} · {review.total_points} pts</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-3)] hover:text-[var(--text-1)] text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="p-3 rounded-xl bg-[var(--surface-2)] grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-[var(--text-3)]">Auto</p>
              <p className="font-semibold text-[var(--text-1)]">{submission.auto_score ?? '–'}</p>
            </div>
            <div>
              <p className="text-[var(--text-3)]">Manual</p>
              <p className="font-semibold text-[var(--text-1)]">{submission.manual_score ?? '–'}</p>
            </div>
            <div>
              <p className="text-[var(--text-3)]">Total</p>
              <p className="font-semibold text-[var(--text-1)]">{submission.total_score ?? '–'} / {review.total_points}</p>
            </div>
          </div>

          {manualSections.length === 0 && (
            <p className="text-sm text-[var(--text-3)] text-center py-4">No manual sections to grade.</p>
          )}

          {manualSections.map(section => {
            const items = section.questions ?? section.scenarios ?? []
            return (
              <div key={section.section_id} className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-1)]">{section.title}</h3>
                {items.map(item => {
                  const row = getRow(section.section_id, item.id)
                  const maxPts = item.points
                  return (
                    <div key={item.id} className="p-3 rounded-xl border border-[var(--border)] space-y-2">
                      <p className="text-sm text-[var(--text-1)]">
                        {'prompt' in item ? item.prompt : 'title' in item ? item.title : item.id}
                      </p>
                      <div className="flex items-center gap-2">
                        {(['correct', 'wrong'] as TeacherVerdict[]).map(v => (
                          <button
                            key={v}
                            onClick={() => setVerdict(section.section_id, item.id, maxPts, row?.teacher_verdict === v ? null : v)}
                            className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                              row?.teacher_verdict === v
                                ? v === 'correct' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                : 'border border-[var(--border)] text-[var(--text-2)] hover:border-[var(--accent)]'
                            }`}
                          >
                            {v === 'correct' ? 'Correct' : 'Wrong'}
                          </button>
                        ))}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <input
                            type="number"
                            min={0}
                            max={maxPts}
                            className="w-14 text-sm border border-[var(--border)] rounded-lg px-2 py-1 bg-[var(--surface-1)] focus:outline-none focus:border-[var(--accent)]"
                            value={row?.score ?? 0}
                            onChange={e => setScore(section.section_id, item.id, maxPts, Math.min(maxPts, Math.max(0, parseInt(e.target.value) || 0)))}
                          />
                          <span className="text-xs text-[var(--text-3)]">/ {maxPts}</span>
                        </div>
                      </div>
                      <input
                        className="w-full text-xs border border-[var(--border)] rounded-lg px-3 py-1.5 bg-[var(--surface-1)] focus:outline-none focus:border-[var(--accent)]"
                        placeholder="Feedback (optional)"
                        value={row?.feedback ?? ''}
                        onChange={e => setFeedback(section.section_id, item.id, e.target.value)}
                      />
                    </div>
                  )
                })}
              </div>
            )
          })}

          <div>
            <label className="text-xs font-medium text-[var(--text-2)]">Teacher Note</label>
            <textarea
              className="w-full mt-1 text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--surface-1)] focus:outline-none focus:border-[var(--accent)] resize-none"
              placeholder="Overall feedback for student"
              rows={3}
              value={teacherNote}
              onChange={e => setTeacherNote(e.target.value)}
            />
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
            disabled={isPending}
            className="flex-1 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save Grade'}
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
