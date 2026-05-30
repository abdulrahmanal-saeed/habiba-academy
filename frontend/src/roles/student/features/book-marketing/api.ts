import { get, post } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { BookProductData } from './types'

export async function getBookProduct(): Promise<BookProductData> {
  const res = await get<ApiOk<BookProductData>>('/api/student/book-product.php')
  return res
}

export async function submitBookCheckout(data: {
  packageId: number
  paymentMethod: string
  paymentReference: string
  studentNotes: string
}): Promise<number> {
  const res = await post<ApiOk<{ requestId: number }>>('/api/student/book-checkout.php', {
    package_id:        data.packageId,
    payment_method:    data.paymentMethod,
    payment_reference: data.paymentReference,
    student_notes:     data.studentNotes,
  })
  return res.requestId
}
