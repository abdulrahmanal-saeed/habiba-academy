import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchNotifications, markAllRead } from '../api'

export const useMediaBuyerNotifications = () =>
  useQuery({
    queryKey:  ['media-buyer-notifications'],
    queryFn:   fetchNotifications,
    staleTime: 15_000,
  })

export const useMarkAllRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['media-buyer-notifications'] })
    },
  })
}
