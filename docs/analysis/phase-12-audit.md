# Phase 12 Audit — Backend PHP Cleanup
**Date:** 2026-05-30  
**Scope:** All canonical backend PHP files in `backend/api/` (excluding `backend/api/api/` legacy subfolder)  
**Files audited:** 118 total (28 canonical role files + 90 legacy)

---

## Verified File Structure

```
backend/
  lib/
    lib/               ← ALL lib PHP files live here (double-nested)
      helpers.php      ← THE correct helpers location
      env.php
      settings.php
      notify.php
      ...
  config/
    config/            ← db.php lives here (double-nested)
      db.php           ← THE correct db location
```

**Consequence:** Any `require_once '../../lib/helpers.php'` resolves to `backend/lib/helpers.php` which **DOES NOT EXIST** — PHP Fatal Error.  
**Consequence:** Any `require_once '../../config/db.php'` resolves to `backend/config/db.php` which **DOES NOT EXIST** — PHP Fatal Error.

---

## ISSUE #1 — CRITICAL: db.php Internal Require Paths Are Wrong

**File:** `backend/config/config/db.php`  
**Severity:** CRITICAL — this file runs inside every API call  

```php
// CURRENT (WRONG) — resolves to backend/config/lib/*.php which doesn't exist
require_once __DIR__ . '/../lib/env.php';
require_once __DIR__ . '/../lib/helpers.php';
require_once __DIR__ . '/../lib/settings.php';
require_once __DIR__ . '/../lib/public-content.php';
require_once __DIR__ . '/../lib/notify.php';
```

From `backend/config/config/`, `../lib/` resolves to `backend/config/lib/` which does not exist.

**Fix:** Change to `../../lib/lib/` from db.php's location:
```php
require_once __DIR__ . '/../../lib/lib/env.php';
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/settings.php';
require_once __DIR__ . '/../../lib/lib/public-content.php';
require_once __DIR__ . '/../../lib/lib/notify.php';
```

---

## ISSUE #2 — CRITICAL: Wrong helpers.php Path (14 canonical files)

These files use `../../lib/helpers.php` which resolves to `backend/lib/helpers.php` — **does not exist**.  
Correct path: `../../lib/lib/helpers.php`

| File | Line | Wrong Include |
|------|------|--------------|
| `auth/csrf.php` | 4 | `'../../lib/helpers.php'` |
| `leveltest/questions.php` | 4 | `'../../lib/helpers.php'` |
| `student/login.php` | 4 | `'../../lib/helpers.php'` |
| `student/logout.php` | 4 | `'../../lib/helpers.php'` |
| `student/common-mistakes.php` | 4 | `'../../lib/helpers.php'` |
| `student/flashcard-review.php` | 4 | `'../../lib/helpers.php'` |
| `student/flashcards.php` | 4 | `'../../lib/helpers.php'` |
| `student/material-detail.php` | 4 | `'../../lib/helpers.php'` |
| `student/progress.php` | 4 | `'../../lib/helpers.php'` |
| `student/scenario-detail.php` | 4 | `'../../lib/helpers.php'` |
| `student/scenarios.php` | 4 | `'../../lib/helpers.php'` |
| `student/toggle-mistake.php` | 4 | `'../../lib/helpers.php'` |
| `student/toggle-weak-word.php` | 4 | `'../../lib/helpers.php'` |
| `student/weak-words.php` | 4 | `'../../lib/helpers.php'` |

**Note:** Student book files (`book-*.php`) are NOT in this list — they use the correct `../../lib/lib/` path.

---

## ISSUE #3 — CRITICAL: Wrong config/db.php Path (31 canonical files)

These files use `../../config/db.php` which resolves to `backend/config/db.php` — **does not exist**.  
Correct path: `../../config/config/db.php`

### Academy (5 files)
| File | Line |
|------|------|
| `academy/briefs.php` | 5 |
| `academy/home.php` | 5 |
| `academy/login.php` | 5 |
| `academy/notifications.php` | 5 |
| `academy/students.php` | 5 |

### Auth + Leveltest (2 files)
| File | Line |
|------|------|
| `auth/csrf.php` | 5 |
| `leveltest/questions.php` | 7 |

### Media Buyer (4 files)
| File | Line |
|------|------|
| `media-buyer/agreement.php` | 4 |
| `media-buyer/home.php` | 4 |
| `media-buyer/notifications.php` | 4 |
| `media-buyer/stats.php` | 4 |

### Parent (8 files)
| File | Line |
|------|------|
| `parent/child-book.php` | 4 |
| `parent/child-homework.php` | 5 |
| `parent/child-materials.php` | 4 |
| `parent/child-progress.php` | 4 |
| `parent/child-reviews.php` | 4 |
| `parent/child-schedule.php` | 4 |
| `parent/home.php` | 5 |
| `parent/login.php` | 5 |

### Student (12 files — also have wrong helpers path)
| File | Line |
|------|------|
| `student/common-mistakes.php` | 6 |
| `student/flashcard-review.php` | 6 |
| `student/flashcards.php` | 6 |
| `student/login.php` | 7 |
| `student/material-detail.php` | 6 |
| `student/progress.php` | 5 |
| `student/scenario-detail.php` | 5 |
| `student/scenarios.php` | 5 |
| `student/toggle-mistake.php` | 5 |
| `student/toggle-weak-word.php` | 5 |
| `student/weak-words.php` | 6 |

**Note:** `student/logout.php` uses wrong helpers path but does NOT include `db.php` (intentional — logout only destroys session).

---

## ISSUE #4 — CRITICAL: Undefined Function `csrf_check()` Called (3 files)

`helpers.php` defines `csrf_validate()` only. There is no `csrf_check()` function anywhere in the codebase. These calls will throw a PHP Fatal Error when reached:

| File | Line | Context |
|------|------|---------|
| `teacher/help-articles.php` | 43 | FormData delete POST branch |
| `teacher/notifications.php` | 65 | Mark-read POST handler |
| `teacher/settings.php` | 20 | Settings update POST handler |

**Fix:** Replace all `csrf_check()` → `csrf_validate()`.

---

## ISSUE #5 — SECURITY: Missing Auth Check (2 files)

`teacher/help-articles.php` and `teacher/help-categories.php` have no `start_session()` call and no authentication guard. Any unauthenticated visitor can read, create, edit, and delete help articles/categories.

| File | Missing |
|------|---------|
| `teacher/help-articles.php` | `start_session()` + `require_teacher()` |
| `teacher/help-categories.php` | `start_session()` + `require_teacher()` |

**Fix:** Add after includes, before any logic:
```php
start_session();
require_teacher();
```

---

## ISSUE #6 — SECURITY: Missing CSRF on POST Handlers (3 files)

### `teacher/help-articles.php`
- FormData branch: calls `csrf_check()` (Issue #4 — undefined)
- JSON body branch (save article): **NO CSRF AT ALL**

### `teacher/help-categories.php`
- JSON body POST (save category): **NO CSRF AT ALL**

### `media-buyer/agreement.php`
- JSON body POST (sign agreement): **NO CSRF AT ALL**

**Fix:** Add `csrf_validate()` at the top of each POST block.

---

## ISSUE #7 — MINOR: `get_db()` Instead of Global `$pdo` (2 files)

`teacher/help-articles.php` and `teacher/help-categories.php` assign `$pdo = get_db()` at the top level.  
All other files rely on the global `$pdo` set by `../../config/config/db.php`.

`get_db()` is defined in helpers.php and creates a fresh PDO connection on each call, bypassing the singleton pattern. This may cause double-connection overhead.

**Fix:** After adding `require_once __DIR__ . '/../../config/config/db.php'`, remove `$pdo = get_db()` and use the global `$pdo` variable directly.

---

## ISSUE #8 — DEAD CODE: Legacy `backend/api/api/` Subfolder

The directory `backend/api/api/` contains **90+ PHP files** that are verbatim copies of the original Core PHP files. They are NOT served by the React frontend (frontend calls `/api/teacher/`, not `/api/api/teacher/`). They all use wrong single-lib include paths that would fail on this server's double-nested structure.

**No action required for functionality** — these files are unreachable. But they should be documented as dead weight.

Subdirectories:
- `api/api/teacher/` — ~80 files
- `api/api/review/` — 6 files
- `api/api/mobile/` — 11 files
- `api/api/push/` — 3 files
- `api/api/leveltest/` — 4 files
- `api/api/cron/` — 2 files
- `api/api/help/` — 1 file
- `api/api/student/` — 1 file

---

## ISSUE #9 — MINOR: `review/` Canonical Files Misplaced

`backend/api/review/` contains:
- `create.php`, `delete.php`, `save.php`, `student-list.php`, `update.php`

These 5 files all use correct paths (`../../lib/lib/helpers.php`, `../../config/config/db.php`) and have proper auth + CSRF. However, `review/` is not a standard role-based directory — reviews are a teacher-owned feature and the frontend calls `/api/teacher/create-review.php`, not `/api/review/create.php`. These files appear to be unused duplicates.

**Verify:** Confirm no frontend code calls `/api/review/...` endpoints. If confirmed unused, mark for removal.

---

## Compliance Summary

| Check | Canonical Files | Pass | Fail |
|-------|----------------|------|------|
| `helpers.php` correct double-lib path | 78 | 64 | 14 |
| `db.php` correct double-config path | 78 | 47 | 31 |
| `db.php` internal paths (Issue #1) | 1 | 0 | 1 |
| Auth guard on protected endpoints | 78 | 76 | 2 |
| CSRF on all POST handlers | 78 | 73 | 3 + 2 broken |
| `csrf_validate()` (not `csrf_check`) | 78 | 75 | 3 |
| `ensure_schema()` calls | 78 | 78 | 0 ✓ |
| Session regeneration on login | 5 | 5 | 0 ✓ |

---

## Fix Priority Order

| Priority | Issue | Files | Risk |
|----------|-------|-------|------|
| P0 | Fix `db.php` internal require paths | 1 | Server down |
| P0 | Fix wrong `../../lib/helpers.php` paths | 14 | Server down |
| P0 | Fix wrong `../../config/db.php` paths | 31 | Server down |
| P1 | Replace `csrf_check()` → `csrf_validate()` | 3 | Mutations fail |
| P1 | Add auth to help-articles.php + help-categories.php | 2 | Auth bypass |
| P1 | Add CSRF to 3 POST handlers | 3 | Security |
| P2 | Remove `$pdo = get_db()` in help files | 2 | Minor |
| P3 | Clean up `api/api/` dead code | 90+ | Tech debt |

---

## Files Confirmed Correct (No Changes Needed)

All canonical teacher files except the 2 help files use correct patterns:
- `../../lib/lib/helpers.php` ✓
- `../../config/config/db.php` ✓
- `start_session()` ✓
- `require_teacher()` or `$_SESSION['teacher_logged']` check ✓
- `csrf_validate()` on all POST handlers ✓

All `review/` canonical files (paths + auth + CSRF correct).  
All student book files (`book-*.php`) use correct paths.  
All `auth/me.php` is correct.  
All `teacher/ai/*` files use correct patterns.
