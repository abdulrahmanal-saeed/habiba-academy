import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useBookLaunch, useLaunchAction, useSaveLaunchSettings } from './hooks/useBookLaunch'
import { LaunchKPIStrip } from './components/LaunchKPIStrip'
import { LaunchActionButtons } from './components/LaunchActionButtons'
import { LaunchSettingsForm } from './components/LaunchSettingsForm'
import { ReadinessChecklist } from './components/ReadinessChecklist'
import { LaunchAuditLog } from './components/LaunchAuditLog'
import { cardVariant } from './animations'
import type { BookLaunchSettings } from './types'

export const BookLaunchPage: FC = () => {
  const { data, isLoading, error } = useBookLaunch()
  const launchAction = useLaunchAction()
  const saveSettings = useSaveLaunchSettings()

  if (isLoading) return <div className="p-4 small" style={{ color: 'var(--muted)' }}>Loading…</div>
  if (error || !data) return <div className="p-4 small" style={{ color: 'var(--danger)' }}>Failed to load book launch data.</div>

  function handleSave(settings: BookLaunchSettings, changeNote: string): void {
    saveSettings.mutate({ settings, changeNote })
  }

  return (
    <div className="p-3 p-md-4">
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <div className="fw-bold fs-4">Book Launch Control</div>
          <div className="small" style={{ color: 'var(--muted)' }}>
            {data.book.title_en}
          </div>
        </div>
        <Link to="/owner/book-launch/requests" className="btn btn-ghost btn-sm">
          Activation Requests
          {data.pending_requests > 0 && (
            <span
              className="badge ms-2"
              style={{ background: 'var(--danger)', color: '#fff' }}
            >
              {data.pending_requests}
            </span>
          )}
        </Link>
      </div>

      <LaunchKPIStrip data={data} />
      <LaunchActionButtons
        onAction={(action) => launchAction.mutate(action)}
        loading={launchAction.isPending}
      />

      <div className="row g-4">
        <div className="col-lg-7">
          <LaunchSettingsForm
            settings={data.settings}
            onSave={handleSave}
            loading={saveSettings.isPending}
          />
        </div>
        <div className="col-lg-5 d-grid gap-4">
          <motion.div variants={cardVariant} initial="hidden" animate="visible">
            <ReadinessChecklist items={data.readiness} />
          </motion.div>
          <motion.div variants={cardVariant} initial="hidden" animate="visible">
            <LaunchAuditLog entries={data.audit_log} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
