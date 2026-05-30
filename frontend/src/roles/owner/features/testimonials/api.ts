import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { TestimonialsData } from './types'

const URL = '/api/owner/testimonials.php'

export const getTestimonials = (): Promise<TestimonialsData> =>
  apiClient.get<ApiOk<TestimonialsData>>(URL).then((r) => ({
    student: r.student,
    platform: r.platform,
    public: r.public,
  }))

export const moderateTestimonial = (
  id: number,
  action: 'approve' | 'reject',
  source: 'student' | 'platform' | 'public',
): Promise<{ message: string }> => {
  const fd = new FormData()
  fd.append('action', action)
  fd.append('id', String(id))
  fd.append('source', source)
  return apiClient.postForm<ApiOk<{ message: string }>>(URL, fd).then((r) => ({ message: r.message }))
}
