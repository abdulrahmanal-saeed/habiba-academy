# Owner — AI Settings

Manage AI governance configuration: provider, model, daily limits, and cost estimates.

## Routes
- `/owner/ai-settings` — AISettingsPage

## Backend
- `GET  /api/owner/ai-settings` — settings + masked API key status + connection status
- `POST /api/owner/ai-settings` action=save — update 6 settings via ai_governance_save_setting()
- `POST /api/owner/ai-settings` action=test_connection — live Anthropic API test (20s timeout)

## Key notes
- API key NEVER returned or editable from UI — lives in server environment only
- `api_key_status` is always masked: `Configured: sk-ant-***...****`
- test_connection updates `ai_connection_status` and `ai_connection_checked_at` in ai_settings table
- Daily limit is per-feature-per-teacher-per-day, not global
- ai_model is a free-text input (no dropdown — models evolve)
