import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { ChevronDown } from 'lucide-react'

export interface ReadingAccordionProps {
  text: string
}

export const ReadingAccordion: FC<ReadingAccordionProps> = ({ text }) => {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold"
        style={{ color: 'var(--fg)' }}
        aria-expanded={open}
      >
        <span>النص المرجعي للقراءة</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} color="var(--muted)" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-5 pb-5 text-sm"
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: '1.85',
                color: 'var(--fg)',
                background: 'var(--surface2)',
                borderTop: '1px solid var(--border)',
              }}
            >
              {text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
