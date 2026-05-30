import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNotifications, markAllRead } from '../api'

export const useAcademyNotifications = () =>
  useQuery({ queryKey: ['academy-notifications'], queryFn: fetchNotifications, staleTime: 15_000 })

export const useMarkAllRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['academy-notifications'] }),
  })
}
