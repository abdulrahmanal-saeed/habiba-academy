export type BriefStatus =
  | 'submitted'
  | 'under_review'
  | 'needs_more_info'
  | 'accepted'
  | 'converted_to_student'
  | 'rejected'
  | 'archived'

export interface AcademyBrief {
  id: number
  student_name: string
  age: string | null
  nationality: string | null
  native_language: string | null
  main_goal: string | null
  learning_reason: string | null
  speaking_ability: string | null
  reading_writing_ability: string | null
  parent_contact_info: string | null
  preferred_schedule: string | null
  additional_notes: string | null
  brief_status: BriefStatus
  owner_notes: string | null
  conversion_status: string | null
  converted_at: string | null
  created_at: string
  academy_name: string | null
  source_name: string | null
  academy_id: number | null
}

export interface BriefListResponse {
  ok: boolean
  data: { briefs: AcademyBrief[] }
}

export interface BriefDetailResponse {
  ok: boolean
  data: { brief: AcademyBrief }
}

export interface BriefActionResponse {
  ok: boolean
  data: { message: string; status: string }
}
