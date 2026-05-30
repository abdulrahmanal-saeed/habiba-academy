import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Spinner } from '@/design-system/components'
import { buttonTap } from '@/design-system/animations'

export interface MarkCompleteButtonProps {
  isCompleted: boolean
  onComplete: () => Promise<void>
}

export const MarkCompleteButton: FC<MarkCompleteButtonProps> = ({
  isCompleted,
  onComplete,
}) => {
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(isCompleted)

  async function handleClick(): Promise<void> {
    if (done || loading) return
    setLoading(true)
    try {
      await onComplete()
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
        style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
      >
        <CheckCircle2 size={16} /> Completed
      </div>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={() => { void handleClick() }}
      {...buttonTap}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
      style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
    >
      {loading
        ? <><Spinner size="sm" /> Marking…</>
        : <><CheckCircle2 size={16} /> Mark Completed</>
      }
    </motion.button>
  )
}
