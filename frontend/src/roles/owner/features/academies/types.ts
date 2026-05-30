export interface Academy {
  id: number
  name: string
  contact_name: string | null
  email: string | null
  whatsapp: string | null
  status: 'active' | 'paused' | 'inactive'
  notes: string | null
  access_code: string | null
  created_at: string
  student_count: number
  students: string
}

export interface StudentOption {
  id: number
  full_name: string
  login_code: string
  is_active: 1 | 0
}

export interface AcademyListResponse {
  ok: boolean
  data: { academies: Academy[] }
}

export interface StudentListResponse {
  ok: boolean
  data: { students: StudentOption[] }
}

export interface AcademyActionResponse {
  ok: boolean
  data: { id?: number; message?: string }
}
