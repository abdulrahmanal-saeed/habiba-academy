export interface Parent {
  id: number
  full_name: string
  email: string | null
  whatsapp: string | null
  status: 'active' | 'inactive'
  notes: string | null
  access_code: string | null
  student_count: number
  students: string | null
  created_at: string
}

export interface StudentOption {
  id: number
  full_name: string
  login_code: string
}

export interface ParentSavePayload {
  action: 'save'
  full_name: string
  email: string
  whatsapp: string
  status: 'active' | 'inactive'
  notes: string
  student_ids: number[]
}

export interface ParentListResponse {
  ok: boolean
  data: { parents: Parent[] }
}

export interface StudentOptionsResponse {
  ok: boolean
  data: { students: StudentOption[] }
}

export interface ParentActionResponse {
  ok: boolean
  data: { message: string }
}
