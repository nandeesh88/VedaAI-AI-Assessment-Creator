# VedaAI – AI Assessment Creator

## ✅ Requirements Coverage

| Requirement | Status |
|---|---|
| Assignment form (upload, due date, question types, marks, instructions) | ✅ |
| Validation (no empty/negative values) | ✅ |
| Zustand state management | ✅ |
| WebSocket (real-time progress) | ✅ |
| AI prompt structuring + JSON parsing | ✅ |
| Sections A/B, difficulty, marks in output | ✅ |
| Raw LLM response NOT rendered | ✅ |
| Node.js + Express + TypeScript | ✅ |
| MongoDB | ✅ |
| Redis + BullMQ background jobs | ✅ |
| WebSocket server notifications | ✅ |
| Student info section on paper | ✅ |
| Difficulty badges (Easy/Moderate/Hard) | ✅ |
| Download as PDF (BONUS) | ✅ |
| Regenerate button (BONUS) | ✅ |

## Architecture

```
Frontend (Next.js)
  → POST /api/assignments
Backend (Express)
  → saves to MongoDB
  → enqueues BullMQ job
BullMQ Worker
  → calls Claude AI
  → parses structured JSON
  → saves result to MongoDB + Redis cache
  → broadcasts via WebSocket
Frontend
  → receives WebSocket event
  → renders question paper
```

## Tech Stack
- Frontend: Next.js 14 + TypeScript + Tailwind + Zustand + WebSocket
- Backend: Node.js + Express + TypeScript
- Database: MongoDB Atlas
- Cache/Queue: Upstash Redis + BullMQ
- AI: Anthropic Claude (claude-sonnet-4-20250514)
