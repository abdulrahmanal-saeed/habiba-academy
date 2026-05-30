import { useState } from 'react'
import type { FC, ReactElement } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Clock, FileText, MessageSquare, BookOpen } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { fadeInUp } from '@/design-system/animations'
import { setItemStatus } from '../api'
import type { TodayHomework, TodayScenario, TodayReview } from '../types'

interface TodayActivityProps {
  homework: TodayHomework[]
  scenarios: TodayScenario[]
  reviews: TodayReview[]
}

type Tab = 'homework' | 'scenarios' | 'reviews'

const TABS: { key: Tab; label: string; Icon: FC<{ size?: number }> }[] = [
  { key: 'homework',  label: 'Homework',  Icon: FileText },
  { key: 'scenarios', label: 'Scenarios', Icon: MessageSquare },
  { key: 'reviews',   label: 'Reviews',   Icon: BookOpen },
]

function StatusPill({ done }: { done: boolean }): ReactElement {
  return (
    <span
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: done ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.1)',
        color: done ? 'var(--success)' : '#d97706',
      }}
    >
      {done ? <Check size={11} /> : <Clock size={11} />}
      {done ? 'Done' : 'Pending'}
    </span>
  )
}

export const TodayActivity: FC<TodayActivityProps> = ({ homework, scenarios, reviews }) => {
  const [tab, setTab] = useState<Tab>('homework')
  const [localHw,  setLocalHw]  = useState(homework)
  const [localSc,  setLocalSc]  = useState(scenarios)
  const [localRev, setLocalRev] = useState(reviews)
  const qc = useQueryClient()

  async function closeHomework(id: number): Promise<void> {
    setLocalHw((prev) => prev.filter((h) => h.homework_id !== id))
    try {
      await setItemStatus('homework', id, 'closed')
      await qc.invalidateQueries({ queryKey: ['teacher-dashboard'] })
    } catch {
      setLocalHw(homework)
    }
  }

  async function closeScenario(id: number): Promise<void> {
    setLocalSc((prev) => prev.filter((s) => s.scenario_id !== id))
    try {
      await setItemStatus('scenario', id, 'closed')
      await qc.invalidateQueries({ queryKey: ['teacher-dashboard'] })
    } catch {
      setLocalSc(scenarios)
    }
  }

  async function closeReview(id: number): Promise<void> {
    setLocalRev((prev) => prev.filter((r) => r.review_id !== id))
    try {
      await setItemStatus('review', id, 'closed')
      await qc.invalidateQueries({ queryKey: ['teacher-dashboard'] })
    } catch {
      setLocalRev(reviews)
    }
  }

  const counts = { homework: localHw.length, scenarios: localSc.length, reviews: localRev.length }

  return (
    <div
      className="rounded-2xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors"
            style={{
              borderColor: tab === key ? 'var(--accent)' : 'transparent',
              color: tab === key ? 'var(--accent)' : 'var(--muted)',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            <Icon size={14} />
            {label}
            {counts[key] > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-xs font-bold leading-none"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {tab === 'homework' && (
            <motion.div key="hw" variants={fadeInUp} initial="hidden" animate="visible" exit="hidden">
              {localHw.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: 'var(--muted)' }}>No homework today</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {localHw.map((h) => (
                    <div
                      key={h.homework_id}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{h.title}</div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>{h.student_name}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ms-3">
                        <StatusPill done={h.submitted} />
                        <button
                          type="button"
                          onClick={() => void closeHomework(h.homework_id)}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'scenarios' && (
            <motion.div key="sc" variants={fadeInUp} initial="hidden" animate="visible" exit="hidden">
              {localSc.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: 'var(--muted)' }}>No scenarios today</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {localSc.map((s) => (
                    <div
                      key={s.scenario_id}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{s.title}</div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>{s.student_name}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ms-3">
                        <StatusPill done={s.recorded} />
                        <button
                          type="button"
                          onClick={() => void closeScenario(s.scenario_id)}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'reviews' && (
            <motion.div key="rev" variants={fadeInUp} initial="hidden" animate="visible" exit="hidden">
              {localRev.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: 'var(--muted)' }}>No reviews today</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {localRev.map((r) => (
                    <div
                      key={r.review_id}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{r.title}</div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>{r.student_name}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ms-3">
                        <StatusPill done={r.submitted} />
                        <button
                          type="button"
                          onClick={() => void closeReview(r.review_id)}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
