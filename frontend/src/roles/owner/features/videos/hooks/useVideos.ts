import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVideos, saveVideo, deleteVideo, toggleVideo } from '../api'
import type { Video, VideoStatus } from '../types'

const QK = ['owner-videos'] as const

export function useVideos() {
  return useQuery({ queryKey: QK, queryFn: getVideos, staleTime: 30_000 })
}

export function useSaveVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: FormData) => saveVideo(form),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useDeleteVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteVideo(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useToggleVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => toggleVideo(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK })
      const prev = qc.getQueryData<Video[]>(QK)
      qc.setQueryData<Video[]>(QK, (old) =>
        old?.map((v) =>
          v.id === id
            ? { ...v, status: (v.status === 'published' ? 'draft' : 'published') as VideoStatus }
            : v
        )
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData<Video[]>(QK, ctx.prev)
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}
