import { useState, type FC } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Sparkles, Save } from 'lucide-react'
import { aiToolsApi } from '../api'
import { isGovernanceError } from '../types'
import type { AIArticle } from '../types'

const ARTICLE_TYPES = [
  'Speaking problem article',
  'Grammar tip article',
  'Cultural insight',
  'Learning strategy',
  'Vocabulary guide',
]

const fieldCls = 'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-1)] focus:border-[var(--accent)] focus:outline-none'
const labelCls = 'mb-1 block text-xs font-medium text-[var(--text-2)]'

export const ArticleGeneratorTab: FC = () => {
  const [articleType, setArticleType] = useState(ARTICLE_TYPES[0])
  const [audience, setAudience]       = useState('Adults learning Arabic')
  const [keywords, setKeywords]       = useState('')
  const [notes, setNotes]             = useState('')
  const [language, setLanguage]       = useState('English')
  const [result, setResult]           = useState<AIArticle | null>(null)
  const [saved, setSaved]             = useState(false)

  const generateMutation = useMutation({
    mutationFn: () => aiToolsApi.generateArticle({ article_type: articleType, audience, keywords, notes, language }),
    onSuccess: (data) => { if (!isGovernanceError(data)) { setResult(data.article); setSaved(false) } },
  })

  const applyMutation = useMutation({
    mutationFn: () => aiToolsApi.applyArticle(result!, generateMutation.data?.ai_request_id ?? 0),
    onSuccess: () => setSaved(true),
  })

  const govError = generateMutation.data && isGovernanceError(generateMutation.data) ? generateMutation.data : null

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Article Type</label>
        <select className={fieldCls} value={articleType} onChange={(e) => setArticleType(e.target.value)}>
          {ARTICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Audience</label>
          <input className={fieldCls} type="text" value={audience} onChange={(e) => setAudience(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Language</label>
          <select className={fieldCls} value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option>English</option>
            <option>Arabic</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Keywords</label>
        <input className={fieldCls} type="text" placeholder="Arabic speaking, learn Arabic, beginner…" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
      </div>

      <div>
        <label className={labelCls}>Notes for Claude</label>
        <textarea className={fieldCls} rows={2} placeholder="Any specific angle or points to cover…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {govError && <p className="text-sm font-semibold" style={{ color: 'var(--error)' }}>{govError.error.replace(/_/g, ' ')} — {govError.message}</p>}
      {generateMutation.isError && !govError && <p className="text-sm" style={{ color: 'var(--error)' }}>Generation failed. Please try again.</p>}

      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        disabled={generateMutation.isPending}
        onClick={() => generateMutation.mutate()}
        className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-semibold"
        style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', opacity: generateMutation.isPending ? 0.5 : 1 }}
      >
        <Sparkles size={14} />
        {generateMutation.isPending ? 'Generating…' : 'Generate Article'}
      </motion.button>

      {result && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-base font-bold" style={{ color: 'var(--fg)' }}>{result.title}</p>
          {result.seo_meta_description && <p className="text-xs" style={{ color: 'var(--muted)' }}>{result.seo_meta_description}</p>}
          <p className="text-sm leading-relaxed line-clamp-5" style={{ color: 'var(--fg)' }}>{result.excerpt || result.body}</p>

          {saved ? (
            <p className="text-sm font-semibold text-center py-1" style={{ color: 'var(--success)' }}>Saved as draft ✓</p>
          ) : (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              disabled={applyMutation.isPending}
              onClick={() => applyMutation.mutate()}
              className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-semibold"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)', cursor: 'pointer', opacity: applyMutation.isPending ? 0.5 : 1 }}
            >
              <Save size={13} />
              {applyMutation.isPending ? 'Saving…' : 'Save as Draft'}
            </motion.button>
          )}
        </div>
      )}
    </div>
  )
}
