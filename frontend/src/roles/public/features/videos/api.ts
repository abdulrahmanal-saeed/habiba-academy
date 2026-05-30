import { get } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { Video } from './types'

export async function getVideos(): Promise<Video[]> {
  const data = await get<ApiOk<{ items: Video[] }>>('/api/public/videos')
  return data.items
}

export async function getVideo(slug: string): Promise<Video> {
  const data = await get<ApiOk<{ item: Video }>>(`/api/public/videos/${slug}`)
  return data.item
}
