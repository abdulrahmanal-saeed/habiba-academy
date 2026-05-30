import { useState } from 'react'
import type { FC } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { getLessonPlan, saveSession, setSessionStatus, saveContract } from './api'
import { ContractCard } from './components/ContractCard'
import { StatsCard } from './components/StatsCard'
import { SkillBalanceBar } from './components/SkillBalanceBar'
import { SessionList } from './components/SessionList'
import { SessionEditDrawer } from './components/SessionEditDrawer'
import type { LessonPlanSession, SessionStatus, SessionSavePayload, ContractSavePayload } from './types'

export const LessonPlanningPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const studentId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lesson-plan', studentId],
    queryFn: () => getLessonPlan(studentId),
    enabled: studentId > 0,
  })

  const [editingSession, setEditingSession] = useState<LessonPlanSession | null>(null)

  const contractMutation = useMutation({
    mutationFn: (payload: ContractSavePayload) => saveContract(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['lesson-plan', studentId] }),
  })

  const sessionSaveMutation = useMutation({
    mutationFn: (payload: SessionSavePayload) => saveSession(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lesson-plan', studentId] })
      setEditingSession(null)
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({
      sId, status, extra,
    }: { sId: number; status: SessionStatus; extra?: { actual_date?: string; planned_date?: string } }) =>
      setSessionStatus({ id: sId, status, ...(extra ?? {}) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['lesson-plan', studentId] }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm" style={{ color: 'var(--danger)' }}>Failed to load lesson plan.</p>
      </div>
    )
  }

  return (
    <>
      <motion.div
        variants={fadeInUp} initial="hidden" animate="visible"
        className="flex flex-col gap-4 p-4 max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-base font-bold" style={{ color: 'var(--fg)' }}>Lesson Plan</h1>
        </div>

        {/* Contract — key resets form when contract saves */}
        <ContractCard
          key={data.contract?.updated_at ?? 'new'}
          contract={data.contract}
          studentId={studentId}
          isSaving={contractMutation.isPending}
          onSave={payload => contractMutation.mutate(payload)}
        />

        {/* Stats + Skills */}
        {data.stats && (
          <>
            <StatsCard stats={data.stats} />
            {data.stats.skill_balance.length > 0 && (
              <SkillBalanceBar skills={data.stats.skill_balance} />
            )}
          </>
        )}

        {/* Session list */}
        <SessionList sessions={data.sessions} onEdit={setEditingSession} />
      </motion.div>

      {/* Edit drawer — key forces remount per session (avoids useEffect setState) */}
      <AnimatePresence>
        {editingSession && (
          <SessionEditDrawer
            key={editingSession.id}
            session={editingSession}
            isSaving={sessionSaveMutation.isPending}
            isStatusLoading={statusMutation.isPending}
            onClose={() => setEditingSession(null)}
            onSave={payload => sessionSaveMutation.mutate(payload)}
            onSetStatus={(sId, status, extra) =>
              statusMutation.mutate({ sId, status, extra })
            }
          />
        )}
      </AnimatePresence>
    </>
  )
}
