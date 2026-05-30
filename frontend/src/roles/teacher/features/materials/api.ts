import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { CourseMaterial, MaterialSavePayload } from './types'

export const materialsApi = {
  getStudentMaterials: (studentId: number) =>
    apiClient.get<ApiOk<{ items: CourseMaterial[] }>>(
      `/api/teacher/student-materials.php?student_id=${studentId}`,
    ),

  saveMaterial: (payload: MaterialSavePayload, file?: File) => {
    const fd = new FormData()
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v))
    })
    if (file) fd.append('material_file', file)
    return apiClient.postForm<ApiOk<{ id: number }>>(
      '/api/teacher/materials-save.php',
      fd,
    )
  },

  deleteMaterial: (id: number) =>
    apiClient.postForm<ApiOk<{ archived?: boolean; deleted?: boolean }>>(
      '/api/teacher/materials-delete.php',
      { id },
    ),
}
