export type BriefStatus = 'submitted' | 'reviewing' | 'accepted' | 'rejected'

export interface BriefListItem {
  id: number
  student_name: string
  main_goal: string
  brief_status: BriefStatus
  created_at: string
}

export interface BriefDetail {
  id: number
  student_name: string
  age: string | null
  nationality: string
  contracted_hours: string
  native_language: string
  studied_arabic_before: 'yes' | 'no'
  learning_reason: string
  main_goal: string
  target_duration: string
  additional_notes: string | null
  speaking_ability: string | null
  reading_writing_ability: string | null
  parent_contact_info: string | null
  preferred_schedule: string | null
  owner_notes: string | null
  brief_status: BriefStatus
  conversion_status: 'pending' | 'converted'
  created_at: string
  updated_at: string
}

export interface NewBriefPayload {
  student_name: string
  age: string
  nationality: string
  native_language: string
  contracted_hours: string
  studied_arabic_before: 'yes' | 'no'
  target_duration: string
  learning_reason: string
  main_goal: string
  speaking_ability: string
  reading_writing_ability: string
  parent_contact_info: string
  preferred_schedule: string
  additional_notes: string
}

export interface BriefsData {
  briefs: BriefListItem[]
}
