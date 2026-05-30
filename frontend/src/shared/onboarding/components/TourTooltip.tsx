import { motion } from 'framer-motion'
import type { FC } from 'react'
import { X } from 'lucide-react'
import type { TourPlacement } from '../types'

export interface TourTooltipProps {
  rect: DOMRect
  placement: TourPlacement
  title: string
  description: string
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}

const OFFSET = 16
const TOOLTIP_WIDTH = 280

function getTooltipStyle(rect: DOMRect, placement: TourPlacement): React.CSSProperties {
  const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }

  switch (placement) {
    case 'top':
      return {
        top: rect.top - OFFSET,
        left: Math.max(8, center.x - TOOLTIP_WIDTH / 2),
        transform: 'translateY(-100%)',
      }
    case 'bottom':
      return {
        top: rect.bottom + OFFSET,
        left: Math.max(8, center.x - TOOLTIP_WIDTH / 2),
      }
    case 'left':
      return {
        top: center.y,
        left: rect.left - OFFSET,
        transform: 'translate(-100%, -50%)',
      }
    case 'right':
      return {
        top: center.y,
        left: rect.right + OFFSET,
        transform: 'translateY(-50%)',
      }
  }
}

export const TourTooltip: FC<TourTooltipProps> = ({
  rect,
  placement,
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}) => {
  const isFirst = currentStep === 0
  const isLast = currentStep === totalSteps - 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        width: TOOLTIP_WIDTH,
        zIndex: 10002,
        ...getTooltipStyle(rect, placement),
      }}
    >
      <div
        className="flex flex-col gap-3 rounded-[var(--radius-xl)] p-4 shadow-xl"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border-soft)',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            {title}
          </h4>
          <button
            type="button"
            onClick={onSkip}
            className="shrink-0 rounded p-0.5 transition-opacity hover:opacity-60"
            style={{ color: 'var(--muted)' }}
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          {description}
        </p>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {currentStep + 1} / {totalSteps}
          </span>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={onPrev}
                className="rounded-[var(--radius)] px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                  border: '1px solid var(--border)',
                }}
              >
                السابق
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="rounded-[var(--radius)] px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {isLast ? 'إنهاء' : 'التالي'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
