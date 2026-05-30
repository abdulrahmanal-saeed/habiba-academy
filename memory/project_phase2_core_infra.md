---
name: Phase 2 Core Infrastructure — completed
description: API client, Zustand stores, auth context, TanStack Query client
type: project
---

Phase 2 Core Infrastructure complete. Zero TS errors, zero lint warnings.

**Why:** All feature modules depend on these — they must exist before any role UI is built.

**How to apply:** Always import from the barrel exports — `@/core/auth`, `@/core/types`, etc.

## Files created

- `core/types/index.ts` — RoleType, User, ApiOk (type alias not interface), ApiError, ApiResponse, PaginatedData
- `core/lib/apiClient.ts` — axios + CSRF interceptor + ok:false → Error interceptor + get/post/postForm helpers + fetchCsrfToken()
- `core/lib/queryClient.ts` — TanStack Query client + STALE times map + global mutation onError toast
- `core/stores/authStore.ts` — Zustand + persist(sessionStorage) — setAuth, clearAuth, checkSession
- `core/stores/themeStore.ts` — Zustand + persist(localStorage) — setTheme applies [data-theme="dark"] to <html>
- `core/auth/authContext.ts` — createContext (plain .ts, NOT .tsx — no JSX)
- `core/auth/AuthProvider.tsx` — only the Provider component
- `core/auth/useAuth.ts` — only the useAuth hook
- `core/auth/AuthGuard.tsx` — role-based route guard, shows Spinner while loading
- `core/auth/index.ts` — barrel: AuthProvider, useAuth, AuthContextValue

## Key decisions & gotchas

- `ApiOk<T>` MUST be a `type` alias (`type ApiOk<T> = { ok: true } & T`), NOT an interface — interfaces can't use `& T` and TypeScript flags the unused generic.
- React context (`createContext(...)`) must be in a `.ts` file separate from the Provider component — eslint-plugin-react-refresh flags context constants co-exported with components even with `allowConstantExport: true`.
- `useAuth` must be in its own `useAuth.ts` — same fast-refresh rule.
- CSRF token is fetched via `GET /api/auth/csrf` (needs a PHP endpoint) and stored module-level in apiClient. `fetchCsrfToken()` is called from `AuthProvider` on mount alongside `checkSession()`.
- `authStore` persists only `{ user, role, isAuthenticated }` to sessionStorage — `isLoading` is intentionally NOT persisted.
- axios installed as prod dependency (was missing from package.json).
