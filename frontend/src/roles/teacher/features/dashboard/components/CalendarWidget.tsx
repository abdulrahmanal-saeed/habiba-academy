import { useState } from 'react'
import type { FC } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeInUp } from '@/design-system/animations'
import type { CalendarSession } from '../types'

interface CalendarWidgetProps {
  sessions: CalendarSession[]
  month: string
  onMonthChange: (month: string) => void
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getDaysInMonth(ym: string): Date[] {
  const [y, m] = ym.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const last  = new Date(y, m, 0)
  const days: Date[] = []
  // Pad start (Sun=0)
  for (let i = 0; i < first.getDay(); i++) days.push(new Date(y, m - 1, -i - 1 + 1 - first.getDay()))
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(y, m - 1, d))
  return days
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const CalendarWidget: FC<CalendarWidgetProps> = ({ sessions, month, onMonthChange }) => {
  const today = toYMD(new Date())
  const [selectedDay, setSelectedDay] = useState(today)

  const sessionMap: Record<string, CalendarSession[]> = {}
  for (const s of sessions) {
    if (!sessionMap[s.planned_date]) sessionMap[s.planned_date] = []
    sessionMap[s.planned_date].push(s)
  }

  const days = getDaysInMonth(month)
  const daySessions = sessionMap[selectedDay] ?? []

  return (
    <div
      className="rounded-2xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Calendar size={15} style={{ color: 'var(--accent)' }} />
          <h2 className="text-sm font-bold" style={{ color: 'var(--fg)' }}>{formatMonth(month)}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMonthChange(prevMonth(month))}
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Previous month"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(nextMonth(month))}
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Next month"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-center text-xs font-semibold py-1" style={{ color: 'var(--muted)' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            const ymd = toYMD(d)
            const inMonth = d.getMonth() === Number(month.split('-')[1]) - 1
            const isToday = ymd === today
            const isSelected = ymd === selectedDay
            const hasSessions = !!sessionMap[ymd]?.length
            return (
              <button
                key={i}
                type="button"
                onClick={() => { if (inMonth) setSelectedDay(ymd) }}
                className="flex flex-col items-center justify-center rounded-xl text-xs font-semibold"
                style={{
                  height: 32,
                  background: isSelected ? 'var(--accent)' : isToday ? 'var(--accent-soft)' : 'transparent',
                  color: isSelected ? '#fff' : !inMonth ? 'var(--border)' : 'var(--fg)',
                  border: 'none',
                  cursor: inMonth ? 'pointer' : 'default',
                  position: 'relative',
                }}
              >
                {d.getDate()}
                {hasSessions && inMonth && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 3,
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: isSelected ? '#fff' : 'var(--accent)',
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day sessions */}
      <div className="px-3 pb-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="pt-3">
          <AnimatePresence mode="wait">
            <motion.div key={selectedDay} variants={fadeInUp} initial="hidden" animate="visible">
              {daySessions.length === 0 ? (
                <p className="text-xs text-center py-2" style={{ color: 'var(--muted)' }}>
                  No sessions on {selectedDay}
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {daySessions.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl px-3 py-2 flex items-center justify-between"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                    >
                      <div>
                        <div className="text-xs font-semibold" style={{ color: 'var(--fg)' }}>{s.student_name}</div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>{s.title}</div>
                      </div>
                      {s.session_time && (
                        <div className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                          {s.session_time.slice(0, 5)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
