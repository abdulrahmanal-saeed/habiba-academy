import { apiClient } from '@/core/lib/apiClient'
import type { Video, VideoListResponse, VideoActionResponse } from './types'

const URL = '/api/owner/videos'

export function getVideos(): Promise<Video[]> {
  return apiClient.get<VideoListResponse>(URL).then((r) => r.data.videos)
}

export function saveVideo(form: FormData): Promise<VideoActionResponse['data']> {
  return apiClient.postForm<VideoActionResponse>(URL, form).then((r) => r.data)
}

export function deleteVideo(id: number): Promise<VideoActionResponse['data']> {
  const fd = new FormData()
  fd.append('action', 'delete')
  fd.append('id', String(id))
  return apiClient.postForm<VideoActionResponse>(URL, fd).then((r) => r.data)
}

export function toggleVideo(id: number): Promise<VideoActionResponse['data']> {
  const fd = new FormData()
  fd.append('action', 'toggle')
  fd.append('id', String(id))
  return apiClient.postForm<VideoActionResponse>(URL, fd).then((r) => r.data)
}
