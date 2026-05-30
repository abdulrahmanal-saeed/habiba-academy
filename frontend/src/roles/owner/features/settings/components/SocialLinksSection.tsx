import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Save } from 'lucide-react'
import { cardVariant } from '@/design-system/animations'
import type { ProfileSettings } from '../types'

interface SocialLinksSectionProps {
  profile: ProfileSettings
  onSave: (form: FormData) => Promise<void>
  isSaving: boolean
}

const SOCIAL_FIELDS: Array<{ key: keyof ProfileSettings; label: string; placeholder: string }> = [
  { key: 'social_instagram', label: 'Instagram',  placeholder: 'https://instagram.com/habibanabil' },
  { key: 'social_facebook',  label: 'Facebook',   placeholder: 'https://facebook.com/habibanabil' },
  { key: 'social_youtube',   label: 'YouTube',    placeholder: 'https://youtube.com/@habibanabil' },
  { key: 'social_tiktok',    label: 'TikTok',     placeholder: 'https://tiktok.com/@habibanabil' },
]

export const SocialLinksSection: FC<SocialLinksSectionProps> = ({ profile, onSave, isSaving }) => {
  const [links, setLinks] = useState<Record<string, string>>({
    social_instagram: profile.social_instagram,
    social_facebook:  profile.social_facebook,
    social_youtube:   profile.social_youtube,
    social_tiktok:    profile.social_tiktok,
  })

  async function handleSave(): Promise<void> {
    const fd = new FormData()
    fd.append('action', 'update_profile')
    Object.entries(links).forEach(([k, v]) => fd.append(k, v))
    await onSave(fd)
  }

  return (
    <motion.div
      variants={cardVariant}
      className="rounded-2xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--accent)' }}>Social Links</h2>
      <div className="flex flex-col gap-3">
        {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>{label}</label>
            <input
              type="url"
              value={links[key] ?? ''}
              onChange={(e) => setLinks((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full rounded-xl py-2 px-3 text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', outline: 'none' }}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={isSaving}
        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
        style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1 }}
      >
        <Save size={13} />
        {isSaving ? 'Saving…' : 'Save Links'}
      </button>
    </motion.div>
  )
}
