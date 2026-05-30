import type { FC } from 'react'

interface Props {
  submitted: 0 | 1
  submittedAt: string | null
}

export const HomeworkStatusBadge: FC<Props> = ({ submitted, submittedAt }) => {
  if (submitted === 1) {
    return (
      <div className="text-end">
        <span
          className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
        >
          مسلَّم ✓
        </span>
        {submittedAt && (
          <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
            {new Date(submittedAt).toLocaleDateString('ar-AE')}
          </p>
        )}
      </div>
    )
  }

  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}
    >
      بانتظار التسليم
    </span>
  )
}
