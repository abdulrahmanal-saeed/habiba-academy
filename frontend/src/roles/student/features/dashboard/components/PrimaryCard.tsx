import { motion } from 'framer-motion'
import type { FC } from 'react'
import { BookOpen, CheckCircle, Clock, AlertTriangle, MessageSquare, Plus } from 'lucide-react'
import { cardVariant } from '@/design-system/animations'
import { Button } from '@/design-system/components'
import type { PrimaryCardState } from '../types'

export interface PrimaryCardProps {
  state: PrimaryCardState
  studentName: string
}

const WHATSAPP_URL = 'https://wa.me/971XXXXXXXXX'

const cfg = {
  review_pending:      { icon: BookOpen,      bg: 'var(--accent)',   label: 'ابدأ المراجعة',    dim: false },
  review_reviewed:     { icon: CheckCircle,   bg: 'var(--success)',  label: 'عرض النتيجة',      dim: false },
  review_under_review: { icon: Clock,         bg: 'var(--muted)',    label: 'قيد المراجعة',     dim: true  },
  homework_overdue:    { icon: AlertTriangle, bg: 'var(--danger)',   label: 'سلّم الآن',        dim: false },
  homework_ready:      { icon: BookOpen,      bg: 'var(--accent)',   label: 'ابدأ الواجب',      dim: false },
  homework_submitted:  { icon: CheckCircle,   bg: 'var(--muted)',    label: 'عرض النتيجة',      dim: true  },
  scenario:            { icon: MessageSquare, bg: 'var(--accent)',   label: 'ابدأ المحادثة',    dim: false },
  empty:               { icon: Plus,          bg: 'var(--surface2)', label: '',                  dim: false },
} as const

function getTitle(state: PrimaryCardState): string {
  switch (state.kind) {
    case 'review_pending':
    case 'review_reviewed':
    case 'review_under_review':  return state.homeworkTitle
    case 'homework_overdue':
    case 'homework_ready':
    case 'homework_submitted':   return state.title
    case 'scenario':             return state.title
    case 'empty':                return 'لا يوجد واجب جديد'
  }
}

function getHref(state: PrimaryCardState): string {
  switch (state.kind) {
    case 'review_pending':
    case 'review_reviewed':
    case 'review_under_review':  return `/student/reviews/${state.reviewId}`
    case 'homework_overdue':
    case 'homework_ready':
    case 'homework_submitted':   return `/student/homework/${state.homeworkId}`
    case 'scenario':             return `/student/scenarios/${state.scenarioId}`
    case 'empty':                return WHATSAPP_URL
  }
}

export const PrimaryCard: FC<PrimaryCardProps> = ({ state, studentName }) => {
  const { icon: Icon, bg, label, dim } = cfg[state.kind]
  const title  = getTitle(state)
  const href   = getHref(state)
  const isEmpty = state.kind === 'empty'

  return (
    <motion.div
      variants={cardVariant}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2 }}
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ background: bg, opacity: dim ? 0.6 : 1 }}
        >
          <Icon size={20} color="var(--on-accent)" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            مرحباً، {studentName}
          </p>
          <p
            className="font-semibold text-sm truncate"
            style={{ color: dim ? 'var(--muted)' : 'var(--fg)', direction: 'rtl' }}
          >
            {title}
          </p>
        </div>
      </div>

      {!isEmpty && (
        <Button
          as="a"
          href={href}
          size="sm"
          disabled={dim}
          style={dim ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
        >
          {label}
        </Button>
      )}

      {isEmpty && (
        <Button as="a" href={WHATSAPP_URL} size="sm" variant="secondary">
          تواصل عبر واتساب
        </Button>
      )}
    </motion.div>
  )
}
