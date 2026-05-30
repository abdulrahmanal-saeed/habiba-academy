import type { FC } from 'react'
import { Check } from 'lucide-react'
import type { StepType } from '../types'

const LABELS: Record<StepType, string> = {
  listening: 'استماع',
  reading:   'قراءة',
  mcq:       'أسئلة',
  writing:   'كتابة',
  speaking:  'تحدث',
  submit:    'تسليم',
}

export interface StepIndicatorProps {
  steps: StepType[]
  currentStep: number
  stepDurations: Partial<Record<StepType, number>>
}

export const StepIndicator: FC<StepIndicatorProps> = ({ steps, currentStep, stepDurations }) => (
  <div className="flex items-start overflow-x-auto pb-2 gap-0">
    {steps.map((step, idx) => {
      const isDone   = idx < currentStep
      const isActive = idx === currentStep
      const dur      = stepDurations[step]
      const circleStyle = {
        background: isDone || isActive ? 'var(--accent)' : 'var(--surface2)',
        color:      isDone || isActive ? 'var(--on-accent)' : 'var(--muted)',
        outline:    isActive ? '2px solid var(--accent)' : 'none',
        outlineOffset: '2px',
      }

      return (
        <div key={step} className="flex items-start flex-shrink-0">
          {idx > 0 && (
            <div
              className="h-0.5 w-5 mt-4 flex-shrink-0"
              style={{ background: isDone ? 'var(--accent)' : 'var(--border)' }}
            />
          )}
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={circleStyle}
            >
              {isDone ? <Check size={14} /> : idx + 1}
            </div>
            <p
              className="text-xs font-medium text-center"
              style={{ color: isActive ? 'var(--accent)' : 'var(--muted)', whiteSpace: 'nowrap' }}
            >
              {LABELS[step]}
            </p>
            {dur !== undefined && (
              <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
                {dur}د
              </p>
            )}
          </div>
        </div>
      )
    })}
  </div>
)
