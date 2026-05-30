#!/bin/bash
# create-structure.sh — Creates complete frontend folder structure
# Run from: D:\Habiba\web + app\Rebuild Habiba Website\
# Command: bash scripts/create-structure.sh

set -e
BASE="frontend/src"

echo ""
echo "Creating Habiba Academy folder structure..."
echo ""

# ── Core (shared across all roles) ────────────────────────────
mkdir -p $BASE/core/auth
mkdir -p $BASE/core/components
mkdir -p $BASE/core/hooks
mkdir -p $BASE/core/lib
mkdir -p $BASE/core/stores
mkdir -p $BASE/core/types

# ── Design System ─────────────────────────────────────────────
mkdir -p $BASE/design-system/components
mkdir -p $BASE/design-system/animations
mkdir -p $BASE/design-system/icons

# ── Router ────────────────────────────────────────────────────
mkdir -p $BASE/router

# ── Shared Features (multi-role) ──────────────────────────────
mkdir -p $BASE/shared/notifications
mkdir -p $BASE/shared/help-center
mkdir -p $BASE/shared/onboarding
mkdir -p $BASE/shared/testimonials
mkdir -p $BASE/shared/interactive-book/components
mkdir -p $BASE/shared/interactive-book/components/exercises
mkdir -p $BASE/shared/interactive-book/hooks

# ── Role: Public Visitor ──────────────────────────────────────
for feature in landing level-test checkout articles videos testimonials contact help tracking payment-status; do
  mkdir -p $BASE/roles/public/features/$feature/components
  mkdir -p $BASE/roles/public/features/$feature/hooks
done

# ── Role: Student ─────────────────────────────────────────────
for feature in dashboard homework reviews scenarios materials progress flashcards weak-words book schedule balance profile notifications; do
  mkdir -p $BASE/roles/student/features/$feature/components
  mkdir -p $BASE/roles/student/features/$feature/hooks
done

# ── Role: Teacher ─────────────────────────────────────────────
for feature in dashboard students lesson-planning homework reviews scenarios materials level-test book-submissions ai-tools schedule packages notifications; do
  mkdir -p $BASE/roles/teacher/features/$feature/components
  mkdir -p $BASE/roles/teacher/features/$feature/hooks
done
# AI tools has sub-features
mkdir -p $BASE/roles/teacher/features/ai-tools/tools

# ── Role: Owner ───────────────────────────────────────────────
for feature in dashboard analytics payments book-launch help-cms settings media-buyers articles videos testimonials academies ai-settings audit-log notifications; do
  mkdir -p $BASE/roles/owner/features/$feature/components
  mkdir -p $BASE/roles/owner/features/$feature/hooks
done

# ── Role: Parent ──────────────────────────────────────────────
for feature in dashboard children child-homework child-reviews child-progress child-materials child-book notifications contact; do
  mkdir -p $BASE/roles/parent/features/$feature/components
  mkdir -p $BASE/roles/parent/features/$feature/hooks
done

# ── Role: Academy Partner ─────────────────────────────────────
for feature in dashboard briefs students notifications help; do
  mkdir -p $BASE/roles/academy/features/$feature/components
  mkdir -p $BASE/roles/academy/features/$feature/hooks
done

# ── Role: Media Buyer ─────────────────────────────────────────
for feature in dashboard tracking campaigns commissions agreements notifications help; do
  mkdir -p $BASE/roles/media-buyer/features/$feature/components
  mkdir -p $BASE/roles/media-buyer/features/$feature/hooks
done

# ── Tests ─────────────────────────────────────────────────────
mkdir -p tests/e2e/public
mkdir -p tests/e2e/student
mkdir -p tests/e2e/teacher
mkdir -p tests/e2e/owner
mkdir -p tests/e2e/parent
mkdir -p tests/e2e/academy
mkdir -p tests/e2e/media-buyer
mkdir -p tests/unit
mkdir -p tests/integration

# ── Database ──────────────────────────────────────────────────
mkdir -p database/migrations
mkdir -p database/existing

# ── Count results ─────────────────────────────────────────────
echo "✅ Structure created!"
echo ""
echo "Feature folders per role:"
for role in public student teacher owner parent academy media-buyer; do
  count=$(find $BASE/roles/$role/features -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l)
  echo "  $role: $count features"
done
echo ""
echo "Total folders:"
find $BASE -type d | wc -l
echo ""
echo "Next: Open Claude Code and run the Phase 1 prompt from scripts/new-session.md"
