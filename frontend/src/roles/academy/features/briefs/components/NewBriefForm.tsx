import { motion } from 'framer-motion'
import { useState } from 'react'
import type { FC, FormEvent, ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitBrief } from '../api'
import type { NewBriefPayload } from '../types'
import { pageVariant } from '../animations'

const EMPTY: NewBriefPayload = {
  student_name: '', age: '', nationality: '', native_language: '',
  contracted_hours: '', studied_arabic_before: 'no', target_duration: '',
  learning_reason: '', main_goal: '', speaking_ability: '',
  reading_writing_ability: '', parent_contact_info: '',
  preferred_schedule: '', additional_notes: '',
}

type Field = keyof NewBriefPayload

function Field({ label, name, value, onChange, required, multiline }: {
  label: string; name: Field; value: string; onChange: (n: Field, v: string) => void
  required?: boolean; multiline?: boolean
}): ReactElement {
  const shared = {
    value, required,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(name, e.target.value),
    className: 'w-full rounded-lg px-3 py-2 text-sm',
    style: { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink)' },
  }
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
        {label}{required && <span style={{ color: 'var(--danger)' }}> *</span>}
      </label>
      {multiline ? <textarea rows={3} {...shared} /> : <input {...shared} />}
    </div>
  )
}

export const NewBriefForm: FC = () => {
  const [form, setForm] = useState<NewBriefPayload>(EMPTY)
  const [err, setErr] = useState('')
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: submitBrief,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['academy-briefs'] })
      navigate('/academy/briefs')
    },
    onError: (e: Error) => setErr(e.message),
  })

  const set = (name: Field, value: string) => setForm((p) => ({ ...p, [name]: value }))

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    mutate(form)
  }

  return (
    <motion.form
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      onSubmit={onSubmit}
      className="flex flex-col gap-4"
    >
      {err && (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
          {err}
        </p>
      )}

      {/* Section 1 — Identity */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم الطالب" name="student_name" value={form.student_name} onChange={set} required />
        <Field label="العمر" name="age" value={form.age} onChange={set} />
        <Field label="الجنسية" name="nationality" value={form.nationality} onChange={set} required />
        <Field label="اللغة الأم / ملاحظات المستوى" name="native_language" value={form.native_language} onChange={set} required />
        <Field label="الساعات المتعاقد عليها" name="contracted_hours" value={form.contracted_hours} onChange={set} required />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            درس العربية من قبل؟ <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            value={form.studied_arabic_before}
            onChange={(e) => set('studied_arabic_before', e.target.value as 'yes' | 'no')}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink)' }}
          >
            <option value="no">لا</option>
            <option value="yes">نعم</option>
          </select>
        </div>
        <Field label="المدة المستهدفة" name="target_duration" value={form.target_duration} onChange={set} required />
      </div>

      {/* Section 2 — Goals & Abilities */}
      <div className="grid gap-4">
        <Field label="سبب تعلم العربية" name="learning_reason" value={form.learning_reason} onChange={set} required multiline />
        <Field label="الهدف الرئيسي" name="main_goal" value={form.main_goal} onChange={set} required multiline />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="مستوى التحدث" name="speaking_ability" value={form.speaking_ability} onChange={set} multiline />
          <Field label="القراءة والكتابة" name="reading_writing_ability" value={form.reading_writing_ability} onChange={set} multiline />
          <Field label="معلومات ولي الأمر (إن طفل)" name="parent_contact_info" value={form.parent_contact_info} onChange={set} multiline />
          <Field label="الجدول المفضل" name="preferred_schedule" value={form.preferred_schedule} onChange={set} multiline />
        </div>
        <Field label="ملاحظات إضافية" name="additional_notes" value={form.additional_notes} onChange={set} multiline />
      </div>

      <motion.button
        type="submit"
        disabled={isPending}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="self-start rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-60"
        style={{ background: 'var(--accent)', color: 'var(--surface)' }}
      >
        {isPending ? 'جارٍ الإرسال…' : 'إرسال البريف'}
      </motion.button>
    </motion.form>
  )
}
