import { useState, type FC } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cardVariant } from './animations'
import { AcademyForm } from './components/AcademyForm'
import { AcademiesTable } from './components/AcademiesTable'
import { useAcademies, useStudentOptions, useSaveAcademy, useDeleteAcademy } from './hooks/useAcademies'
import type { Academy } from './types'

const AcademiesPage: FC = () => {
  const { data: academies = [], isLoading } = useAcademies()
  const { data: students = [] } = useStudentOptions()
  const saveAcademy = useSaveAcademy()
  const deleteAcademy = useDeleteAcademy()
  const [editing, setEditing] = useState<Academy | null>(null)

  function handleSubmit(form: FormData): void {
    saveAcademy.mutate(form, { onSuccess: () => setEditing(null) })
  }

  return (
    <div className="dash-content">
      <motion.div variants={cardVariant} initial="hidden" animate="visible" className="mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div className="fw-bold fs-4">Academies</div>
            <div className="small" style={{ color: 'var(--muted)' }}>
              Manage external academy partners and linked students.
            </div>
          </div>
          <Link to="/owner/academy-briefs" className="btn btn-ghost btn-sm">
            Academy Briefs
          </Link>
        </div>
      </motion.div>

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <AcademyForm
            students={students}
            editing={editing}
            onSubmit={handleSubmit}
            onCancel={editing ? () => setEditing(null) : undefined}
            loading={saveAcademy.isPending}
          />
          {saveAcademy.isError && (
            <div className="alert alert-danger mt-2">
              {(saveAcademy.error as Error).message}
            </div>
          )}
        </div>

        <div className="col-12 col-xl-7">
          <motion.div variants={cardVariant} initial="hidden" animate="visible"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}
          >
            <div className="fw-bold fs-5 mb-3">
              Academy Records
              {academies.length > 0 && (
                <span className="ms-2 badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  {academies.length}
                </span>
              )}
            </div>
            {isLoading ? (
              <div style={{ color: 'var(--muted)' }}>Loading…</div>
            ) : (
              <AcademiesTable
                academies={academies}
                onEdit={(a) => setEditing(a)}
                onDelete={(id) => {
                  deleteAcademy.mutate(id)
                  if (editing?.id === id) setEditing(null)
                }}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AcademiesPage
