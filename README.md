<div align="center">

# ✦ Fanaar

### *Where code meets cloth*

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

<br/>

**A web application for textile‑passionate people who want to explore the fabric of the world—**  
from stories and blogs to curated pieces, categories, and a shop‑floor feel in the browser.

<p align="center"><em>threads · stories · discovery</em></p>

</div>

---

## About

**Fanaar** is built for anyone who treats textiles as more than material—for curious minds who follow a thread from loom to lookbook, and who want one place to *discover*, *read*, and *browse* the textile world with clarity and care.

The project is **initiated by [Ali Anees](https://github.com/ali-rafey)**. By profession he ships software; by heart he is never far from yarn counts, weave structures, and the quiet drama of a good drape. Fanaar exists because those two identities refused to stay in separate rooms: it pairs the discipline of engineering with the obsession of a textile enthusiast—so explorers like you get a fast, thoughtful surface to wander the world of fabric without leaving the tab open on “just one more article.”

---

## Repository layout

| Area | Stack | Role |
|------|--------|------|
| **`frontend/`** | Vite · React · TypeScript | Shop experience, storytelling, admin tools |
| **`backend/`** | Express · TypeScript · Supabase | API, auth flows, uploads, data layer |
| **`backend/supabase/`** | SQL migrations | Schema & database evolution |

---

## Getting started

### Prerequisites

- **Node.js** (LTS recommended)
- A **Supabase** project (URL + anon key)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dev server defaults to **port 8080** (see `vite.config.ts`).

**Environment** — copy or create `frontend/.env`:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon / public key |
| `VITE_API_BASE_URL` | Backend base URL, e.g. `http://localhost:4000` |

### Backend

```bash
cd backend
npm install
npm run dev
```

**Environment** — copy or create `backend/.env`:

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `PORT` | Optional; defaults to **4000** |
| `ALLOWED_ORIGINS` | Optional; comma‑separated CORS origins (defaults include `localhost:8080` and `5173`) |

> **Note:** On some Node versions, `npm run dev` may require running TypeScript entrypoints via a compatible runner (e.g. `tsx`). Adjust locally if your environment does not resolve `.ts` with the default script.

---

## License & heart

Built with curiosity for **textile people** and respect for the craft.  
If Fanaar helps you explore one more weave, one more story, or one more shade—thread well.

<div align="center">

<sub>— Ali Anees · Fanaar —</sub>

</div>
