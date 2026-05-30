import { useQuery } from '@tanstack/react-query'
import { fetchChildMaterials } from '../api'

export const useChildMaterials = (childId: number) =>
  useQuery({
    queryKey: ['child-materials', childId],
    queryFn: () => fetchChildMaterials(childId),
    enabled: childId > 0,
    staleTime: 15_000,
  })
