# SkillSense AI — Full Stack

AI-powered Employee Skill Intelligence Dashboard built with React + Vite + Node.js + Supabase + Gemini AI.

## Features

### Manager Portal
- 📊 Dashboard with stats, charts (employees per role, role distribution)
- 👥 Employee management — add, delete, search, filter
- 🔄 **Dynamically change employee roles** from the Employees page
- 🏆 **Auto-rank employees** by role using skill match + rating + experience
- 🤖 **AI Interview** — upload PDF or paste resume, generate custom questions, speech-to-text answers, AI evaluation
- 📋 Interview history with detailed breakdowns

### Employee Portal
- 🏠 **Personal dashboard** — skills, ratings, radar chart, skill gaps, course links
- 📄 **Resume parsing** — upload PDF, AI extracts skills automatically (fixes the skill fetch bug)
- ✏️ Profile editor — update info, manage skills manually
- 🎤 Self-service AI interview with speech-to-text

---

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste contents of `backend/supabase/schema.sql` → Run
3. Get your `Project URL` and `anon key` from **Settings → API**

### 2. Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key

### 3. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and fill in SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY
npm install
npm start        # runs on port 3001
# Or for development:
npm run dev
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev      # runs on port 5173
```

Navigate to `http://localhost:5173`

---

## Default Credentials

| Role    | Email                 | Password    |
|---------|-----------------------|-------------|
| Manager | manager@company.com   | manager123  |
| Employee| (register yourself)   | (your choice)|

---

## Architecture

```
frontend (React + Vite + Tailwind)
    │
    │  /api/* (proxied by Vite)
    ▼
backend (Node.js + Express)  ←→  Supabase (PostgreSQL)
    │
    ▼
Gemini AI (resume parsing + interview + evaluation)
```

## Key Bug Fixes

1. **Skills not fetching after resume extraction** — Fixed in `routes/resume.js`: now properly deletes old resume-skills and re-inserts parsed skills with correct `employee_id`
2. **Resume not extracted** — Fixed by using `pdf-parse` library with buffer mode; returns clear error if text extraction fails
3. **No employee portal** — Added full employee dashboard, profile, and self-service interview pages
4. **AI evaluation not saving skills** — Interview evaluation now saves high-scored skills (`score >= 6`) back to `employee_skills`
5. **Manager can't change employee role** — Added role-change modal in Employees page with API route `PATCH /api/manager/:id/employees/:empId/role`
