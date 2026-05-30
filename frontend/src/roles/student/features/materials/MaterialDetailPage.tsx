import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { Spinner } from '@/design-system/components'
import { fadeInUp } from '@/design-system/animations'
import { getMaterialDetail, markProgress } from './api'
import { MaterialViewer } from './components/MaterialViewer'
import { MarkCompleteButton } from './components/MarkCompleteButton'
import { ProgressBadge } from './components/ProgressBadge'
import { MATERIAL_TYPES, MATERIAL_CATEGORIES, deriveProgressStatus } from './utils'

export const MaterialDetailPage: FC = () => {
  const { id }      = useParams<{ id: string }>()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const materialId  = Number(id)

  const { data, isLoading, error } = useQuery({
    queryKey: ['student-material', materialId],
    queryFn: () => getMaterialDetail(materialId),
    enabled: !!materialId,
  })

  // Backend auto-marks viewed in material-detail.php; invalidate list so status syncs back
  useEffect(() => {
    if (data) {
      void queryClient.invalidateQueries({ queryKey: ['student-materials'] })
    }
  }, [data, queryClient])

  async function handleComplete(): Promise<void> {
    await markProgress(materialId, 'complete')
    void queryClient.invalidateQueries({ queryKey: ['student-material', materialId] })
    void queryClient.invalidateQueries({ queryKey: ['student-materials'] })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 p-4 text-center"
           style={{ background: 'var(--bg)' }}>
        <p className="text-sm" style={{ color: 'var(--danger)' }}>Material not found.</p>
        <button type="button" onClick={() => navigate('/student/materials')}
                className="text-sm underline" style={{ color: 'var(--accent)' }}>
          Back to materials
        </button>
      </div>
    )
  }

  const status    = deriveProgressStatus(data.viewed_at, data.completed_at)
  const typeLabel = MATERIAL_TYPES[data.type] ?? data.type
  const catLabel  = data.category ? (MATERIAL_CATEGORIES[data.category] ?? data.category) : null
  const canDownload = data.allow_download === 1 && (data.is_file || !!data.href)
  const showDesc  = !!data.description && data.type !== 'article' && data.type !== 'mixed'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4">

        <motion.div variants={fadeInUp} initial="hidden" animate="visible"
                    className="flex items-start gap-3">
          <button type="button" onClick={() => navigate('/student/materials')}
                  aria-label="Back to materials"
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-1"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}>
            <ArrowLeft size={16} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-xl leading-snug" style={{ color: 'var(--fg)' }}>
              {data.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border-soft)' }}>
                {typeLabel}
              </span>
              {catLabel && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  {catLabel}
                </span>
              )}
              {data.level && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border-soft)' }}>
                  {data.level}
                </span>
              )}
              {data.estimated_study_minutes > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border-soft)' }}>
                  {data.estimated_study_minutes} min
                </span>
              )}
              <ProgressBadge status={status} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 mt-1">
            {canDownload && (
              <a href={`/student/material-download.php?id=${data.id}`}
                 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                 style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}>
                <Download size={13} /> Download
              </a>
            )}
            <MarkCompleteButton isCompleted={status === 'completed'} onComplete={handleComplete} />
          </div>
        </motion.div>

        {showDesc && (
          <motion.div variants={fadeInUp} initial="hidden" animate="visible"
                      className="rounded-xl p-5"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-sm leading-relaxed"
               style={{ color: 'var(--fg)', whiteSpace: 'pre-wrap' }}>
              {data.description}
            </p>
          </motion.div>
        )}

        <motion.div variants={fadeInUp} initial="hidden" animate="visible"
                    className="rounded-xl p-5"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <MaterialViewer material={data} />
        </motion.div>

      </div>
    </div>
  )
}
