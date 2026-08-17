# PBAS Admin UI

A React + Vite admin dashboard for the Performance Based Appraisal System (PBAS). This repository contains the decoupled admin UI, which can be configured and deployed independently to support multiple modules (e.g., Faculty Appraisal, Outcome-Based Education (OBE), etc.).

---

## Features

- **Decoupled Architecture:** Runs as a standalone Single Page Application (SPA).
- **Multi-Module Support:** Can point to different backend API servers using runtime environment variables.
- **Runtime Environment Injection:** Supports simple Docker builds and loads environment variables dynamically at container runtime using Nginx configuration injection.
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

Open `http://localhost:5174/panel/` in your browser.

---

## Environment Variables (.env)

The application uses the following environment variables (both in `.env` files for development, and at container runtime for Docker):

| Variable | Description | Example / Default |
|---|---|---|
| `VITE_BACKEND_URL` | *(Development Only)* Vite dev proxy target to route local `/api` calls. | `http://localhost:8002` |
| `VITE_ROUTER_BASENAME` | React Router basename (path under which the UI is hosted). | `/panel` or `/` |
| `VITE_API_BASE_URL` | Backend API prefix. Absolute URL for standalone deployments or relative `/api/v1` for same-origin. | `/api/v1` or `http://localhost:8002/api/v1` |

---

## Docker Deployment (Using `--env-file`)

With our runtime configuration injection pattern, you do not need long build commands with build-args. You can build a generic image once and run it with different environment configurations.

### 1. Build the Docker Image
Run a simple Docker build command:
```bash
docker build -t pbas-admin .
```

### 2. Run the Container using an Env File
To run the container, use the `--env-file` parameter to pass your configuration (e.g., `.env.test` for testing, `.env` for development, or a production environment file):

```bash
docker run -d \
  --name pbas-admin-test \
  --env-file .env.test \
  -p 8080:8080 \
  pbas-admin
```

This runs Nginx on port `8080` and dynamically generates a `config.js` file with the environment variables from `.env.test`.

---

## Project Structure

```
pbas_admin/
├── index.html
├── vite.config.js       ← Standard Vite configuration
├── package.json
├── docker-entrypoint.sh ← Startup script that writes env variables into config.js
├── public/
│   └── config.js        ← Static config placeholder, dynamic in production
├── src/
│   ├── main.jsx         ← Reads basename dynamically from window.APP_CONFIG
│   ├── App.jsx          ← Router configurations
│   ├── api/
│   │   └── client.js    ← Reads API base URL dynamically from window.APP_CONFIG
```
