import { useState, useRef, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Upload, Save } from 'lucide-react'
import { cardVariant } from '@/design-system/animations'
import type { ProfileSettings } from '../types'

interface ProfileSectionProps {
  profile: ProfileSettings
  onSave: (form: FormData) => Promise<void>
  isSaving: boolean
}

export const ProfileSection: FC<ProfileSectionProps> = ({ profile, onSave, isSaving }) => {
  const [whatsapp, setWhatsapp] = useState(profile.contact_whatsapp)
  const [preview,  setPreview]  = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const photoFileRef = useRef<File | null>(null)

  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
  const photoSrc = preview
    ?? `${baseUrl}/assets/img/habiba.jpg?v=${profile.teacher_photo_v}`

  function handleFileChange(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0]
    if (!file) return
    photoFileRef.current = file
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave(): Promise<void> {
    const fd = new FormData()
    fd.append('action', 'update_profile')
    fd.append('contact_whatsapp', whatsapp)
    if (photoFileRef.current) fd.append('teacher_photo', photoFileRef.current)
    await onSave(fd)
    photoFileRef.current = null
  }

  return (
    <motion.div
      variants={cardVariant}
      className="rounded-2xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--accent)' }}>Teacher Profile</h2>

      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0">
          <img
            src={photoSrc}
            alt="Teacher photo"
            className="rounded-2xl object-cover"
            style={{ width: 72, height: 72, border: '2px solid var(--border)' }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}
          >
            <Upload size={11} /> Change
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
            className="hidden" onChange={handleFileChange} />
        </div>

        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>
            WhatsApp Number
          </label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="971509298326"
            className="w-full rounded-xl py-2 px-3 text-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', outline: 'none' }}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Digits only, no spaces or dashes.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={isSaving}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
        style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1 }}
      >
        <Save size={13} />
        {isSaving ? 'Saving…' : 'Save Profile'}
      </button>
    </motion.div>
  )
}
