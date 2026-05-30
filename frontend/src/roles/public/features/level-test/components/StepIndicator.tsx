import type { FC } from 'react'
import type { LevelTestStep } from '../types'

const STEPS: Array<{ key: LevelTestStep; labelAr: string }> = [
  { key: 'registration', labelAr: 'التسجيل' },
  { key: 'listening',    labelAr: 'الاستماع' },
  { key: 'reading',      labelAr: 'القراءة' },
  { key: 'writing',      labelAr: 'الكتابة' },
  { key: 'speaking',     labelAr: 'المحادثة' },
  { key: 'result',       labelAr: 'النتيجة' },
]

const ORDER: Record<LevelTestStep, number> = {
  registration: 0, listening: 1, reading: 2, writing: 3, speaking: 4, result: 5,
}

interface StepIndicatorProps {
  currentStep: LevelTestStep
}

export const StepIndicator: FC<StepIndicatorProps> = ({ currentStep }) => {
  const current = ORDER[currentStep]

  return (
    <div
      className="sticky top-0 z-40 w-full px-4 py-3"
      style={{ background: 'var(--card)', borderBottom: '1px solid var(--border-soft)' }}
    >
      <div className="container mx-auto flex items-center justify-between gap-1">
        {STEPS.map((s, i) => {
          const done = i < current
          const active = i === current
          return (
            <div key={s.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors"
                style={{
                  background: done || active ? 'var(--accent)' : 'var(--border)',
                  color: done || active ? 'white' : 'var(--muted)',
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className="hidden truncate text-[10px] font-medium sm:block"
                style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}
              >
                {s.labelAr}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className="absolute hidden h-0.5 w-full translate-y-3.5 sm:block"
                  style={{ background: done ? 'var(--accent)' : 'var(--border)' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
