import { useState, type FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { BookSubmission, BookSubmissionStatus } from './types'
import { bookSubmissionsApi } from './api'
import { SubmissionList } from './components/SubmissionList'
import { SubmissionReviewDrawer } from './components/SubmissionReviewDrawer'

type StatusFilter = BookSubmissionStatus | 'all'

export const BookSubmissionsPage: FC = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQ, setSearchQ] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['book-submissions', statusFilter, searchQ],
    queryFn: () =>
      bookSubmissionsApi.getSubmissions(
        statusFilter !== 'all' ? statusFilter : undefined,
        searchQ || undefined,
      ),
  })

  const submissions: BookSubmission[] =
    data && 'submissions' in data ? (data as unknown as { submissions: BookSubmission[] }).submissions : []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-1)]">Book Submissions</h1>
        <p className="text-sm text-[var(--text-2)]">Review student interactive book submissions and send feedback</p>
      </div>

      <SubmissionList
        submissions={submissions}
        isLoading={isLoading}
        statusFilter={statusFilter}
        searchQ={searchQ}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearchQ}
        onReview={(s) => setSelectedId(s.id)}
      />

      <SubmissionReviewDrawer
        key={selectedId}
        submissionId={selectedId}
        onClose={() => setSelectedId(null)}
        onSaved={() => setSelectedId(null)}
      />
    </div>
  )
}
