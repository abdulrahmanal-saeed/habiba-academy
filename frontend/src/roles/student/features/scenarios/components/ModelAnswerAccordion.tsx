import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { ChevronDown } from 'lucide-react'
import { fadeIn } from '@/design-system/animations'

export interface ModelAnswerAccordionProps {
  modelAnswer: string
}

export const ModelAnswerAccordion: FC<ModelAnswerAccordionProps> = ({ modelAnswer }) => {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="rounded-xl p-5"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span aria-hidden>💡</span>
            <span className="font-bold text-sm" style={{ color: 'var(--fg)' }}>Model Answer</span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            See how a strong answer might sound — compare with your recording
          </p>
        </div>
        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          whileTap={{ scale: 0.96 }}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}
          aria-expanded={open}
        >
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex' }}
          >
            <ChevronDown size={14} />
          </motion.span>
          {open ? 'Hide' : 'Show'}
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="mt-4 p-4 rounded-lg text-sm leading-loose whitespace-pre-wrap"
              style={{
                background: 'var(--bg-alt)',
                border: '1px solid var(--border)',
                direction: 'rtl',
                textAlign: 'start',
              }}
            >
              {modelAnswer}
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
              ℹ️ This is one possible answer — your own style and phrasing are welcome!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
