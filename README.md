# Notemark ⚡

A full-stack Markdown note-taking app converted from a single HTML file into a React + Express + MongoDB project.

---

## Features

- 📝 **Markdown editor** with live preview
- 🎨 **Syntax highlighting** via highlight.js (Tokyo Night Dark theme)
- 🌲 **File tree** with nested folders, drag-and-drop, context menus
- 🔐 **Authentication** — JWT-based register/login/logout
- ☁️ **MongoDB storage** — all notes synced to the cloud per user
- 💾 **Auto-save** with debounced sync indicator
- ⌨️ **Toolbar** for Markdown formatting (bold, italic, headings, code blocks, links, etc.)
- ⬇️ **Download** any note as a `.md` file

---

## Project Structure

```
notemark/
├── package.json            ← root (runs both server + client)
│
├── server/
│   ├── index.js            ← Express entry point
│   ├── .env.example        ← copy to .env and fill in values
│   ├── models/
│   │   ├── User.js         ← User schema (bcrypt passwords)
│   │   └── NoteState.js    ← Full notes state per user
│   ├── routes/
│   │   ├── auth.js         ← /api/auth/register|login|me
│   │   └── notes.js        ← /api/notes (GET/PUT/PATCH/DELETE)
│   └── middleware/
│       └── auth.js         ← JWT protect middleware
│
└── client/
    ├── vite.config.js      ← Vite + proxy to :5000
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── hooks/
    │   │   └── useNotes.js
    │   ├── components/
    │   │   ├── AuthPage.jsx
    │   │   ├── NotemarkApp.jsx
    │   │   ├── FileTree.jsx
    │   │   ├── Toolbar.jsx
    │   │   ├── Preview.jsx
    │   │   ├── Modal.jsx
    │   │   └── ContextMenu.jsx
    │   └── utils/
    │       ├── markdown.js
    │       └── notesApi.js
    └── styles/
        └── globals.css
```

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- MongoDB running locally (`mongod`) **or** a MongoDB Atlas URI

### 2. Clone & Install

```bash
# Install root deps (concurrently)
npm install

# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..
```

### 3. Configure Environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/notemark
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

> For MongoDB Atlas: replace `MONGODB_URI` with your Atlas connection string.

### 4. Run

```bash
# From project root — starts both server and client
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | ✗ | Register new user |
| POST | `/api/auth/login` | ✗ | Login, returns JWT |
| GET  | `/api/auth/me` | ✓ | Get current user |
| GET  | `/api/notes` | ✓ | Load full notes state |
| PUT  | `/api/notes` | ✓ | Save full notes state |
| PATCH | `/api/notes/file/:id` | ✓ | Update single file |
| DELETE | `/api/notes/file/:id` | ✓ | Delete single file |

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite |
| Markdown | marked v9 |
| Syntax highlighting | highlight.js (Tokyo Night Dark) |
| Backend | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Dev | concurrently, nodemon |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` / `Cmd+S` | Save immediately |

---

## Deployment Notes

- Set `CLIENT_URL` in `.env` to your production frontend URL (for CORS)
- Use a strong random `JWT_SECRET`
- Use MongoDB Atlas for production database
- Build frontend: `cd client && npm run build` → serve `dist/` statically or via Nginx/Vercel
