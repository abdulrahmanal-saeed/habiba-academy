export type VideoStatus = 'published' | 'draft'

export interface Video {
  id: number
  title: string
  slug: string
  youtube_url: string
  youtube_video_id: string
  youtube_embed_url: string
  short_description: string
  thumbnail_url: string
  status: VideoStatus
  show_on_homepage: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface VideoSavePayload {
  id?: number
  title: string
  slug: string
  youtube_url: string
  short_description: string
  status: VideoStatus
  show_on_homepage: boolean
  sort_order: number
}

export interface VideoListResponse {
  ok: boolean
  data: { videos: Video[] }
}

export interface VideoActionResponse {
  ok: boolean
  data: {
    id?: number
    slug?: string
    status?: VideoStatus
    status_label?: string
    message?: string
  }
}
