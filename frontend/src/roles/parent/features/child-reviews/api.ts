import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { ChildReviewsData } from './types'

export const fetchChildReviews = async (childId: number): Promise<ChildReviewsData> => {
  const res = await apiClient.get<ApiOk<ChildReviewsData>>(
    `/api/parent/child-reviews?id=${childId}`,
  )
  return { child: res.child, reviews: res.reviews }
}
