# PBAS Admin UI

A React + Vite admin dashboard for the Performance Based Appraisal System (PBAS). This repository contains the decoupled admin UI, which can be configured and deployed independently to support multiple modules (e.g., Faculty Appraisal, Outcome-Based Education (OBE), etc.).

---

## Features

- **Decoupled Architecture:** Runs as a standalone Single Page Application (SPA).
- **Multi-Module Support:** Can point to different backend API servers using environment variables.
- **Configurable Paths:** Custom routing basename and public asset paths.
- **Pre-built API Client:** Standardized, central API calls with automatic token attachments and security logging.

---

## Quick Start

### 1. Installation

Install the frontend dependencies:
```bash
npm install
```

### 2. Configuration

Copy the example environment file and configure it:
```bash
cp .env.example .env
```

Review and adjust variables in `.env` (details below).

### 3. Run Development Server

Start the Vite development server:
```bash
npm run dev
```

Open `http://localhost:5174/panel/` (or whatever path you set in `VITE_ROUTER_BASENAME`) in your browser.

---

## Environment Variables (.env)

The application uses the following environment variables:

| Variable | Description | Example / Default |
|---|---|---|
| `VITE_BACKEND_URL` | Staging/development backend URL used by the local Vite dev proxy to avoid CORS issues during dev. | `https://api.staging.com` |
| `VITE_APP_BASE_PATH` | The public base path for Vite build assets (must start and end with `/`). | `/panel/` or `/` |
| `VITE_ROUTER_BASENAME` | The basename for React Router. Matches the path under which the app is served. | `/panel` or `/` |
| `VITE_API_BASE_URL` | The backend API prefix. Use `/api/v1` if served on same origin, or absolute URL for standalone deployment. | `/api/v1` or `https://api.yourdomain.com/api/v1` |

---

## Development vs Standalone Standalone Deployment Modes

This admin UI supports two primary deployment strategies:

### Option A: Served from the Backend (Same-Origin)
Suitable when the backend FastAPI (or similar) server acts as a reverse proxy, hosting the built static files under a subpath (e.g., `/panel`).
- **`.env` Configuration:**
  ```env
  VITE_APP_BASE_PATH=/panel/
  VITE_ROUTER_BASENAME=/panel
  VITE_API_BASE_URL=/api/v1
  ```
- **Deployment:**
  1. Build the app using `npm run build`.
  2. Copy the contents of the `dist/` directory to the backend static assets directory (e.g., `/static/panel` or wherever the backend router serves panel files).

### Option B: Standalone SPA Deployment (Recommended for Multi-Module)
Suitable when deploying to static hosting services like **Netlify**, **Vercel**, **Cloudflare Pages**, or **Firebase Hosting**.
- **`.env` Configuration:**
  ```env
  VITE_APP_BASE_PATH=/
  VITE_ROUTER_BASENAME=/
  VITE_API_BASE_URL=https://your-backend-api.com/api/v1
  ```
- **Deployment:**
  1. Set up your static hosting provider to point to this repository.
  2. Configure build settings:
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
  3. Set up the environment variables (`VITE_APP_BASE_PATH`, `VITE_ROUTER_BASENAME`, `VITE_API_BASE_URL`) in the hosting provider's dashboard.
  4. **SPA Routing Redirect Rule:** Add redirect configurations (e.g., `_redirects` for Netlify, `vercel.json` for Vercel) to rewrite all requests back to `/index.html` to support React Router client-side routing.

---

## Project Structure

```
pbas_admin/
├── index.html
├── vite.config.js       ← Configured to read environment variables
├── package.json
├── .env.example
├── src/
│   ├── main.jsx         ← Router basename read dynamically from VITE_ROUTER_BASENAME
│   ├── App.jsx          ← Router configurations
│   ├── api/
│   │   └── client.js    ← API client using dynamic VITE_API_BASE_URL & LOGIN_PATH
│   ├── layouts/
│   │   └── AdminLayout.jsx
│   └── pages/           ← UI Page components
```

---

## Making API Calls

All API calls must be routed through `src/api/client.js`. Import and call methods from the `api` object:

```js
import { api } from '../api/client'

// Login (enforces admin/super_admin role)
await api.login(email, password)

// List users filterable by school, role, or search
await api.users.list({ school: 'SoCSEA', role: 'faculty' })
```
