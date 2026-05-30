export interface AuditLogEntry {
  id: number
  actor_type: string
  actor_id: number | null
  action: string
  entity_type: string
  entity_id: number | null
  old_value: string | null
  new_value: string | null
  ip_address: string | null
  created_at: string
}

export interface AuditLogData {
  logs: AuditLogEntry[]
  total: number
  entity_types: string[]
}
