import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Mic } from 'lucide-react'
import { stagger, listItem } from '@/design-system/animations'
import type { SpeakingResult } from '../types'

export interface SpeakingResultCardProps {
  results: SpeakingResult[]
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

export const SpeakingResultCard: FC<SpeakingResultCardProps> = ({ results }) => (
  <motion.div
    variants={stagger}
    initial="hidden"
    animate="visible"
    className="rounded-2xl p-5 flex flex-col gap-4"
    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
  >
    <div className="flex items-center gap-2">
      <Mic size={18} color="var(--accent)" />
      <h3 className="font-bold text-base" style={{ color: 'var(--fg)' }}>
        قسم التحدث
      </h3>
    </div>

    {results.map((sp, idx) => (
      <motion.div key={sp.id} variants={listItem} className="flex flex-col gap-2">
        <p className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>
          {idx + 1}. {sp.prompt}
        </p>
        {sp.audioPath ? (
          <audio
            controls
            src={normalizePath(sp.audioPath)}
            className="w-full rounded-lg"
          />
        ) : (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            لا يوجد تسجيل
          </p>
        )}
      </motion.div>
    ))}
  </motion.div>
)
