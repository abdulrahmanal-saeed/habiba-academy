import type { FC } from 'react'
import { useAISettings, useSaveAISettings, useTestConnection } from './hooks/useAISettings'
import { AIConnectionCard } from './components/AIConnectionCard'
import { AISettingsForm } from './components/AISettingsForm'
import type { AISettings } from './types'

export const AISettingsPage: FC = () => {
  const { data, isLoading, error } = useAISettings()
  const save = useSaveAISettings()
  const test = useTestConnection()

  if (isLoading) return <div className="p-4 small" style={{ color: 'var(--muted)' }}>Loading…</div>
  if (error || !data) return <div className="p-4 small" style={{ color: 'var(--danger)' }}>Failed to load AI settings.</div>

  function handleSave(settings: AISettings): void {
    save.mutate(settings)
  }

  return (
    <div className="p-3 p-md-4" style={{ maxWidth: 760 }}>
      <div className="fw-bold fs-4 mb-1">AI Settings</div>
      <div className="small mb-4" style={{ color: 'var(--muted)' }}>
        Provider, model, daily limits, and cost estimates
      </div>

      <AIConnectionCard
        data={data}
        onTest={() => test.mutate()}
        loading={test.isPending}
      />

      <AISettingsForm
        settings={data.settings}
        onSave={handleSave}
        loading={save.isPending}
      />
    </div>
  )
}
