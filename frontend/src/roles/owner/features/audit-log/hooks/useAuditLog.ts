import { useQuery } from '@tanstack/react-query'
import { getAuditLog } from '../api'
import type { AuditLogFilters } from '../api'

export function useAuditLog(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ['owner-audit-log', filters],
    queryFn: () => getAuditLog(filters),
    staleTime: 15_000,
  })
}
