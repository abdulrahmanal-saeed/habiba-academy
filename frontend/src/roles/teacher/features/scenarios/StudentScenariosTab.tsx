import { useState, type FC } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'
import { stagger, listItem } from '@/design-system/animations'
import { scenariosApi } from './api'
import { ScenarioList } from './components/ScenarioList'
import { ScenarioCreateDrawer } from './components/ScenarioCreateDrawer'

interface Props {
  studentId: number
}

type Panel = 'scenarios' | 'recordings'

export const StudentScenariosTab: FC<Props> = ({ studentId }) => {
  const qc = useQueryClient()
  const [panel, setPanel] = useState<Panel>('scenarios')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data: scenariosData, isLoading: scenariosLoading } = useQuery({
    queryKey: ['student-scenarios', studentId],
    queryFn:  () => scenariosApi.getStudentScenarios(studentId),
  })

  const { data: conversationsData, isLoading: recordingsLoading } = useQuery({
    queryKey: ['student-conversations', studentId],
    queryFn:  () => scenariosApi.getStudentConversations(studentId),
    enabled:  panel === 'recordings',
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => scenariosApi.deleteScenario(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['student-scenarios', studentId] }),
  })

  const scenarios    = scenariosData?.scenarios     ?? []
  const recordings   = conversationsData?.conversations ?? []

  return (
    <div className="space-y-4">
      {/* Tab toggle */}
      <div className="flex gap-2">
        {(['scenarios', 'recordings'] as Panel[]).map((p) => (
          <button
            key={p}
            onClick={() => setPanel(p)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              panel === p
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)]'
            }`}
          >
            {p === 'scenarios' ? 'Scenarios' : 'Recordings'}
          </button>
        ))}
      </div>

      {panel === 'scenarios' && (
        <ScenarioList
          scenarios={scenarios}
          onNew={() => setDrawerOpen(true)}
          onDelete={(id) => deleteMutation.mutate(id)}
          isLoading={scenariosLoading}
        />
      )}

      {panel === 'recordings' && (
        recordingsLoading ? (
          <div className="py-8 text-center text-sm text-[var(--text-3)]">Loading…</div>
        ) : recordings.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--text-3)]">No recordings yet</p>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-3">
            {recordings.map((r) => (
              <motion.div
                key={r.id}
                variants={listItem}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4"
              >
                <div className="mb-2 flex items-start gap-2">
                  <Mic size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-1)]">{r.title}</div>
                    <div className="text-xs text-[var(--text-2)]">
                      {r.sc_date} · Take {r.take_number}
                      {r.submitted_at && ` · ${r.submitted_at}`}
                    </div>
                  </div>
                </div>

                {r.audio_src && (
                  <audio controls src={r.audio_src} className="mt-2 h-8 w-full" />
                )}

                {r.chips.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.chips.map((chip, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs text-[var(--accent)]"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}

                {r.teacher_note && (
                  <p className="mt-2 text-xs italic text-[var(--text-3)]">{r.teacher_note}</p>
                )}
              </motion.div>
            ))}
          </motion.div>
        )
      )}

      <ScenarioCreateDrawer
        studentId={studentId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
