import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api'

const QK = ['teacher-notifications']

export function useNotifications() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: QK,
    queryFn: () => notificationsApi.getNotifications({ limit: 30 }),
    refetchInterval: 30_000,
  })

  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unread_count ?? 0,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    markRead: (id: number) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
    isMarkingAll: markAllRead.isPending,
  }
}
