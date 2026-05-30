import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { ChildMaterialsData } from './types'

export const fetchChildMaterials = async (childId: number): Promise<ChildMaterialsData> => {
  const res = await apiClient.get<ApiOk<ChildMaterialsData>>(
    `/api/parent/child-materials?id=${childId}`,
  )
  return { child: res.child, materials: res.materials }
}
