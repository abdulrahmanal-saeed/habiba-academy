import { get, post } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { PricingPlan } from '../landing/types'
import type { CheckoutContactForm, CheckoutStatusResult } from './types'

export async function getPricingPlans(): Promise<PricingPlan[]> {
  const data = await get<ApiOk<{ items: PricingPlan[] }>>('/api/public/pricing')
  return data.items
}

export async function initiateCheckout(
  planSlug: string,
  contact: CheckoutContactForm,
): Promise<string> {
  const data = await post<ApiOk<{ paymentUrl: string; checkoutReference: string }>>(
    '/api/public/checkout/initiate',
    { plan_slug: planSlug, full_name: contact.name, email: contact.email, whatsapp: contact.phone },
  )
  return data.paymentUrl
}

export async function getCheckoutStatus(reference: string): Promise<CheckoutStatusResult> {
  const data = await get<ApiOk<CheckoutStatusResult>>(
    `/api/public/checkout/status.php?reference=${encodeURIComponent(reference)}`,
  )
  return data
}
