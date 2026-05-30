# Checkout Feature

Handles plan selection, contact collection, Ziina payment, and post-payment status display.

## Full Flow

```
User clicks "ابدأ الآن" on a plan
        │
        ▼
/checkout/:planSlug  (CheckoutPage)
  • Loads plan details from GET /api/public/pricing.php
  • User fills: name, email, phone (WhatsApp)
  • Submit → POST /api/public/checkout/initiate.php
        │
        ▼
backend creates checkout_orders row + calls Ziina API
  → returns { paymentUrl, checkoutReference }
        │
        ▼
window.location.href = paymentUrl  (Ziina hosted payment page)
        │
        ▼ (Ziina redirects on completion)
/checkout/status?status=<X>&checkout_ref=<Y>  (CheckoutStatusPage)
  • Calls GET /api/public/checkout/status.php?reference=Y
  • Displays result based on mapped status
```

## API Endpoints

### GET /api/public/pricing.php
No auth required.
```
Response: { ok: true, items: PricingPlan[] }

PricingPlan {
  id: number
  slug: string          // plan key: "single" | "monthly" | "bundle"
  name: string
  description: string
  priceAed: number      // in fils (AED × 100)
  periodLabel: string   // "جلسة" | "شهر" | "حزمة"
  features: string[]
  isPopular: boolean
  ctaLabel?: string
}
```

### POST /api/public/checkout/initiate.php
No auth required.
```
Body (JSON):
  plan_slug   string   required
  full_name   string   required   (alias: "name")
  email       string   required
  whatsapp    string   required   (alias: "phone")
  learner_type          string   optional  default: "adult"
  main_goal             string   optional  default: "general"
  preferred_contact_method  string  optional  default: "whatsapp"

Response: { ok: true, paymentUrl: string, checkoutReference: string }
```

### GET /api/public/checkout/status.php?reference=X
No auth required. Also accepts `?checkout_ref=X`.
```
Response: {
  ok: true,
  status: "paid" | "failed" | "pending_verification" | "pending",
  order: {
    checkoutReference: string
    selectedPlan:      string
    fullName:          string
    email:             string
    paymentStatus:     string
    amountAed:         number
    createdAt:         string
  }
}
```

## Status Values

| Status | Meaning | UI shown |
|--------|---------|----------|
| `paid` | Payment confirmed by Ziina | Green success card + WhatsApp CTA |
| `cancelled` | User closed/cancelled Ziina page | Red card + retry link |
| `failed` | Payment declined | Red card + retry link |
| `pending_verification` | Ziina status unresolved | Yellow card + contact prompt |
| `pending` | API unreachable at load time | Yellow card + contact prompt |

## WhatsApp Fallback

All error/pending states surface a contact button:
```
https://wa.me/971509298326
```
Success state links with a pre-filled message confirming payment.

## Files

| File | Purpose |
|------|---------|
| `CheckoutPage.tsx` | Form — collects contact info, calls initiate, redirects to Ziina |
| `CheckoutStatusPage.tsx` | Result — reads URL params, calls status API, shows outcome |
| `api.ts` | `getPricingPlans`, `initiateCheckout`, `getCheckoutStatus` |
| `types.ts` | `CheckoutContactForm`, `CheckoutOrder`, `CheckoutStatusResult` |

## Notes

- `priceAed` is stored in fils (AED × 100); divide by 100 to display
- Invalid `planSlug` on CheckoutPage redirects to `/#pricing`
- `initiate.php` builds its own Ziina curl call (not the lib helper) so redirect URLs point to `/checkout/status` not the old `/payment-status.php`
- CSRF token added automatically by `apiClient` interceptor
