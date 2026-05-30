import { useState, type FC } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CourseMaterial } from './types'
import { materialsApi } from './api'
import { MaterialList } from './components/MaterialList'
import { MaterialFormDrawer } from './components/MaterialFormDrawer'

interface Props {
  studentId: number
}

export const StudentMaterialsTab: FC<Props> = ({ studentId }) => {
  const qc = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editMaterial, setEditMaterial] = useState<CourseMaterial | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['student-materials', studentId],
    queryFn: () => materialsApi.getStudentMaterials(studentId),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => materialsApi.deleteMaterial(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student-materials', studentId] }),
  })

  const handleAdd = () => {
    setEditMaterial(null)
    setDrawerOpen(true)
  }

  const handleEdit = (m: CourseMaterial) => {
    setEditMaterial(m)
    setDrawerOpen(true)
  }

  const handleClose = () => {
    setDrawerOpen(false)
    setEditMaterial(null)
  }

  const handleSaved = () => {
    setDrawerOpen(false)
    setEditMaterial(null)
  }

  return (
    <>
      <MaterialList
        materials={data?.items ?? []}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
      <MaterialFormDrawer
        key={editMaterial ? editMaterial.id : 'new'}
        isOpen={drawerOpen}
        material={editMaterial}
        studentId={studentId}
        onClose={handleClose}
        onSaved={handleSaved}
      />
    </>
  )
}
