export type PaymentStatus = 'pending' | 'pending_verification' | 'paid' | 'failed' | 'refunded'

export interface CheckoutOrder {
  id: number
  checkout_reference: string
  full_name: string
  email: string
  whatsapp: string
  selected_plan: string
  amount_aed: number
  payment_status: PaymentStatus
  learner_type: string
  main_goal: string
  policy_agreed: boolean
  policy_agreed_at: string
  student_form_status: string
  level_check_status: string
  schedule_status: string
  teacher_review_status: string
  payment_provider: string
  payment_reference: string
  created_at: string
}

export interface PaymentRecord {
  id: number
  checkout_order_id: number
  provider: string
  provider_reference: string
  status: string
  amount_aed: number
  created_at: string
  updated_at: string
}

export interface AuditLogEntry {
  id: number
  entity_type: string
  entity_id: number
  action: string
  old_value: string
  new_value: string
  created_at: string
}

export interface PaymentsListResponse {
  ok: boolean
  data: {
    orders: CheckoutOrder[]
    stats: Record<PaymentStatus, number>
    total: number
  }
}

export interface PaymentDetailResponse {
  ok: boolean
  data: {
    order: CheckoutOrder
    payment_records: PaymentRecord[]
    audit_logs: AuditLogEntry[]
  }
}

export interface UpdateStatusPayload {
  action: 'update_status'
  id: number
  payment_status: PaymentStatus
}

export interface CheckZiinaPayload {
  action: 'check_ziina'
  id: number
}

export interface ActionResponse {
  ok: boolean
  data: { message: string; status?: string }
}

export interface PaymentsFilters {
  status: PaymentStatus | ''
  q: string
}
