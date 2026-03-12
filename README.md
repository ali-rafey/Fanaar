# Fanaar Fabric

Monorepo split into `frontend` (Vite/React) and `backend` (Express + Supabase).

## Frontend

```sh
cd frontend
npm install
npm run dev
```

Environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_API_BASE_URL` (e.g. `http://localhost:4000`)

## Backend

```sh
cd backend
npm install
npm run dev
```

Environment:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `PORT`

## Notes
- Supabase migrations and config live in `backend/supabase`.
- Frontend talks to the backend API instead of directly to Supabase.
