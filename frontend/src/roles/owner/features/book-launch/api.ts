import { apiClient } from '@/core/lib/apiClient'
import type {
  BookLaunchData, ActivationRequest, BookLaunchSettings,
  BookLaunchResponse, ActivationRequestsResponse, BookLaunchActionResponse,
} from './types'

const URL = '/api/owner/book-launch'

export function getBookLaunchData(): Promise<BookLaunchData> {
  return apiClient.get<BookLaunchResponse>(URL).then((r) => r.data)
}

export function getActivationRequests(status?: string): Promise<ActivationRequest[]> {
  return apiClient
    .get<ActivationRequestsResponse>(URL, { params: { sub: 'requests', ...(status ? { status } : {}) } })
    .then((r) => r.data.requests)
}

export function launchBook(action: 'launch' | 'hide' | 'pause'): Promise<BookLaunchActionResponse['data']> {
  const fd = new FormData()
  fd.append('action', action)
  return apiClient.postForm<BookLaunchActionResponse>(URL, fd).then((r) => r.data)
}

export function saveBookLaunchSettings(
  settings: BookLaunchSettings,
  changeNote: string,
): Promise<BookLaunchActionResponse['data']> {
  const fd = new FormData()
  fd.append('action', 'save')
  fd.append('student_visibility_status', settings.student_visibility_status)
  fd.append('change_note', changeNote)
  const boolFields: (keyof BookLaunchSettings)[] = [
    'dashboard_card_enabled','fixed_icon_enabled','login_banner_enabled',
    'homework_popup_enabled','feedback_popup_enabled','product_page_enabled',
    'preview_enabled','checkout_enabled','locked_cta_enabled','coming_soon_card_enabled',
    'marketing_notifications_enabled','activation_notifications_enabled',
    'submission_feedback_notifications_enabled','allow_existing_access_when_paused',
  ]
  boolFields.forEach((k) => { if (settings[k]) fd.append(k, '1') })
  return apiClient.postForm<BookLaunchActionResponse>(URL, fd).then((r) => r.data)
}

export function approveRequest(requestId: number, adminNote: string): Promise<BookLaunchActionResponse['data']> {
  const fd = new FormData()
  fd.append('action', 'approve_request')
  fd.append('request_id', String(requestId))
  fd.append('admin_note', adminNote)
  return apiClient.postForm<BookLaunchActionResponse>(URL, fd).then((r) => r.data)
}

export function rejectRequest(requestId: number, adminNote: string): Promise<BookLaunchActionResponse['data']> {
  const fd = new FormData()
  fd.append('action', 'reject_request')
  fd.append('request_id', String(requestId))
  fd.append('admin_note', adminNote)
  return apiClient.postForm<BookLaunchActionResponse>(URL, fd).then((r) => r.data)
}

export function needsMoreInfo(requestId: number, adminNote: string): Promise<BookLaunchActionResponse['data']> {
  const fd = new FormData()
  fd.append('action', 'needs_more_info')
  fd.append('request_id', String(requestId))
  fd.append('admin_note', adminNote)
  return apiClient.postForm<BookLaunchActionResponse>(URL, fd).then((r) => r.data)
}
