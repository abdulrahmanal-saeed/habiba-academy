import { useState, type FC } from 'react'
import { motion } from 'framer-motion'
import type { BookLaunchSettings, VisibilityStatus } from '../types'
import { SettingsToggleGroup } from './SettingsToggleGroup'
import { cardVariant } from '../animations'

const VISIBILITY_OPTIONS: { value: VisibilityStatus; label: string }[] = [
  { value: 'hidden', label: 'Hidden from students' },
  { value: 'teacher_preview_only', label: 'Teacher Preview Only' },
  { value: 'coming_soon', label: 'Coming Soon' },
  { value: 'launched', label: 'Launched' },
  { value: 'paused', label: 'Paused' },
]

interface Props {
  settings: BookLaunchSettings
  onSave: (settings: BookLaunchSettings, changeNote: string) => void
  loading?: boolean
}

export const LaunchSettingsForm: FC<Props> = ({ settings, onSave, loading }) => {
  const [local, setLocal] = useState<BookLaunchSettings>(settings)
  const [note, setNote] = useState('')

  function toggle(key: string, value: boolean): void {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }

  const marketing = [
    { key: 'dashboard_card_enabled',  label: 'Dashboard Card' },
    { key: 'fixed_icon_enabled',      label: 'Fixed Dashboard Icon' },
    { key: 'login_banner_enabled',    label: 'Login Banner' },
    { key: 'homework_popup_enabled',  label: 'Homework Submit Popup' },
    { key: 'feedback_popup_enabled',  label: 'Feedback Popup' },
    { key: 'locked_cta_enabled',      label: 'Locked Lesson CTA' },
  ].map((i) => ({ ...i, value: local[i.key as keyof BookLaunchSettings] as boolean }))

  const sales = [
    { key: 'product_page_enabled',             label: 'Product Landing Page' },
    { key: 'preview_enabled',                  label: 'Preview Lesson 1' },
    { key: 'checkout_enabled',                 label: 'Checkout / Request Activation' },
    { key: 'allow_existing_access_when_paused', label: 'Allow Existing Access When Paused' },
  ].map((i) => ({ ...i, value: local[i.key as keyof BookLaunchSettings] as boolean }))

  const notifications = [
    { key: 'coming_soon_card_enabled',                   label: 'Coming Soon Card' },
    { key: 'marketing_notifications_enabled',            label: 'Book Marketing Notifications' },
    { key: 'activation_notifications_enabled',           label: 'Activation Request Notifications' },
    { key: 'submission_feedback_notifications_enabled',  label: 'Submission / Feedback Notifications' },
  ].map((i) => ({ ...i, value: local[i.key as keyof BookLaunchSettings] as boolean }))

  return (
    <motion.div
      variants={cardVariant} initial="hidden" animate="visible"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}
    >
      <div className="fw-bold fs-5 mb-3">Visibility Settings</div>
      <div className="mb-4">
        <label className="form-label">Student Visibility</label>
        <select
          className="form-select"
          value={local.student_visibility_status}
          onChange={(e) => setLocal((p) => ({ ...p, student_visibility_status: e.target.value as VisibilityStatus }))}
        >
          {VISIBILITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <SettingsToggleGroup title="Marketing Components" items={marketing} onChange={toggle} />
      <SettingsToggleGroup title="Sales / Access Components" items={sales} onChange={toggle} />
      <SettingsToggleGroup title="Notifications" items={notifications} onChange={toggle} />
      <div className="mt-3">
        <label className="form-label">Change note (optional)</label>
        <input
          className="form-control" placeholder="Reason for this change…"
          value={note} onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <motion.button
        type="button" className="btn btn-app mt-3" disabled={loading}
        whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
        onClick={() => onSave(local, note)}
      >
        {loading ? 'Saving…' : 'Save Launch Settings'}
      </motion.button>
    </motion.div>
  )
}
