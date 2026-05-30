export type MaterialType =
  | 'video' | 'video_link' | 'audio' | 'pdf' | 'pptx' | 'document'
  | 'image' | 'link' | 'article' | 'html' | 'mixed'

export type MaterialStatus = 'draft' | 'published' | 'hidden' | 'archived'
export type MaterialLanguage = 'arabic' | 'english' | 'both'

export interface CourseMaterial {
  id: number
  student_id: number
  title: string
  type: MaterialType
  category: string
  level: string
  tags: string
  language: MaterialLanguage
  estimated_study_minutes: number
  status: MaterialStatus
  description: string | null
  sort_order: number
  is_published: boolean
  show_on_homepage: boolean
  allow_download: boolean
  source_type: 'url' | 'file'
  href: string
  is_file: boolean
  original_filename: string | null
  created_at: string
  updated_at: string | null
}

export interface MaterialSavePayload {
  id: number
  student_id: number
  title: string
  type: MaterialType
  category?: string
  level?: string
  tags?: string
  language?: MaterialLanguage
  estimated_study_minutes?: number
  description?: string
  sort_order?: number
  status?: MaterialStatus
  show_on_homepage?: number
  allow_download?: number
  source_type: 'url' | 'file'
  url?: string
}
