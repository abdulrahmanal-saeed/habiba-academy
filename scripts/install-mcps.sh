#!/bin/bash
# install-mcps.sh — Install all MCP tools for Habiba Academy
# Run from: D:\Habiba\web + app\Rebuild Habiba Website\
# Command: bash scripts/install-mcps.sh

set -e

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Habiba Nabil Arabic Academy — MCP Tools Setup"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check Claude Code
if ! command -v claude &> /dev/null; then
  echo "❌ Claude Code not found."
  echo "   Install: https://claude.ai/code"
  exit 1
fi
echo "✅ Claude Code: $(claude --version)"
echo ""

# ── 1. Filesystem MCP ─────────────────────────────────────────
echo "📁 Filesystem MCP..."
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem ./
echo "✅ Done — Claude can read/write all project files"
echo ""

# ── 2. Sequential Thinking MCP ────────────────────────────────
echo "🧠 Sequential Thinking MCP..."
claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
echo "✅ Done — Step-by-step reasoning for complex features"
echo ""

# ── 3. Memory MCP ─────────────────────────────────────────────
echo "💾 Memory MCP..."
claude mcp add memory -- npx -y @modelcontextprotocol/server-memory
echo "✅ Done — Decisions persist across sessions"
echo ""

# ── 4. Playwright MCP ─────────────────────────────────────────
echo "🎭 Playwright MCP..."
claude mcp add playwright -- npx -y @executeautomation/playwright-mcp-server
echo "✅ Done — E2E browser testing"
echo ""

# ── 5. Framer Motion (npm package in frontend) ────────────────
echo "🎞️  Framer Motion..."
if [ -d "frontend" ]; then
  cd frontend
  npm install framer-motion
  cd ..
  echo "✅ Done — Animations in frontend/"
else
  echo "⚠️  frontend/ not found yet — install after: npm create vite@latest frontend"
fi
echo ""

# ── Summary ───────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo "  MCPs installed:"
echo ""
echo "  filesystem         Read/write project files directly"
echo "  sequential-thinking Step-by-step before complex tasks"
echo "  memory             Remember decisions across sessions"
echo "  playwright         E2E tests (run after each feature)"
echo ""
echo "  Context Engineering, Marketing Skills, Impeccable:"
echo "  These are prompt-based — used via new-session.md patterns"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Next steps:"
echo ""
echo "  1. Scaffold React app:"
echo "     npm create vite@latest frontend -- --template react-ts"
echo "     cd frontend"
echo "     npm install framer-motion @tanstack/react-query zustand"
echo "     npm install react-router-dom react-hook-form lucide-react"
echo "     npm install -D tailwindcss @tailwindcss/vite playwright"
echo "     npm install -D @playwright/test typescript-eslint prettier"
echo ""
echo "  2. Create folder structure:"
echo "     bash scripts/create-structure.sh"
echo ""
echo "  3. Copy backend from source:"
echo "     From: D:\\Habiba\\web + app\\New\\Core\\"
echo "     To:   D:\\Habiba\\web + app\\Rebuild Habiba Website\\backend\\"
echo "     See REBUILD_PLAN.md Phase 0 for exact list"
echo ""
echo "  4. Open Claude Code:"
echo "     claude ."
echo "     Then use prompts from scripts/new-session.md"
echo ""
echo "  5. Start Phase 1: Design System"
echo "     First session prompt is in scripts/new-session.md"
echo "═══════════════════════════════════════════════════════════"
