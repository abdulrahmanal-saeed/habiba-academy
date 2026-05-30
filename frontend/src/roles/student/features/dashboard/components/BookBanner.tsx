import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { X } from 'lucide-react'
import { fadeInDown } from '@/design-system/animations'
import { bookMarketingEvent } from '../api'
import type { BookBannerInfo } from '../types'

export interface BookBannerProps {
  info: BookBannerInfo
}

const LS_KEY = 'habiba_book_banner_dismissed'
const SUPPRESS_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function isSuppressed(): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return false
    return Date.now() - parseInt(raw, 10) < SUPPRESS_MS
  } catch {
    return false
  }
}

export const BookBanner: FC<BookBannerProps> = ({ info }) => {
  // Lazy initializer — runs once at mount, avoids useEffect setState lint error
  const [visible, setVisible] = useState(() => !isSuppressed())

  const handleDismiss = async () => {
    setVisible(false)
    try {
      localStorage.setItem(LS_KEY, String(Date.now()))
      await bookMarketingEvent('book_banner_dismissed', 'dashboard')
    } catch {
      // Silent — user experience not degraded
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          variants={fadeInDown}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -8 }}
          className="rounded-2xl overflow-hidden relative"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <button
            onClick={() => { void handleDismiss() }}
            className="absolute top-3 end-3 z-10 flex items-center justify-center w-7 h-7 rounded-full"
            style={{ background: 'var(--surface2)' }}
            aria-label="إغلاق"
          >
            <X size={14} color="var(--muted)" />
          </button>

          <div className="flex items-center gap-4 p-4">
            {info.imageUrl && (
              <img
                src={info.imageUrl}
                alt={info.title}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>
                {info.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {info.subtitle}
              </p>
            </div>
            <a
              href={info.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
            >
              اعرفي المزيد
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
