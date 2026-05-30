import { motion } from 'framer-motion'
import { useState, type FC } from 'react'
import { rowItem } from '../animations'

interface Props {
  label: string
  url: string
}

export const TrackingLinkRow: FC<Props> = ({ label, url }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <motion.div variants={rowItem} className="flex flex-col gap-1.5">
      <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{label}</span>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 min-w-0 rounded-xl px-3 py-2 text-xs"
          style={{
            background: 'var(--bg)',
            border:     '1px solid var(--border)',
            color:      'var(--ink)',
          }}
        />
        <motion.button
          type="button"
          onClick={() => { void handleCopy() }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
          style={{
            background: copied ? 'var(--success-bg)' : 'var(--accent)',
            color:      copied ? 'var(--success)'    : 'var(--surface)',
          }}
        >
          {copied ? 'تم النسخ ✓' : 'نسخ'}
        </motion.button>
      </div>
    </motion.div>
  )
}
