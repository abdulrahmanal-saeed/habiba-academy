# Owner Payments

Filterable checkout order list with a slide-in detail drawer for reviewing and updating payment statuses.

## Role
Owner only (`/owner/payments`)

## Components
- `PaymentsPage` — list page with status filter pills + search bar
- `PaymentsTable` — tabular list of orders
- `PaymentDetailDrawer` — split-drawer: detail + pipeline + audit log + status form
- `PaymentStatusBadge` — color-coded status chip
- `PipelineStatus` — 5-step onboarding pipeline grid
- `AuditLog` — timeline of status change events
- `StatusForm` — select + save + check Ziina button

## API
- `GET /api/owner/payments` → orders list + status counts
- `GET /api/owner/payments?id=N` → single order detail
- `POST /api/owner/payments` action=`update_status` | `check_ziina`

## Key patterns
- Split-drawer key-remount: `<Inner key={order?.id ?? 'none'} />`
- usePaymentDetail enabled only when drawer is open with valid id
- StatusForm keeps local `selected` state — save button disabled until changed
