# GrowEasy CSV Importer

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20mapping-8E75B2?logo=googlegemini&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

An AI-powered CSV importer built for the GrowEasy Software Developer assignment. Upload a CSV
in **any** layout — Facebook Lead Ads exports, Google Ads exports, hand-built spreadsheets,
other CRM exports — and the AI maps whatever columns it finds into GrowEasy's fixed CRM schema.

## Tech stack

<table>
<tr>
<td valign="top" width="50%">

**Backend**

![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/-Express-000000?logo=express&logoColor=white)
![Google Gemini](https://img.shields.io/badge/-Google%20Gemini%20API-8E75B2?logo=googlegemini&logoColor=white)
![csv-parse](https://img.shields.io/badge/-csv--parse%20%2F%20csv--stringify-000000?logo=csv&logoColor=white)
![Multer](https://img.shields.io/badge/-Multer%20(uploads)-000000)

</td>
<td valign="top" width="50%">

**Frontend**

![Next.js](https://img.shields.io/badge/-Next.js-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/-Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white)
![PapaParse](https://img.shields.io/badge/-PapaParse-6DB33F)
![Lucide](https://img.shields.io/badge/-lucide--react-F56565)

</td>
</tr>
</table>

**DevOps:** ![Docker](https://img.shields.io/badge/-Docker-2496ED?logo=docker&logoColor=white) ![Docker Compose](https://img.shields.io/badge/-Docker%20Compose-2496ED?logo=docker&logoColor=white)

```
groweasy-csv-importer/
├── backend/     Express API — CSV parsing, batched AI field mapping, validation
├── frontend/    Next.js app — upload, preview, confirm, results
└── docker-compose.yml
```

## How it works

![Next.js](https://img.shields.io/badge/Upload-Next.js%20UI-000000?logo=next.js&logoColor=white) → ![PapaParse](https://img.shields.io/badge/Preview-PapaParse-6DB33F) → ![Express](https://img.shields.io/badge/Parse-Express-000000?logo=express&logoColor=white) → ![Gemini](https://img.shields.io/badge/Map%20Fields-Google%20Gemini-8E75B2?logo=googlegemini&logoColor=white) → ![Validate](https://img.shields.io/badge/Validate-Server--side-informational) → ![Result](https://img.shields.io/badge/Import-CRM%20Schema-success)

1. **Upload** — drag a CSV onto the page, or pick a file.
2. **Preview** — the browser parses the file locally (no AI, no network call yet) and shows it
   in a scrollable, sticky-header table, plus a best-guess illustration of how your columns will
   map onto CRM fields.
3. **Confirm** — clicking confirm sends the original file to the backend.
4. **Import** — the backend parses the CSV itself (never trusting column names to be fixed),
   batches the rows, and asks Google Gemini to map each row onto the CRM schema via a strict
   [response schema](backend/src/services/aiMappingService.js) so the response is always valid JSON.
   A validation pass then re-checks every enum value, date, and skip decision before anything is
   returned to the frontend.
5. **Result** — imported vs. skipped records, with reasons for anything skipped.

## Quick start (local, no Docker)

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env and set GEMINI_API_KEY (https://aistudio.google.com/apikey)
npm install
npm run dev        # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local   # defaults already point at localhost:4000
npm install
npm run dev         # http://localhost:3000
```

Open http://localhost:3000, upload a CSV, and go.

## Quick start (Docker)

```bash
export GEMINI_API_KEY=your-gemini-api-key
docker compose up --build
```

Frontend on http://localhost:3000, backend on http://localhost:4000.

## CRM fields & rules

The full field list and business rules (allowed `crm_status` / `data_source` values, date
format, handling of multiple emails/phones, skip conditions) live in
[`backend/src/config/constants.js`](backend/src/config/constants.js) and are enforced twice:
once by instructing the AI, and again in
[`backend/src/services/validationService.js`](backend/src/services/validationService.js), which
never trusts the model's output blindly — it re-derives the skip decision from the actual data,
blanks any value outside the allowed enums, and drops unparseable dates.

## Environment variables

**backend/.env** (see `backend/.env.example`):

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 4000) |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins |
| `GEMINI_API_KEY` | Required — your Google Gemini API key |
| `GEMINI_MODEL` | Model used for extraction (default `gemini-2.5-flash`) |
| `BATCH_SIZE` | Rows sent to the AI per request (default 25) |
| `MAX_ROWS` | Safety cap on rows per upload (default 5000) |

**frontend/.env.local** (see `frontend/.env.local.example`):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | URL of the backend API |

## Notes on design choices

- **Structured extraction, not free-text parsing.** The AI call forces a strict JSON response
  (`responseMimeType: "application/json"` + `responseSchema`, enums included), so we never have
  to regex a model's prose reply out of markdown fences.
- **Batching.** Rows are sent to the AI in configurable batches (default 25) rather than one
  giant request, keeping prompts small and making partial failures cheap to retry.
- **Defense in depth.** Every rule in the assignment (allowed enums, date validity, skip
  conditions, single-line CSV safety) is enforced again server-side after the AI responds, so a
  model mistake can't corrupt the CRM data.
- **Client-side preview, server-side truth.** The preview table parses the file in the browser
  purely for a fast, no-network preview. The actual import re-parses the original file on the
  server, so what gets imported is never dependent on the client's parsing.

## Deployment

Both apps are stateless and deploy cleanly to Vercel (frontend), and Render/Railway/Fly (backend).
Point the frontend's `NEXT_PUBLIC_API_BASE_URL` at wherever the backend ends up, and set
`CORS_ORIGIN` on the backend to the frontend's deployed URL.
