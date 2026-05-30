import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewsApi } from './api'
import { ReviewList } from './components/ReviewList'
import { ReviewCreateDrawer } from './components/ReviewCreateDrawer'
import { GradeDrawer } from './components/GradeDrawer'
import type { ReviewListItem } from './types'

interface StudentReviewsTabProps {
  studentId: number
}

export const StudentReviewsTab: FC<StudentReviewsTabProps> = ({ studentId }) => {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ReviewListItem | null>(null)
  const [grading, setGrading] = useState<ReviewListItem | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-reviews', studentId],
    queryFn: () => reviewsApi.getStudentReviews(studentId),
  })

  const { mutate: deleteReview } = useMutation({
    mutationFn: (item: ReviewListItem) =>
      item.submission_id
        ? reviewsApi.forceDeleteReview(item.id)
        : reviewsApi.deleteReview(item.id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['student-reviews', studentId] }),
  })

  const handleDelete = (item: ReviewListItem) => {
    const msg = item.submission_id
      ? `Force-delete "${item.title}" and its submission? This cannot be undone.`
      : `Delete "${item.title}"?`
    if (!window.confirm(msg)) return
    deleteReview(item)
  }

  const handleEdit = (item: ReviewListItem) => {
    setEditing(item)
    setCreating(true)
  }

  const handleGrade = (item: ReviewListItem) => {
    setGrading(item)
  }

  const handleNewReview = () => {
    setEditing(null)
    setCreating(true)
  }

  const closeCreate = () => {
    setCreating(false)
    setEditing(null)
  }

  if (isLoading) {
    return <div className="py-10 text-center text-sm text-[var(--text-3)]">Loading reviews…</div>
  }

  if (isError) {
    return <div className="py-10 text-center text-sm text-red-500">Failed to load reviews.</div>
  }

  const items = data?.items ?? []

  return (
    <div>
      <ReviewList
        items={items}
        onNewReview={handleNewReview}
        onEdit={handleEdit}
        onGrade={handleGrade}
        onDelete={handleDelete}
      />

      <AnimatePresence>
        {creating && (
          <ReviewCreateDrawer
            key={editing?.id ?? 'new'}
            studentId={studentId}
            editing={editing}
            onClose={closeCreate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {grading?.submission_id && (
          <GradeDrawer
            key={grading.submission_id}
            studentId={studentId}
            submissionId={grading.submission_id}
            onClose={() => setGrading(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
