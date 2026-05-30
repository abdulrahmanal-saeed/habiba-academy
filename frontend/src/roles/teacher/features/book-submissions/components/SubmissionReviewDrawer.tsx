import { AnimatePresence, motion } from 'framer-motion'
import { useState, type FC } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookSubmissionsApi } from '../api'
import type { BookSubmissionDetail } from '../types'
import { AutoGradedAnswers } from './AutoGradedAnswers'

interface DrawerProps {
  submissionId: number | null
  onClose: () => void
  onSaved: () => void
}

interface FormProps {
  detail: BookSubmissionDetail
  submissionId: number
  onSaved: () => void
}

const fieldCls =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none'
const labelCls = 'mb-1 block text-xs font-medium text-[var(--text-2)]'

const FeedbackForm: FC<FormProps> = ({ detail, submissionId, onSaved }) => {
  const qc = useQueryClient()
  const sub = detail.submission
  const [form, setForm] = useState(() => ({
    writingFeedback:       detail.feedback.writing,
    correctionFeedback:    detail.feedback.correction,
    speakingFeedback:      detail.feedback.speaking,
    pronunciationNote:     detail.speaking?.pronunciation_note ?? '',
    fluencyNote:           detail.speaking?.fluency_note ?? '',
    speakingCorrectionNote: detail.speaking?.correction_note ?? '',
    speakingScore:         detail.speaking?.score?.toString() ?? '',
    finalFeedback:         detail.feedback.general,
    teacherScore:          sub.teacher_score?.toString() ?? '',
  }))

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const sendMutation = useMutation({
    mutationFn: () => bookSubmissionsApi.postFeedback({
      submission_id: submissionId,
      final_feedback: form.finalFeedback,
      teacher_score: form.teacherScore,
      writing_feedback: form.writingFeedback,
      correction_feedback: form.correctionFeedback,
      speaking_feedback: form.speakingFeedback,
      pronunciation_note: form.pronunciationNote,
      fluency_note: form.fluencyNote,
      speaking_correction_note: form.speakingCorrectionNote,
      speaking_score: form.speakingScore,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-submissions'] })
      onSaved()
    },
  })

  const speakingAudios: string[] = []
  if (detail.answers.speaking_task?.audio_url) speakingAudios.push(detail.answers.speaking_task.audio_url)
  if (detail.answers.speaking_tasks) {
    Object.values(detail.answers.speaking_tasks).forEach((t) => { if (t.audio_url) speakingAudios.push(t.audio_url) })
  }

  const writingTexts: Array<{ key: string; answer: string }> = []
  if (detail.answers.writing_task) writingTexts.push({ key: 'writing_task', answer: detail.answers.writing_task.answer })
  if (detail.answers.writing_tasks) {
    Object.entries(detail.answers.writing_tasks).forEach(([k, v]) => writingTexts.push({ key: k, answer: v.answer }))
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div className="flex gap-4 rounded-xl bg-[var(--surface-2)] p-3 text-sm">
          <span><span className="text-[var(--text-3)]">Auto </span><strong>{sub.auto_score.toFixed(0)}%</strong></span>
          {sub.teacher_score !== null && <span><span className="text-[var(--text-3)]">Teacher </span><strong>{sub.teacher_score.toFixed(0)}%</strong></span>}
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{sub.status.replace(/_/g, ' ')}</span>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-[var(--text-1)]">Auto-Graded Exercises</h3>
          <AutoGradedAnswers answers={detail.answers} />
        </div>

        {writingTexts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-1)]">Writing Task</h3>
            {writingTexts.map((wt) => (
              <div key={wt.key} className="rounded-xl bg-[var(--surface-2)] p-3 text-sm" dir="rtl">{wt.answer || '—'}</div>
            ))}
            <div><label className={labelCls}>Writing Feedback / Correction</label><textarea className={fieldCls} dir="rtl" rows={4} value={form.writingFeedback} onChange={(e) => set('writingFeedback', e.target.value)} /></div>
            <div><label className={labelCls}>Mistake Tags / Correction Notes</label><textarea className={fieldCls} rows={3} value={form.correctionFeedback} onChange={(e) => set('correctionFeedback', e.target.value)} /></div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-1)]">Speaking Task</h3>
          {speakingAudios.length > 0 ? speakingAudios.map((src, i) => <audio key={i} controls className="w-full" src={src} />) : <p className="text-sm text-[var(--text-3)]">No audio submitted.</p>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Pronunciation Note</label><textarea className={fieldCls} rows={2} value={form.pronunciationNote} onChange={(e) => set('pronunciationNote', e.target.value)} /></div>
            <div><label className={labelCls}>Fluency Note</label><textarea className={fieldCls} rows={2} value={form.fluencyNote} onChange={(e) => set('fluencyNote', e.target.value)} /></div>
            <div><label className={labelCls}>Correction Note</label><textarea className={fieldCls} rows={2} value={form.speakingCorrectionNote} onChange={(e) => set('speakingCorrectionNote', e.target.value)} /></div>
            <div><label className={labelCls}>Speaking Score (0–100)</label><input className={fieldCls} type="number" min="0" max="100" step="0.5" value={form.speakingScore} onChange={(e) => set('speakingScore', e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>Overall Speaking Feedback</label><textarea className={fieldCls} rows={3} value={form.speakingFeedback} onChange={(e) => set('speakingFeedback', e.target.value)} /></div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-1)]">Final Feedback</h3>
          <div><label className={labelCls}>Overall Feedback</label><textarea className={fieldCls} rows={4} value={form.finalFeedback} onChange={(e) => set('finalFeedback', e.target.value)} /></div>
          <div><label className={labelCls}>Teacher Score (0–100)</label><input className={fieldCls} type="number" min="0" max="100" step="0.5" value={form.teacherScore} onChange={(e) => set('teacherScore', e.target.value)} /></div>
        </div>

        {sendMutation.isError && <p className="text-sm text-red-600">{(sendMutation.error as Error).message}</p>}
      </div>

      <div className="border-t border-[var(--border)] p-5">
        <motion.button whileHover={{ y: -1 }} disabled={sendMutation.isPending} onClick={() => sendMutation.mutate()}
          className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-50">
          {sendMutation.isPending ? 'Sending…' : 'Send Feedback to Student'}
        </motion.button>
      </div>
    </>
  )
}

export const SubmissionReviewDrawer: FC<DrawerProps> = ({ submissionId, onClose, onSaved }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['book-submission-detail', submissionId],
    queryFn: () => bookSubmissionsApi.getSubmissionDetail(submissionId!),
    enabled: submissionId !== null,
  })

  const detail: BookSubmissionDetail | null =
    data && 'submission' in data ? (data as unknown as BookSubmissionDetail) : null

  return (
    <AnimatePresence>
      {submissionId !== null && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
          <motion.aside key={submissionId} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 end-0 z-50 flex w-full max-w-lg flex-col bg-[var(--bg)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-1)]">{detail?.submission.full_name ?? 'Loading…'}</h2>
                {detail && <p className="text-sm text-[var(--text-2)]">{detail.submission.book_title} · {detail.submission.unit_type === 'review' ? detail.submission.lesson_title : `#${detail.submission.lesson_number} ${detail.submission.lesson_title}`}</p>}
              </div>
              <button onClick={onClose} className="rounded-lg p-2 text-[var(--text-2)] hover:bg-[var(--surface-2)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {isLoading && !detail && <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-3)]">Loading…</div>}
            {detail && <FeedbackForm key={detail.submission.id} detail={detail} submissionId={submissionId} onSaved={onSaved} />}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
