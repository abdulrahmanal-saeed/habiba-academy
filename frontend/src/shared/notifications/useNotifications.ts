import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNotifications,
  markAsRead as markAsReadApi,
  markAllRead as markAllReadApi,
} from './api'
import type { Notification } from './api'
import { STALE } from '@/core/lib/queryClient'

const QUERY_KEY = ['notifications'] as const

export interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (id: number) => void
  markAllRead: () => void
}

export function useNotifications(): UseNotificationsReturn {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getNotifications,
    staleTime: STALE.dashboard,      // 30s
    refetchInterval: 30 * 1000,      // poll every 30s
  })

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }, [queryClient])

  const markAsReadMutation = useMutation({
    mutationFn: markAsReadApi,
    onSuccess: invalidate,
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllReadApi,
    onSuccess: invalidate,
  })

  return {
    notifications: data?.items ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    markAsRead: (id) => markAsReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(undefined),
  }
}
