# note■mark

A clean, keyboard-friendly Markdown notes app — now powered entirely by **Supabase**.

No backend server required. Auth, database, and Row Level Security are all handled by Supabase.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Auth | Supabase Auth (email/password) |
| Database | Supabase Postgres (JSONB) |
| Data isolation | Row Level Security (RLS) |
| Markdown | marked + highlight.js + DOMPurify |

---

## Quick start

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New project.

Copy your **Project URL** and **anon public key** from:
*Dashboard → Project Settings → API*

### 2. Run the database schema

In *Dashboard → SQL Editor*, run the file:

```
supabase/schema.sql
```

This sets up the `note_states` table, the `profiles` table, RLS policies, and a sign-up trigger.

### 3. Configure environment variables

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Install and run

```bash
npm run install:all
npm run dev
```

App runs at **http://localhost:5173**

---

## Features

- **Markdown editor** with live preview and syntax highlighting
- **File tree** with folders, drag-and-drop, inline rename, right-click menu
- **Auto-save** with debounce (1.5 s) + manual save (Ctrl+S)
- **Keyboard shortcuts**: Ctrl+S save, Ctrl+P preview, Ctrl+B sidebar, Ctrl+F search
- **Responsive** — sidebar collapses on mobile

---

## How Row Level Security works

Every user's notes are stored in a single row in `public.note_states`.
Postgres RLS policies ensure:

```sql
-- Users can only touch their own row
using ( auth.uid() = user_id )
```

The Supabase anon key is safe to ship in the browser because RLS enforces
isolation at the database level — not in application code.

---

## Project structure

```
notemark/
├── client/
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase.js          ← Supabase client singleton
│   │   ├── context/
│   │   │   └── AuthContext.jsx      ← Supabase Auth (login/register/logout)
│   │   ├── utils/
│   │   │   └── notesApi.js          ← Supabase DB queries
│   │   ├── hooks/
│   │   │   └── useNotes.js          ← All note state + auto-save logic
│   │   └── components/
│   │       ├── NotemarkApp.jsx      ← Main app shell
│   │       ├── AuthPage.jsx         ← Login / register form
│   │       ├── FileTree.jsx         ← Sidebar file explorer
│   │       ├── Toolbar.jsx          ← Markdown formatting toolbar
│   │       └── Preview.jsx          ← Rendered markdown view
│   ├── .env.example
│   └── package.json
└── supabase/
    └── schema.sql                   ← DB schema + RLS policies (run once)
```

---

## Email confirmation

Supabase requires email confirmation by default.
To disable during development:
*Dashboard → Authentication → Providers → Email → Confirm email → OFF*
