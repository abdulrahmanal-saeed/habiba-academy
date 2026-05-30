# Owner — AI Logs

Browse AI request logs with filters by feature and status. Includes health KPI strip.

## Routes
- `/owner/ai-logs` — AILogsPage

## Backend
- `GET /api/owner/ai-logs` — logs (LIMIT 100) + distinct features list + health counts
- Params: `?feature=homework_analysis&status=failed`

## Key notes
- raw_prompt and output_json can be very large — displayed in collapsible rows (AILogRow)
- estimated_cost_usd is a DECIMAL string from MySQL — parsed as float in UI
- staleTime: 5_000 (logs update frequently, unlike other owner features)
- full_name is null for teacher-initiated requests (student_id = null)
- Status values: success | failed | cached
