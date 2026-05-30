# Book Marketing Feature

Student-facing product page and checkout request flow for the Interactive Book.

## Routes

- `/student/book-product` — BookProductPage (show book details, CTA to buy)
- `/student/book-checkout` — BookCheckoutPage (submit activation request)

## Components

- `BookProductPage.tsx` — Hero, features list, access-aware CTA
- `BookCheckoutPage.tsx` — Form to submit activation request (manual approval flow)
- `api.ts` — `getBookProduct`, `submitBookCheckout`
- `types.ts` — `BookProduct`, `BookPackage`, `BookProductData`, `BookCheckoutForm`

## API Endpoints

- `GET /api/student/book-product.php` — returns book, package, access status, launch settings
- `POST /api/student/book-checkout.php` — creates `book_activation_requests` record

## Notes

- Checkout is a manual-approval flow (teacher reviews → approves → student gets access)
- CTA visibility controlled by `book_launch_settings.checkout_enabled` flag
- `BookBanner` on dashboard links to `/student/book-product`
- `BookPopupModal` on homework result links to `/student/book-product`
