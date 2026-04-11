# Notemark – Supabase Migration Guide

This branch replaces the Express + MongoDB backend with **Supabase** (Postgres + Auth).  
The client now talks directly to Supabase; no backend server is needed.

---

## Architecture change

| | Before | After |
|---|---|---|
| Auth | Custom JWT (Express + bcrypt) | Supabase Auth (built-in) |
| Database | MongoDB (Mongoose) | Supabase Postgres (JSONB columns) |
| API layer | Express server (`/server`) | Supabase JS client (browser) |
| Data isolation | `protect` middleware checks JWT | **Row Level Security** on `note_states` |

---

## Setup (5 steps)

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com) → New project. Note your **Project URL** and **anon public key** from *Project Settings → API*.

### 2. Run the schema SQL
In *Supabase Dashboard → SQL Editor*, paste and run the contents of:

```
supabase/schema.sql
```

This creates:
- `public.note_states` — one row per user, stores all notes as JSONB
- `public.profiles` — username linked to `auth.users`
- RLS policies so every user can only read/write their own row
- A trigger that auto-creates a profile on sign-up

### 3. Configure the client
```bash
cd client
cp .env.example .env
# Edit .env and fill in your Supabase URL and anon key
```

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Install dependencies
```bash
cd client
npm install   # adds @supabase/supabase-js
```

### 5. Run
```bash
npm run dev
```
The `/server` directory is **no longer needed** and can be deleted.

---

## How Row Level Security works

The `note_states` table has four RLS policies:

```sql
-- Only the owning user can SELECT their row
create policy "Users can read their own note state"
  on public.note_states for select
  using ( auth.uid() = user_id );

-- … same pattern for INSERT, UPDATE, DELETE
```

`auth.uid()` is automatically set by Supabase from the JWT that the client sends with every request (the anon key alone is not enough — a logged-in session is required). Even if someone knows another user's `user_id`, the database will reject any query that crosses the boundary.

---

## What changed in the code

| File | Change |
|---|---|
| `client/src/lib/supabase.js` | **New** – Supabase client singleton |
| `client/src/context/AuthContext.jsx` | Replaced custom fetch/JWT with `supabase.auth.*` |
| `client/src/utils/notesApi.js` | Replaced REST calls with `supabase.from('note_states')` |
| `client/src/hooks/useNotes.js` | Removed `token` parameter (Supabase handles sessions) |
| `client/src/components/NotemarkApp.jsx` | Removed `token` from `useAuth()` destructure |
| `client/package.json` | Added `@supabase/supabase-js` |
| `supabase/schema.sql` | **New** – full DB schema + RLS |
| `server/` | **Retired** – delete or archive |

---

## Email confirmation

By default Supabase requires email confirmation before a user can sign in.  
To disable it during development: *Dashboard → Authentication → Providers → Email → Confirm email: OFF*.
