import type { FC } from 'react'
import { useParents, useStudentOptions, useSaveParent, useDeleteParent } from './hooks/useParents'
import { ParentForm } from './components/ParentForm'
import { ParentsTable } from './components/ParentsTable'
import type { ParentSavePayload } from './types'

export const ParentsPage: FC = () => {
  const { data: parents, isLoading } = useParents()
  const { data: students } = useStudentOptions()
  const save = useSaveParent()
  const del = useDeleteParent()

  function handleSave(payload: ParentSavePayload): void {
    save.mutate(payload)
  }

  return (
    <div className="p-3 p-md-4">
      <div className="fw-bold fs-4 mb-1">Parents</div>
      <div className="small mb-4" style={{ color: 'var(--muted)' }}>
        Link parent accounts to one or more students
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <ParentForm
            students={students ?? []}
            onSave={handleSave}
            loading={save.isPending}
          />
        </div>
        <div className="col-lg-7">
          <div
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '1rem', padding: '1.5rem',
            }}
          >
            <div className="fw-bold fs-5 mb-3">Parent Records</div>
            {isLoading ? (
              <div className="small py-4 text-center" style={{ color: 'var(--muted)' }}>Loading…</div>
            ) : (
              <ParentsTable
                parents={parents ?? []}
                onDelete={(id) => del.mutate(id)}
                loading={del.isPending}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
