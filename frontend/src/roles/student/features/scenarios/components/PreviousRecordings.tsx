import { motion } from 'framer-motion'
import type { FC } from 'react'
import { stagger, listItem } from '@/design-system/animations'
import { getStoredRating } from '../utils'
import type { ScenarioRecording } from '../types'

export interface PreviousRecordingsProps {
  recordings: ScenarioRecording[]
  scenarioId: number
}

const CONF_EMOJI: Record<number, string> = { 1: '😐', 2: '😊', 3: '😄' }
const CONF_LABEL: Record<number, string>  = { 1: 'Not sure', 2: 'Pretty good', 3: 'Confident!' }

function normalizePath(p: string): string {
  return p && !p.startsWith('/') ? `/${p}` : p
}

export const PreviousRecordings: FC<PreviousRecordingsProps> = ({ recordings, scenarioId }) => {
  if (recordings.length === 0) return null

  return (
    <motion.div
      className="rounded-xl p-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <h2 className="font-bold text-base mb-4" style={{ color: 'var(--fg)' }}>Previous Recordings</h2>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-3">
        {recordings.map((rec) => {
          const src    = normalizePath(rec.audio_path)
          const rating = getStoredRating(scenarioId, rec.take_no)

          return (
            <motion.div
              key={rec.id}
              variants={listItem}
              className="rounded-xl p-4"
              style={{ border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: 'var(--fg)' }}>
                  Take #{rec.take_no}
                </span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {rec.submitted_at ?? ''}
                </span>
              </div>

              {src && (
                <audio controls src={src} className="w-full rounded-lg mb-2" />
              )}

              {rec.chips.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {rec.chips.map((chip, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}

              {rec.teacher_note && (
                <div
                  className="text-xs px-3 py-2 rounded-lg"
                  style={{ background: 'var(--info-soft)', color: 'var(--info)' }}
                >
                  💬 {rec.teacher_note}
                </div>
              )}

              {rating !== null && (
                <div
                  className="inline-flex items-center gap-1 mt-2 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-alt)', color: 'var(--muted)' }}
                >
                  {CONF_EMOJI[rating]} {CONF_LABEL[rating]}
                </div>
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
