export interface CheckoutContactForm {
  name: string
  email: string
  phone: string
}

export interface CheckoutOrder {
  checkoutReference: string
  selectedPlan: string
  fullName: string
  email: string
  paymentStatus: string
  amountAed: number
  createdAt: string
}

export interface CheckoutStatusResult {
  status: 'paid' | 'failed' | 'pending_verification' | 'pending' | string
  order: CheckoutOrder
}
