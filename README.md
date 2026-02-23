# CRM Starter (React + Express + MongoDB + JWT)

Full-stack CRM starter with a Vite + React SPA and an Express + MongoDB API. It covers auth, invites, contacts, deals, pipelines, activities, file attachments, dashboard stats, and basic user admin. JWT powers authentication; SendGrid or SMTP handle password reset emails.

## Features

- Auth flows: first user becomes company admin, later users join via invite tokens; login, logout, forgot/reset password.
- Contacts: create, search, update, tag, view notes and related deals/activities.
- Deals and pipelines: Kanban-like stages, probability, close dates, per-pipeline analytics.
- Activities: tasks/calls/emails/meetings with due dates, notifications for overdue/upcoming.
- File attachments: upload per contact or deal; served from [backend/uploads](backend/uploads).
- Dashboard: counts for contacts, open deals, total deal value, and due activities.
- User admin: list users, enable/disable, change role, reset password.

## Tech Stack

- Frontend: React 18, React Router 6, Vite.
- Backend: Express 4, MongoDB with Mongoose, JWT, Multer for uploads, Nodemailer/SendGrid for email.
- Tooling: Nodemon for local API reloads.

## Repository Layout

- [frontend](frontend): React SPA.
- [backend](backend): Express API and Mongoose models.
- [backend/uploads](backend/uploads): persisted uploaded files.

## Prerequisites

- Node.js 18+ and npm.
- MongoDB running locally or accessible via connection string.

## Quick Start (Local Dev)

1) Clone and open the repo, then set up the API:

```
cd backend
npm install
```

Create backend `.env` (see sample below), then run:

```
npm run dev
```

API defaults to http://localhost:4000 with CORS for http://localhost:5173.

2) In a second shell, start the frontend:

```
cd frontend
npm install
npm run dev
```

SPA serves at http://localhost:5173 (Vite).

## Backend Environment

Create backend/.env:

```
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/crm
JWT_SECRET=change_me
ALLOWED_DOMAIN=crm.com,anotherdomain.com

# Optional: password reset email
FRONTEND_URL=https://your-frontend-url
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM=verified@yourdomain.com

# SMTP fallback (if not using SendGrid)
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@example.com
SMTP_PASS=your_password
SMTP_FROM="CRM Support <you@example.com>"
```

Notes:

- `ALLOWED_DOMAIN` restricts which email domains may register; comma-separated.
- If no email provider is configured, the forgot-password route returns a raw token for manual testing.
- Update `FRONTEND_URL` so reset links point to your deployed SPA.

## Frontend Environment

Create frontend/.env.local (optional):

```
VITE_API_URL=http://localhost:4000
```

Defaults to http://localhost:4000 when unset.

## Seed Demo Data

The backend includes a seeder that wipes existing data and adds a demo company, admin, pipeline, contacts, deals, and activities.

```
cd backend
npm run seed
```

The seed uses `MONGO_URI` (or mongodb://127.0.0.1:27017/crm_dev as fallback).

## Key API Endpoints

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/forgot`, `/api/auth/reset`, `/api/auth/me`.
- Contacts: `/api/contacts` CRUD, search via `?search=`.
- Deals: `/api/deals` CRUD, filter by `?contactId=`.
- Activities: `/api/activities` CRUD, notifications at `/api/activities/notifications?days=7`.
- Pipelines: `/api/pipelines` CRUD, analytics at `/api/pipelines/:id/analytics`.
- Invites: `/api/invites` list/create, revoke with `/api/invites/:id/revoke`.
- Users (admin only): `/api/users` list; update role/status/password via subroutes.
- Files: `/api/files` list/upload/delete with optional `contactId` or `dealId` query/body.
- Dashboard: `/api/dashboard` stats.

See [backend/src/server.js](backend/src/server.js#L1) and route files under [backend/src/routes](backend/src/routes) for details.

## Auth Model

- First registration (no users yet) requires `companyName` and `companyDomain`; that user becomes admin.
- Subsequent users must register with an invite token created by an admin; email domain must match company domains and allowed list.
- JWT carries `sub`, `companyId`, and `role` claims; middleware enforces role-based access where needed.

## File Uploads

- Multer stores files in [backend/uploads](backend/uploads); served at `/uploads/...` via static middleware.
- SPA uses `resolveFileUrl()` to build absolute URLs.

## Useful Scripts

- Backend: `npm run dev` (nodemon), `npm start`, `npm run seed`.
- Frontend: `npm run dev`, `npm run build`, `npm run preview`.

## Troubleshooting

- 404 from API: ensure VITE_API_URL points at the API origin and CORS origins include your frontend URL.
- Mongo connection errors: verify `MONGO_URI` and that MongoDB is running.
- Reset emails not arriving: confirm `SENDGRID_*` or `SMTP_*` vars and `FRONTEND_URL`; in dev you can use the returned raw reset token.
