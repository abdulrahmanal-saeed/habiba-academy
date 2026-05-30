import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { ChildBookData } from './types'

export const fetchChildBook = async (childId: number): Promise<ChildBookData> => {
  const res = await apiClient.get<ApiOk<ChildBookData>>(
    `/api/parent/child-book?id=${childId}`,
  )
  return { child: res.child, books: res.books }
}
