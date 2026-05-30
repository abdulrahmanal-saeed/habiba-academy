export type MaterialType =
  | 'video'
  | 'video_link'
  | 'audio'
  | 'pdf'
  | 'pptx'
  | 'document'
  | 'image'
  | 'link'
  | 'article'
  | 'html'
  | 'mixed'

export type ProgressStatus = 'assigned' | 'viewed' | 'completed'

export interface MaterialListItem {
  id: number
  title: string
  type: MaterialType
  href: string
  is_file: boolean
  description: string | null
  sort_order: number
  category: string
  level: string
  language: string
  estimated_study_minutes: number
  viewed_at: string | null
  completed_at: string | null
}

export interface MaterialDetail extends MaterialListItem {
  allow_download: number
  mime_type: string
  original_filename: string
  progress_status: ProgressStatus
  download_count: number
}
