import { useState } from 'react'
import type { FC } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Save, Zap } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { getSchedule, saveScheduleDay, generateMonthSessions } from '../api'
import type { ScheduleSlot } from '../types'

const DAY_LABELS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const DEFAULT_SLOT = (studentId: number, day: number): ScheduleSlot => ({
  id: 0,
  student_id: studentId,
  day_of_week: day,
  session_time: '16:00:00',
  duration_minutes: 60,
  price_override: null,
  is_active: 0,
  updated_at: null,
})

interface ScheduleTabProps {
  studentId: number
}

export const ScheduleTab: FC<ScheduleTabProps> = ({ studentId }) => {
  const qc = useQueryClient()

  const [genMonth, setGenMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [genResult, setGenResult] = useState<{ created: number; updated: number; skipped_duplicates: number; skipped_conflicts: number } | null>(null)
  const [saving, setSaving] = useState<number | null>(null)

  const { data: serverSlots = [], isLoading } = useQuery({
    queryKey: ['student-schedule', studentId],
    queryFn: () => getSchedule(studentId),
  })

  const [localSlots, setLocalSlots] = useState<ScheduleSlot[]>([])
  const [slotsDirty, setSlotsDirty] = useState(false)

  const slots: ScheduleSlot[] = slotsDirty
    ? localSlots
    : [0, 1, 2, 3, 4, 5, 6].map(
        (day) => serverSlots.find((s) => s.day_of_week === day) ?? DEFAULT_SLOT(studentId, day),
      )

  function initLocal() {
    if (!slotsDirty) {
      setLocalSlots([0, 1, 2, 3, 4, 5, 6].map(
        (day) => serverSlots.find((s) => s.day_of_week === day) ?? DEFAULT_SLOT(studentId, day),
      ))
      setSlotsDirty(true)
    }
  }

  function updateSlot(day: number, patch: Partial<ScheduleSlot>) {
    initLocal()
    setLocalSlots((prev) =>
      prev.map((s) => (s.day_of_week === day ? { ...s, ...patch } : s)),
    )
  }

  async function saveSlot(day: number) {
    const s = slots[day]
    if (!s) return
    setSaving(day)
    try {
      await saveScheduleDay(
        studentId, day, s.session_time, s.duration_minutes, s.price_override, !!s.is_active,
      )
      void qc.invalidateQueries({ queryKey: ['student-schedule', studentId] })
    } finally {
      setSaving(null)
    }
  }

  const genMutation = useMutation({
    mutationFn: () => generateMonthSessions(studentId, genMonth),
    onSuccess: (res) => setGenResult(res),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-col gap-4">
      {/* 7-day rows */}
      <div className="flex flex-col gap-2">
        {slots.map((slot) => (
          <div
            key={slot.day_of_week}
            className="rounded-2xl px-4 py-3"
            style={{
              background: 'var(--surface)',
              border: `1px solid ${slot.is_active ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!slot.is_active}
                  onChange={(e) => updateSlot(slot.day_of_week, { is_active: e.target.checked ? 1 : 0 })}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span className="text-sm font-semibold" style={{ color: 'var(--fg)', minWidth: 80 }}>
                  {DAY_LABELS[slot.day_of_week]}
                </span>
              </label>

              <input
                type="time"
                value={slot.session_time.slice(0, 5)}
                onChange={(e) => updateSlot(slot.day_of_week, { session_time: e.target.value + ':00' })}
                disabled={!slot.is_active}
                className="rounded-lg px-2 py-1 text-sm"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--fg)',
                  opacity: slot.is_active ? 1 : 0.4,
                }}
              />

              <select
                value={slot.duration_minutes}
                onChange={(e) => updateSlot(slot.day_of_week, { duration_minutes: Number(e.target.value) })}
                disabled={!slot.is_active}
                className="rounded-lg px-2 py-1 text-sm"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--fg)',
                  opacity: slot.is_active ? 1 : 0.4,
                }}
              >
                {[30, 45, 60, 75, 90, 120].map((m) => (
                  <option key={m} value={m}>{m} min</option>
                ))}
              </select>

              <button
                type="button"
                disabled={saving === slot.day_of_week}
                onClick={() => saveSlot(slot.day_of_week)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ms-auto"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: 'none', cursor: 'pointer' }}
              >
                <Save size={12} />
                {saving === slot.day_of_week ? '…' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Generate sessions */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--fg)' }}>Generate Month Sessions</h3>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={genMonth}
            onChange={(e) => setGenMonth(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm flex-1"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}
          />
          <button
            type="button"
            disabled={genMutation.isPending}
            onClick={() => { setGenResult(null); genMutation.mutate() }}
            className="rounded-xl px-4 py-2 text-sm font-semibold"
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            {genMutation.isPending ? 'Generating…' : 'Generate'}
          </button>
        </div>
        {genResult && (
          <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
            Created {genResult.created}, updated {genResult.updated}, skipped {genResult.skipped_duplicates + genResult.skipped_conflicts}
          </p>
        )}
        {genMutation.isError && (
          <p className="text-xs mt-2" style={{ color: 'var(--error)' }}>Failed to generate sessions.</p>
        )}
      </div>
    </motion.div>
  )
}
