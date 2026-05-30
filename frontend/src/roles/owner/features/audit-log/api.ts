import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { AuditLogData } from './types'

export interface AuditLogFilters {
  entity_type?: string
  action?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

export const getAuditLog = (filters: AuditLogFilters = {}): Promise<AuditLogData> => {
  const params = new URLSearchParams()
  if (filters.entity_type) params.set('entity_type', filters.entity_type)
  if (filters.action)      params.set('action',      filters.action)
  if (filters.date_from)   params.set('date_from',   filters.date_from)
  if (filters.date_to)     params.set('date_to',     filters.date_to)
  if (filters.limit)       params.set('limit',       String(filters.limit))
  if (filters.offset)      params.set('offset',      String(filters.offset))
  const qs = params.toString()
  return apiClient.get<ApiOk<AuditLogData>>(`/api/owner/audit-log.php${qs ? '?' + qs : ''}`).then((r) => ({
    logs: r.logs,
    total: r.total,
    entity_types: r.entity_types,
  }))
}
