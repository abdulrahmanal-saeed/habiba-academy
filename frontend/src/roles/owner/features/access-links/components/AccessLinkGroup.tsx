import { useState, type FC } from 'react'
import { motion } from 'framer-motion'
import type { AccessLinkEntry } from '../types'
import { cardVariant } from '../animations'

interface Props {
  title: string
  entries: AccessLinkEntry[]
  loginUrl: string
}

export const AccessLinkGroup: FC<Props> = ({ title, entries, loginUrl }) => {
  const [copied, setCopied] = useState<string>('')

  function copy(text: string, key: string): void {
    const done = (): void => {
      setCopied(key)
      setTimeout(() => setCopied(''), 1200)
    }
    if (navigator.clipboard && window.isSecureContext) {
      void navigator.clipboard.writeText(text).then(done).catch(() => {
        prompt('Copy:', text)
      })
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); done() } catch { prompt('Copy:', text) }
      document.body.removeChild(ta)
    }
  }

  return (
    <motion.div
      variants={cardVariant} initial="hidden" animate="visible"
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '1rem', padding: '1.5rem', marginBottom: '1rem',
      }}
    >
      <div className="fw-bold fs-5 mb-3">{title}</div>
      {entries.length === 0 ? (
        <div className="small" style={{ color: 'var(--muted)' }}>No records yet.</div>
      ) : (
        <div className="d-grid gap-2">
          {entries.map((entry, i) => (
            <div
              key={i}
              style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem' }}
            >
              <div className="fw-semibold mb-1">{entry.name}</div>
              {entry.sub && <div className="small mb-2" style={{ color: 'var(--muted)' }}>{entry.sub}</div>}
              <div className="d-flex gap-2 flex-wrap">
                <div className="input-group input-group-sm flex-grow-1" style={{ minWidth: 200 }}>
                  <input className="form-control" readOnly value={loginUrl} />
                  <motion.button
                    type="button" className="btn btn-app btn-sm"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => copy(loginUrl, `url-${i}`)}
                  >
                    {copied === `url-${i}` ? 'Copied!' : 'Copy URL'}
                  </motion.button>
                </div>
                {entry.access_code && (
                  <div className="input-group input-group-sm" style={{ maxWidth: 200 }}>
                    <input className="form-control" readOnly value={entry.access_code} />
                    <motion.button
                      type="button" className="btn btn-ghost btn-sm"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => copy(entry.access_code ?? '', `code-${i}`)}
                    >
                      {copied === `code-${i}` ? 'Copied!' : 'Copy'}
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
