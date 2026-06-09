**AI Assessment Creator**

A full-stack web application that enables teachers to create structured, AI-generated question papers in seconds. Teachers define the subject, topic, question types, and marks distribution — the system handles the rest.

---

## Features

- AI-powered question paper generation with structured sections (Section A, B, etc.)
- Support for multiple question types — MCQ, short answer, long answer, diagram-based, numerical
- PDF upload support — AI extracts content from uploaded documents and generates relevant questions
- Real-time generation progress via WebSocket — no page refresh required
- Difficulty tagging per question — Easy, Moderate, Hard with visual indicators
- Student info section on generated papers — Name, Roll Number, Class and Section
- Download generated question paper as PDF
- Regenerate option to create a fresh paper with the same configuration
- Assignments dashboard to view and manage all created assignments
- Full validation on the creation form — no empty fields or negative values accepted

---

## Tech Stack

**Frontend**
- Next.js 14 with TypeScript
- Tailwind CSS
- Zustand for state management
- WebSocket client for real-time updates
- html2pdf.js for client-side PDF export

**Backend**
- Node.js with Express and TypeScript
- MongoDB with Mongoose for data persistence
- Redis (Upstash) for caching and job state
- BullMQ for background job queue processing
- WebSocket server for real-time client notifications

**AI**
- Groq API with Llama 3.3 70B
- Structured prompt engineering with JSON response parsing and validation

---

## Architecture

```
Client (Next.js)
    |
    | HTTP POST /api/assignments
    v
Express API Server
    |-- Saves assignment to MongoDB
    |-- Enqueues job to BullMQ (Redis)
    |-- Returns assignmentId to client
    |
    | Client opens WebSocket connection
    v
BullMQ Worker (separate process)
    |-- Picks up job from queue
    |-- Builds structured prompt from assignment data
    |-- Calls Groq API → receives JSON response
    |-- Validates and sanitizes parsed response
    |-- Saves result to MongoDB + Redis cache
    |-- Broadcasts completion via WebSocket
    |
    v
Client receives WebSocket event
    |-- Renders structured question paper
    |-- Student info, sections, questions, difficulty badges, marks
```

---

## How It Works

1. Teacher fills in the assignment form — subject, topic, class, school, duration, question types with counts and marks per question, and optional additional instructions or a PDF upload.
2. On submission, the backend saves the assignment to MongoDB and immediately pushes a job to the BullMQ queue.
3. The frontend navigates to the preview page and opens a WebSocket connection to receive live progress updates.
4. The BullMQ worker picks up the job, builds a detailed prompt from the assignment data, and calls the Groq API.
5. The AI response is parsed and validated into a strict schema — never rendered as raw text.
6. The result is stored in MongoDB and cached in Redis. The worker broadcasts completion through WebSocket.
7. The frontend renders the final question paper — grouped into sections, each question tagged with difficulty and marks.
8. The teacher can download the paper as a formatted PDF or regenerate with the same settings.

---

## Local Setup

**Prerequisites**

- Node.js 18 or higher
- MongoDB Atlas account — https://mongodb.com/atlas
- Upstash Redis account — https://upstash.com
- Groq API key — https://console.groq.com

**Backend**

```bash
cd backend
cp .env.example .env
# Fill in MONGODB_URI, REDIS_URL, GROQ_API_KEY in .env
npm install
npm run dev
```

**Worker** (separate terminal)

```bash
cd backend
npm run worker
```

**Frontend**

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL
npm install
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

**Backend**

| Variable | Description |
|---|---|
| MONGODB_URI | MongoDB Atlas connection string |
| REDIS_URL | Upstash Redis connection URL |
| GROQ_API_KEY | Groq API key for LLM access |
| PORT | Server port (default 4000) |
| FRONTEND_URL | Frontend origin for CORS |
| NODE_ENV | development or production |

**Frontend**

| Variable | Description |
|---|---|
| NEXT_PUBLIC_API_URL | Backend API base URL |
| NEXT_PUBLIC_WS_URL | Backend WebSocket URL |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/assignments | Create assignment and enqueue generation job |
| GET | /api/assignments | List all assignments |
| GET | /api/assignments/:id | Get assignment with result |
| GET | /api/assignments/:id/result | Get generated question paper only |
| DELETE | /api/assignments/:id | Delete assignment |
| GET | /health | Server health check |
| WS | /ws?assignmentId=:id | WebSocket for real-time job updates |

---

## Deployment

- Backend and Worker deployed on Render (Web Service + Background Worker)
- Frontend deployed on Vercel
- MongoDB hosted on MongoDB Atlas
- Redis hosted on Upstash
## Note on Free Tier Hosting

The backend is deployed on Render's free tier. Free tier services spin down automatically after 15 minutes of inactivity.

If the app appears unresponsive on first load, wait 30 to 60 seconds for the backend to wake up, then try again. This is expected behavior on free tier hosting and does not affect functionality once the service is active.

For evaluators: if the first assignment generation appears slow or times out, please refresh and try once more after a minute. Subsequent requests will be fast.
