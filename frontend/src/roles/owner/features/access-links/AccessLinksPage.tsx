import type { FC } from 'react'
import { useAccessLinks } from './hooks/useAccessLinks'
import { AccessLinkGroup } from './components/AccessLinkGroup'

export const AccessLinksPage: FC = () => {
  const { data, isLoading, error } = useAccessLinks()

  if (isLoading) return <div className="p-4 small" style={{ color: 'var(--muted)' }}>Loading…</div>
  if (error || !data) return <div className="p-4 small" style={{ color: 'var(--danger)' }}>Failed to load access links.</div>

  return (
    <div className="p-3 p-md-4">
      <div className="fw-bold fs-4 mb-1">Access Links</div>
      <div className="small mb-4" style={{ color: 'var(--muted)' }}>
        Copy portal login URLs and access codes for all portal users
      </div>

      <AccessLinkGroup
        title="Academies"
        entries={data.academies}
        loginUrl={data.login_urls.academy}
      />
      <AccessLinkGroup
        title="Parents"
        entries={data.parents}
        loginUrl={data.login_urls.parent}
      />
      <AccessLinkGroup
        title="Media Buyers"
        entries={data.media_buyers}
        loginUrl={data.login_urls.media_buyer}
      />
    </div>
  )
}
