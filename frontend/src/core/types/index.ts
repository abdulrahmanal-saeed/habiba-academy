/* Exact types from docs/API_CONTRACTS.md — do not modify without updating the doc */

export type RoleType =
  | 'student'
  | 'teacher'
  | 'owner'
  | 'parent'
  | 'academy'
  | 'media-buyer'

export interface User {
  id: number
  name: string
  email?: string       // optional — students authenticate by login_code, not email
  avatar?: string
  role: RoleType
  createdAt?: string
}

/* { ok: true } intersected with T — matches PHP json_ok() shape */
export type ApiOk<T = Record<string, unknown>> = { ok: true } & T

export interface ApiError {
  ok: false
  error: string
}

export type ApiResponse<T = Record<string, unknown>> = ApiOk<T> | ApiError

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}
