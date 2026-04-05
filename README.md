# JumpMasters

Kiteboarding competition platform with OCR session upload.

## Quick start

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure backend

```bash
cp backend/.env.example backend/.env
# Fill in DATABASE_URL, JWT_SECRET, GOOGLE_APPLICATION_CREDENTIALS
```

### 3. Set up database

Run `backend/src/db/migrations/001_initial.sql` in your Supabase SQL editor (or any PostgreSQL instance).

### 4. Run locally

```bash
# Terminal 1 – backend
cd backend && npm run dev

# Terminal 2 – frontend
cd frontend && npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3001

## Deployment

- **Frontend** → Vercel (set `VITE_API_URL` env var to your backend URL)
- **Backend** → Supabase Edge Functions or any Node host
- **Database** → Supabase PostgreSQL

## Google Vision API

1. Create a project at console.cloud.google.com
2. Enable the Cloud Vision API
3. Create a service account key (JSON)
4. Set `GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json` in backend `.env`

## Fleet system

| Fleet    | Min jump height |
|----------|----------------|
| Bronze   | 0 m            |
| Silver   | 5 m            |
| Gold     | 10 m           |
| Platinum | 15 m           |

Promotion is automatic after admin verifies sessions.
