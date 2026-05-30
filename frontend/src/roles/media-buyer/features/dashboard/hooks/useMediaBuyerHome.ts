import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchMediaBuyerHome } from '../api'

export const useMediaBuyerHome = () => {
  const navigate = useNavigate()
  return useQuery({
    queryKey: ['media-buyer-home'],
    queryFn:  fetchMediaBuyerHome,
    staleTime: 30_000,
    retry: false,
    throwOnError: false,
    meta: {
      onError: (err: unknown) => {
        const e = err as { status?: number; message?: string }
        if (e?.status === 403 || e?.message === 'agreement_required') {
          navigate('/media-buyer/agreement')
        }
      },
    },
  })
}
