import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAgreement, acceptAgreement } from '../api'

export const useAgreement = () =>
  useQuery({
    queryKey: ['media-buyer-agreement'],
    queryFn:  fetchAgreement,
    staleTime: Infinity,
  })

export const useAcceptAgreement = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: acceptAgreement,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['media-buyer-home'] })
      void queryClient.invalidateQueries({ queryKey: ['media-buyer-agreement'] })
    },
  })
}
