import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Spinner } from '@/design-system/components'
import { useBriefDetail } from './hooks/useBriefDetail'
import { BriefStatusBadge } from './components/BriefStatusBadge'
import { pageVariant } from './animations'
import type { BriefDetail } from './types'

const FIELDS: { label: string; key: keyof BriefDetail }[] = [
  { label: 'العمر', key: 'age' },
  { label: 'الجنسية', key: 'nationality' },
  { label: 'اللغة الأم / المستوى', key: 'native_language' },
  { label: 'الساعات المتعاقد عليها', key: 'contracted_hours' },
  { label: 'درس العربية من قبل', key: 'studied_arabic_before' },
  { label: 'المدة المستهدفة', key: 'target_duration' },
  { label: 'سبب التعلم', key: 'learning_reason' },
  { label: 'الهدف الرئيسي', key: 'main_goal' },
  { label: 'مستوى التحدث', key: 'speaking_ability' },
  { label: 'القراءة والكتابة', key: 'reading_writing_ability' },
  { label: 'معلومات ولي الأمر', key: 'parent_contact_info' },
  { label: 'الجدول المفضل', key: 'preferred_schedule' },
  { label: 'ملاحظات إضافية', key: 'additional_notes' },
  { label: 'ملاحظات المعلمة', key: 'owner_notes' },
]

export const BriefDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const briefId = parseInt(id ?? '0', 10)
  const { data, isLoading, error } = useBriefDetail(briefId)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          البريف غير موجود أو تعذّر تحميله.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5"
    >
      <Link to="/academy/briefs" className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--accent)' }}>
        ← العودة
      </Link>

      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{data.student_name}</h1>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
            {new Date(data.created_at).toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <BriefStatusBadge status={data.brief_status} />
          {data.conversion_status === 'converted' && (
            <span className="text-xs" style={{ color: 'var(--success)' }}>تم التحويل ✓</span>
          )}
        </div>
      </div>

      {/* Fields grid */}
      <div
        className="grid gap-4 sm:grid-cols-2 rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {FIELDS.map(({ label, key }) => {
          const val = data[key]
          if (!val) return null
          return (
            <div key={key} className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{label}</span>
              <span className="text-sm whitespace-pre-wrap" style={{ color: 'var(--ink)' }}>{String(val)}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
