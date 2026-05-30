import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { Bookmark, X } from 'lucide-react'

export const ResumeBanner: FC = () => {
  const [visible, setVisible] = useState(true)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          role="alert"
        >
          <Bookmark size={16} className="flex-shrink-0" />
          <span className="flex-1">تم استعادة تقدمك — المتابعة من حيث توقفتِ.</span>
          <button
            onClick={() => setVisible(false)}
            className="flex-shrink-0 rounded-full p-0.5"
            aria-label="إغلاق"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
