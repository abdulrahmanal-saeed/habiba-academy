# Teacher AI Tools Feature

AI-powered content generation and student insights for the teacher role.

## Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `ai/analyze-student.php?student_id=X` | GET | Full AI analysis of student progress |
| `ai/homework.php` | POST JSON | Generate homework draft |
| `ai/scenario.php` | POST JSON | Generate speaking scenario |
| `ai/lesson.php` | POST JSON | Generate full lesson plan |
| `ai/sessions.php?student_id=X` | GET | Plan remaining session titles |
| `ai/article.php` | POST JSON | Generate article draft |
| `ai/apply-article.php` | POST JSON | Save article draft to DB |
| `ai/review-priority.php?limit=N` | GET | Students sorted by review urgency |
| `ai/feedback-draft.php` | POST form | Rule-based feedback template |
| `ai/mistake-tags.php` | POST form | Rule-based mistake detection |
| `ai/writing-assist.php` | POST form | Writing review (direct Claude + cache) |
| `ai/suggestion-action.php` | POST form | Track teacher action on suggestion |
| `ai/mistake-event.php` | POST form | Record mistake event per student |
| `ai/internal-note.php` | POST form | Save private teacher note |
| `ai/delete-analysis-history.php` | POST form | Delete saved analysis snapshot |
| `ai/test-connection.php` | POST form | Test AI governance connection |

## Governance Error Codes

Always check for governance errors before using AI results:

```typescript
import { isGovernanceError } from './types'
const data = await aiToolsApi.analyzeStudent(studentId)
if (isGovernanceError(data)) { /* handle NO_API_KEY / AI_DISABLED / AI_LIMIT_REACHED */ }
```

## Components

- `AIToolsPage` — Standalone page at `/teacher/ai-tools?student_id=X`
- `AIAnalysisModal` — Modal used from StudentDetailPage Brain button
- `AIToolsPanel` — Tab container for all generators
- `AnalysisTab` — Run + display AI student analysis
- `HomeworkGeneratorTab` — Generate → navigate to `/teacher/homework/create`
- `ScenarioGeneratorTab` — Generate → navigate to `/teacher/scenarios/create`
- `LessonPlannerTab` — Generate full lesson plan with vocabulary + activities
- `ArticleGeneratorTab` — Generate → save draft via apply-article.php
- `WritingAssistDrawer` — Inline writing review (used from SubmissionReviewDrawer)
- `MistakeTagsInput` — Rule-based mistake detection input
- `InternalNoteForm` — Quick private note per student
- `ReviewPriorityList` — Dashboard widget for priority review students

## Key Rules

- NEVER put API keys in frontend — AI settings live in `ai_settings` table
- Group A endpoints (analyze/homework/scenario/lesson/sessions/article) use `post<T>()` with JSON body
- Group C/D/E endpoints use `postForm<T>()` with FormData
- `writing-assist.php` uses direct Claude + `ai_cache`, graceful fallback on failure
