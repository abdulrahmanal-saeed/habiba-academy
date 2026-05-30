export interface Video {
  id: number
  slug: string
  title: string
  description: string
  thumbnailUrl?: string
  videoUrl: string
  category: string
  durationSeconds: number
  publishedAt: string
}
