# CRM Starter (React + Express + MongoDB + JWT)

This is a minimal CRM starter with a React frontend and an Express backend using
MongoDB (Mongoose) and JWT authentication.

## Structure

- `frontend/` React app (Vite)
- `backend/` Express API

## Quick Start

### Backend

1. `cd backend`
2. Create a `.env` file with:

```
PORT=4000
MONGO_URI=mongodb://localhost:27017/crm
JWT_SECRET=change_me
ALLOWED_DOMAIN=crm.com
```

3. Update `MONGO_URI` and `JWT_SECRET`
4. `npm install`
5. `npm run dev`

API runs on `http://localhost:4000`.

### Frontend

1. `cd frontend`
2. `npm install`
3. `npm run dev`

App runs on `http://localhost:5173`.

### Test

- First user can register with `companyName` and `companyDomain`.
- After that, create an invite and register using the invite token.

## Notes

- To use PostgreSQL instead of MongoDB, swap the DB layer and models.
