# Admin UI — CLAUDE.md

## Scope — read this first

You are working on the **React admin dashboard only**.
Your entire working directory is `admin_ui/`. 

**Do not edit or suggest changes to any file outside `admin_ui/` (except creating new files in `Docs/`).
You may read files outside `admin_ui/` for reference — e.g. to check what an API endpoint returns or how a model is structured.
If a task seems to require a backend change, stop and tell the user to contact the backend developer. Do not attempt the change yourself.**

---

## What this app is

A React + Vite admin dashboard for the Faculty Appraisal System at DYP University.
It is served directly from the FastAPI backend at the `/panel` path.
All API calls go to `/api/v1/*` on the same origin — no CORS configuration is needed.

---

## Project structure

```
admin_ui/
├── index.html
├── vite.config.js        ← DO NOT change base or proxy settings
├── package.json
├── src/
│   ├── main.jsx          ← DO NOT change BrowserRouter basename
│   ├── App.jsx           ← Route definitions — add new pages here
│   ├── api/
│   │   └── client.js     ← All backend API calls live here
│   ├── layouts/
│   │   └── AdminLayout.jsx
│   └── pages/            ← Build page components here
```

---

## Hard rules

### Never touch these two lines

```js
// vite.config.js
base: '/panel/'           // DO NOT change — breaks production if altered
```

```jsx
// src/main.jsx
<BrowserRouter basename="/panel">   // DO NOT change — breaks all routing if altered
```

These values are tightly coupled to the backend serving configuration.
Any change here requires a coordinated backend change. Contact the backend developer.

### Never edit files outside admin_ui/

The backend is a FastAPI application. Files like `src/main.py`, `src/api/`,
`src/models/`, `Dockerfile`, `pyproject.toml`, etc. are off-limits.
If you identify something that needs to change on the backend side, tell the user
what is needed and why — do not touch the files.

**One exception:** you may create new documentation files inside `Docs/` (e.g. `Docs/admin_ui_notes.md`).
Do not edit any existing files in `Docs/` — they are maintained by the backend developer.

---

## Making API calls

All API calls must go through `src/api/client.js`. Do not write raw `fetch` or
`axios` calls inside components. If a new endpoint is needed, add a method to
`client.js`.

```js
import { api } from '../api/client'

// Auth
await api.login(email, password)
api.logout()
api.getProfile()

// Faculty / users
await api.users.list({ school: 'SoCSEA', role: 'faculty' })
await api.users.create({ email, password, full_name, appraisal_role })
await api.users.update(email, { full_name, appraisal_role })
await api.users.remove(email)

// Submission stats
await api.stats.get('2025-26')

// Feedback
await api.feedback.list({ category: 'bug' })
await api.feedback.get(id)

// Settings
await api.config.get()
await api.config.update({ APP_URL: '...' })
```

### Error handling

Every API error from the backend has a `user_message` field — always show that
string in the UI. The `detail` field is for developers only, never render it.

```js
try {
  await api.users.create(data)
} catch (err) {
  showToast(err.message)  // api/client.js already extracts user_message into err.message
}
```

---

## Available backend endpoints

These already exist and are ready to call:

| Method | Path | What it does |
|---|---|---|
| POST | `/api/v1/auth/login` | Login, returns JWT token |
| GET | `/api/v1/admin/stats` | Submission counts by school/year |
| GET | `/api/v1/admin/users` | List users (filterable by school, role, search) |
| POST | `/api/v1/admin/users` | Create a user |
| PUT | `/api/v1/admin/users/{email}` | Update a user (including password reset) |
| DELETE | `/api/v1/admin/users/{email}` | Delete a user |
| GET | `/api/v1/admin/config` | Read editable server config |
| PUT | `/api/v1/admin/config` | Update server config |
| GET | `/api/v1/feedback` | List feedback (admin only) |
| GET | `/api/v1/feedback/{id}` | Get one feedback entry |

If a feature you are building needs an endpoint that is not in this list,
**tell the user** — do not try to build or modify the backend endpoint yourself.

---

## Local development

```bash
# Terminal 1 — backend (run from project root, not admin_ui/)
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd admin_ui
npm install
npm run dev    # http://localhost:5174/panel/
```

---

## Roles in the system

The logged-in user will always have `appraisal_role = "admin"`.
The `api/client.js` login function already enforces this and throws if the role is wrong.

Other roles that exist in the system (faculty data you will display):
`faculty`, `hod`, `director`, `dean`, `vc`, `registrar`, `non_teaching_staff`

Schools: `SoCSEA`, `SoBB`, `SoCE`, `SoEMR`, `SoC`, `CISR`, `SoMCS`, `CioD`, `SoAA`

---

## Pages to build

```
Dashboard
Faculty Management  →  /faculty
Appraisal Management  →  /appraisal
Submission Tracking  →  /submissions
Credential Management  →  /credentials
Analytics & Reports  →  /analytics
Feedback & Support  →  /feedback
Announcements  →  /announcements
Settings  →  /settings
```

Routes are already defined in `src/App.jsx` — swap the placeholder components
with real ones as you build them.

---

## Installing packages

You may freely add frontend packages to `package.json` (UI libraries, chart libraries, etc.).
Do not add Python packages or modify `pyproject.toml`.
