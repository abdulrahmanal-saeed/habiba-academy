import { get, postForm } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { MaterialListItem, MaterialDetail } from './types'

export async function getMaterials(): Promise<MaterialListItem[]> {
  const res = await get<ApiOk<{ items: MaterialListItem[] }>>('/api/student/materials.php')
  return res.items
}

export async function getMaterialDetail(id: number): Promise<MaterialDetail> {
  const res = await get<ApiOk<{ data: MaterialDetail }>>(
    `/api/student/material-detail.php?id=${id}`,
  )
  return res.data
}

export async function markProgress(
  id: number,
  action: 'view' | 'complete',
): Promise<void> {
  const fd = new FormData()
  fd.append('id', String(id))
  fd.append('action', action)
  await postForm<{ ok: boolean }>('/api/student/material-progress.php', fd)
}
