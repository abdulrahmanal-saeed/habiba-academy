export type VisibilityStatus =
  | 'hidden'
  | 'teacher_preview_only'
  | 'coming_soon'
  | 'launched'
  | 'paused'

export interface BookLaunchSettings {
  student_visibility_status: VisibilityStatus
  dashboard_card_enabled: boolean
  fixed_icon_enabled: boolean
  login_banner_enabled: boolean
  homework_popup_enabled: boolean
  feedback_popup_enabled: boolean
  product_page_enabled: boolean
  preview_enabled: boolean
  checkout_enabled: boolean
  locked_cta_enabled: boolean
  coming_soon_card_enabled: boolean
  marketing_notifications_enabled: boolean
  activation_notifications_enabled: boolean
  submission_feedback_notifications_enabled: boolean
  allow_existing_access_when_paused: boolean
}

export interface ReadinessItem {
  label: string
  done: boolean
}

export interface AuditLogEntry {
  id: number
  old_status: string
  new_status: string
  change_note: string
  created_at: string
}

export interface BookLaunchData {
  book: { id: number; title_en: string; title_ar: string }
  settings: BookLaunchSettings
  status_label: { en: string; ar: string; badge: string }
  active_access: number
  pending_requests: number
  readiness: ReadinessItem[]
  audit_log: AuditLogEntry[]
}

export interface BookLaunchResponse {
  ok: boolean
  data: BookLaunchData
}

export type ActivationRequestStatus = 'pending' | 'approved' | 'rejected' | 'needs_more_info'

export interface ActivationRequest {
  id: number
  student_id: number
  full_name: string
  login_code: string
  book_id: number
  book_title: string
  package_id: number
  package_title: string
  price: number
  currency: string
  payment_method: string
  payment_reference: string | null
  student_notes: string | null
  status: ActivationRequestStatus
  admin_note: string | null
  created_at: string
  approved_at: string | null
}

export interface ActivationRequestsResponse {
  ok: boolean
  data: { requests: ActivationRequest[] }
}

export interface BookLaunchActionResponse {
  ok: boolean
  data: { message: string }
}
