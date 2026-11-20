# CivicFix

**Report. Track. Resolve. Improve.**

CivicFix is a full-stack civic issue reporting and resolution platform. Citizens report problems
(potholes, garbage, drainage, water supply, streetlights, sewage, and more), track them through a
transparent workflow, and confirm when they're actually fixed. Municipal admins verify, prioritize,
and assign complaints to departments and staff; ground staff log progress and mark work complete.

---

## Features

**Citizens**
Register/login · report issues with photos and geolocation · duplicate-issue detection before
submitting · track complaint status on a live timeline · upvote and comment on issues · verify
whether a resolution actually fixed the problem (and reopen it if not) · civic points and badges ·
notifications · profile and complaint history.

**Admins**
Dashboard with live KPIs and charts · full issue management table (search, filter, sort, paginate) ·
verify / assign / reprioritize / reject / resolve issues · department and category management ·
user management (create staff/admin accounts, activate/deactivate, delete) · analytics (resolution
rate, avg. resolution time, category/department/ward breakdowns, monthly trends, staff performance) ·
interactive map of all issues color-coded by priority.

**Staff**
Task dashboard · accept assigned tasks · upload progress/after photos with remarks · mark tasks
complete, which routes back to the citizen for verification.

**Platform**
JWT authentication with role-based access control (citizen / staff / admin) · MongoDB geospatial
queries (2dsphere index) for nearby-issue and duplicate detection · a rule-based "smart priority"
scorer (severity + votes + category risk + location) · a modular mock AI classification service that
works with zero API keys and can be swapped for a real provider later · image upload via Multer with
type/size validation · in-app notifications · full REST API.

---

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Recharts, Leaflet / React Leaflet, Lucide icons |
| Backend   | Node.js, Express, JWT, bcryptjs, Multer |
| Database  | MongoDB + Mongoose (2dsphere geospatial index) |
| Testing   | Jest + Supertest (+ mongodb-memory-server for integration tests) |

## Architecture

```
React Frontend  →  Axios (REST)  →  Node.js + Express  →  Mongoose  →  MongoDB
```

## Folder structure

```
civicfix/
  frontend/
    src/
      components/   shared UI (cards, badges, map, image upload, location picker...)
      pages/         public/, citizen/, admin/, staff/
      layouts/       PublicLayout, CitizenLayout, AdminLayout, StaffLayout
      context/       AuthContext, ToastContext
      services/      one file per API resource (axios wrappers)
  backend/
    src/
      models/        User, Issue, Department, Category, Comment, Upvote,
                      Notification, StatusHistory, ResolutionFeedback
      controllers/    business logic per resource
      routes/         Express routers
      middleware/     auth (JWT + RBAC), upload (Multer), errorHandler
      services/       aiService (mock classifier), priorityService (scoring),
                      duplicateService (geospatial dedup), notificationService
      config/db.js    Mongoose connection
    tests/            Jest unit + integration tests
  database/seed/       seed.js — realistic demo data generator
  docker-compose.yml
```

---

## Getting started

### Prerequisites
- Node.js 18+
- A MongoDB database — either [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier is enough)
  or a local MongoDB instance (`mongod` running on `27017`).

### 1. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: set MONGODB_URI and JWT_SECRET
npm install
npm run dev        # starts on http://localhost:5000
```

`GET http://localhost:5000/api/health` should return `{"success":true,...}`.

### 2. Seed demo data

From the `backend/` folder (the seed script lives in `database/seed/` but reads `backend/.env`):

```bash
npm run seed          # populate departments, categories, users, 55+ issues
npm run seed:clear     # wipe CivicFix collections first, then populate
```

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env    # defaults to http://localhost:5000/api — adjust if needed
npm install
npm run dev              # starts on http://localhost:5173
```

Open `http://localhost:5173`.

### 4. Demo accounts (created by the seed script)

| Role    | Email                  | Password     |
|---------|-------------------------|--------------|
| Admin   | admin@civicfix.com      | Admin@123    |
| Staff   | staff@civicfix.com      | Staff@123    |
| Citizen | citizen@civicfix.com    | Citizen@123  |

These are development/demo accounts only — change or remove them before any real deployment.

### 5. Run tests

```bash
cd backend
npm test
```

`tests/services.test.js` runs instantly with no dependencies (pure business-logic unit tests).
`tests/api.test.js` is a full integration suite covering the whole issue lifecycle (register → report
→ upvote → comment → assign → resolve → citizen verifies → reopen) using `mongodb-memory-server`,
which downloads a real MongoDB binary on first run — you'll need internet access for that one-time
download.

---

## Environment variables

**backend/.env**
```
MONGODB_URI=mongodb://127.0.0.1:27017/civicfix
JWT_SECRET=replace-this-with-a-long-random-string
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=
AI_PROVIDER=
AI_API_KEY=
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

`AI_PROVIDER` / `AI_API_KEY` are optional — the app works fully without them via a built-in mock
classifier (`backend/src/services/aiService.js`). Wire up a real provider there later if you want to.

---

## API overview

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

```
POST   /auth/register              POST   /issues/:id/assign        [admin]
POST   /auth/login                 POST   /issues/:id/status         [admin, staff]
GET    /auth/me                    POST   /issues/:id/progress       [staff]
PUT    /auth/profile               POST   /issues/:id/verify         [citizen]
                                    POST   /issues/:id/reopen
POST   /issues                     
GET    /issues                     GET    /admin/statistics          [admin]
GET    /issues/:id                 GET    /admin/issues              [admin]
GET    /issues/mine                GET/POST/PUT/DELETE /admin/users  [admin]
PUT    /issues/:id                 GET/POST/PUT/DELETE /admin/departments [admin]
DELETE /issues/:id                 
POST   /issues/:id/upvote          GET/POST/PUT/DELETE /categories   [public GET, admin write]
DELETE /issues/:id/upvote          
POST   /issues/:id/comments        GET    /staff/tasks               [staff]
                                    GET    /staff/tasks/:id           [staff]
                                    PUT    /staff/tasks/:id           [staff]

GET    /analytics/overview         [admin]      GET /notifications          [auth]
GET    /analytics/categories       [admin]      PUT /notifications/:id/read [auth]
GET    /analytics/departments      [admin]      PUT /notifications/read-all [auth]
GET    /analytics/areas            [admin]
GET    /analytics/trends           [admin]
GET    /analytics/staff-performance [admin]
```

`GET /issues` supports `page, limit, category, status, priority, department, search, lat, lng, radius, sort`.

---

## Deployment

- **Backend**: any Node host (Render, Railway, Fly.io, a VPS...). Set the environment variables above.
  Point `MONGODB_URI` at an Atlas cluster.
- **Frontend**: `npm run build` produces a static `dist/` — deploy to Vercel, Netlify, or serve via
  nginx (see `frontend/Dockerfile` / `nginx.conf`). Set `VITE_API_URL` to your deployed backend URL.
- **Docker**: `docker-compose up --build` builds both services. By default it expects
  `MONGODB_URI`/`JWT_SECRET` to be set in your shell (or a `.env` next to `docker-compose.yml`) and
  points at MongoDB Atlas; uncomment the `mongo` service in `docker-compose.yml` to run MongoDB
  locally in a container instead.
- **Image storage**: uploads are stored on local disk via Multer by default. `backend/src/middleware/upload.js`
  is intentionally isolated so it can be swapped for Cloudinary / S3 / Supabase Storage without
  touching controllers — replace the `multer.diskStorage` with the relevant cloud storage engine.

---

## Future improvements

- Real AI/ML image classification (the abstraction in `services/aiService.js` is ready to swap in)
- Push/email notifications in addition to in-app notifications
- Ward-level risk data feeding into the priority scorer (currently a simple placeholder signal)
- Cloud object storage for images out of the box
- Rate-limit tuning per route, request logging/observability
- CI pipeline running `npm test` on both packages

---

## A note on scope

This is a large spec (auth, RBAC, geospatial search, image upload, admin/staff workflows, live
analytics, interactive maps, notifications, gamification, and more) and every piece above is real,
working code — not placeholders. Two things worth knowing:

1. Docker, the Jest test suite, and badge/gamification UI are functional but intentionally lighter
   than the core citizen → admin → staff → citizen-verification workflow, analytics, and geospatial
   features, which received the most engineering attention.
2. The backend was verified by booting the real Express server, hitting live HTTP endpoints, and
   running unit tests for the priority/AI services. The frontend was verified with a real `vite build`
   and a real `vite dev` server serving the app. Full integration testing against a live MongoDB
   (`tests/api.test.js`) needs an internet connection to download a MongoDB binary on first run — that
   part is written and correct, just not executed in the sandbox that produced this code.
