import { useState, type FC } from 'react'
import { Link } from 'react-router-dom'
import {
  useActivationRequests,
  useApproveRequest,
  useRejectRequest,
  useNeedsMoreInfo,
} from './hooks/useActivationRequests'
import { ActivationRequestsTable } from './components/ActivationRequestsTable'
import { RequestActionDrawer } from './components/RequestActionDrawer'
import type { ActivationRequest, ActivationRequestStatus } from './types'

const STATUS_FILTERS: { label: string; value: ActivationRequestStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Needs Info', value: 'needs_more_info' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

export const BookActivationRequestsPage: FC = () => {
  const [statusFilter, setStatusFilter] = useState<ActivationRequestStatus | 'all'>('pending')
  const [reviewing, setReviewing] = useState<ActivationRequest | null>(null)

  const { data: res, isLoading } = useActivationRequests(statusFilter === 'all' ? undefined : statusFilter)
  const approve = useApproveRequest()
  const reject = useRejectRequest()
  const needsInfo = useNeedsMoreInfo()

  const anyLoading = approve.isPending || reject.isPending || needsInfo.isPending

  return (
    <div className="p-3 p-md-4">
      <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
        <Link to="/owner/book-launch" className="btn btn-ghost btn-sm">
          ← Back
        </Link>
        <div className="fw-bold fs-4">Activation Requests</div>
      </div>

      <div className="d-flex gap-2 flex-wrap mb-3">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className="btn btn-sm"
            style={{
              background: statusFilter === f.value ? 'var(--accent)' : 'var(--surface)',
              color: statusFilter === f.value ? '#fff' : 'var(--text)',
              border: '1px solid var(--border)',
            }}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="small py-4 text-center" style={{ color: 'var(--muted)' }}>Loading…</div>
      ) : (
        <ActivationRequestsTable
          requests={res ?? []}
          onReview={setReviewing}
        />
      )}

      <RequestActionDrawer
        request={reviewing}
        onClose={() => setReviewing(null)}
        onApprove={(id, note) => approve.mutate({ id, note })}
        onReject={(id, note) => reject.mutate({ id, note })}
        onNeedsInfo={(id, note) => needsInfo.mutate({ id, note })}
        loading={anyLoading}
      />
    </div>
  )
}
