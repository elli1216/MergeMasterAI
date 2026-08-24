# ⚡ MergeMaster AI - Backend Setup & Architecture Guide

Welcome to the **MergeMaster AI Backend**! This service is built with **FastAPI**, **LangGraph**, and **Google Gemini** (with deterministic heuristics fallback) to autonomously analyze pull requests, enforce organizational policies, draft surgical bug/security fixes, generate unit tests, and provide interactive PR Copilot assistance for the **IBM AI Builders Challenge**.

---

## 🏛️ System Architecture

```
                               ┌────────────────────────────────┐
                               │     GitHub Pull Request Webhook│
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │     extract_diff (PyGithub)      │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │       analyze_changes            │
                              │ • Semantic RAG Memory            │
                              │ • Active Organizational Policies │
                              │ • Google Gemini LLM / Heuristics │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │        route_reviewers           │
                              │ • Dynamic Rule Pattern Matching  │
                              └────────────────┬─────────────────┘
                                               │
                          ┌────────────────────┴────────────────────┐
                          ▼                                         ▼
                [Status: Blocked]                         [Status: Approved/Pending]
                          │                                         │
                          ▼                                         ▼
            ┌───────────────────────────┐                           │
            │      committer_agent      │                           │
            │ • Drafts surgical fixes   │                           │
            │ • Pushes remediation commit                           │
            └─────────────┬─────────────┘                           │
                          │                                         │
                          └────────────────────┬────────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │          enforce_gate            │
                              │ • Commit Status Check (pending/  │
                              │   success/failure)               │
                              │ • Auto-opens Blocker Issue       │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │          record_result           │
                              │ • Syncs analysis to Convex DB    │
                              │ • Writes to ai_decisions_log     │
                              └──────────────────────────────────┘
```

---

## 1. ⚙️ Environment Configuration

Create a `.env` file in the `backend/` directory by copying from `.env.example`:

```env
# 1. GitHub App Credentials
GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your_generated_webhook_secret_here

# 2. Convex Cloud Database
CONVEX_URL=https://your-app.convex.cloud
CONVEX_ADMIN_KEY=prod:your-deploy-key

# 3. LLM Intelligence (Google Gemini)
GEMINI_API_KEY=AIzaSy...
LLM_API_BASE=https://generativelanguage.googleapis.com/v1beta/openai
LLM_MODEL=gemini-3.5-flash-lite

# 4. CORS & Server Settings
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://your-app.vercel.app
PORT=8000
```

### Where to get the credentials

- **`GITHUB_APP_ID`**: GitHub > Settings > Developer settings > GitHub Apps > General > App ID.
- **`GITHUB_PRIVATE_KEY`**: GitHub App General tab > Scroll to **Private keys** > **Generate a private key** (downloads `.pem` file).
- **`GITHUB_WEBHOOK_SECRET`**: A random secret string you generate and paste into both GitHub App Webhook Settings and `.env`.
- **`CONVEX_ADMIN_KEY`**: Convex Dashboard > Project Settings > **Deploy Keys**.
- **`GEMINI_API_KEY`**: Google AI Studio / Gemini API key dashboard.

---

## 2. 🚀 Running Locally

```powershell
# 1. Activate the Python virtual environment
.\venv\Scripts\Activate.ps1

# 2. Start the FastAPI development server with reload
python main.py
```

The server starts on `http://0.0.0.0:8000`.

---

## 3. 🌐 Setting Up Local Webhook Tunnel (ngrok)

To receive webhooks from GitHub during local development:

```powershell
# In a separate terminal:
ngrok http 8000
```

Copy the forwarding HTTPS URL (e.g. `https://a1b2c3d4.ngrok-free.app`):

1. Open your GitHub App settings.
2. Set **Webhook URL** to:

   ```
   https://a1b2c3d4.ngrok-free.app/api/webhooks/github
   ```

3. Set **Webhook secret** to match `GITHUB_WEBHOOK_SECRET`.
4. Save changes and trigger a test delivery.

---

## 4. 🐳 Production Deployment (Render - Dockerized)

The backend is fully containerized with [`Dockerfile`](file:///C:/Users/elli/Documents/programs/MergeMasterAI/backend/Dockerfile):

1. Connect your repo on [Render Dashboard](https://dashboard.render.com/) as a **Web Service**.
2. **Root Directory**: `backend`
3. **Runtime**: `Docker`
4. **Health Check Path**: `/healthz`
5. Configure the environment variables listed in Step 1.
6. Set the GitHub Webhook URL to:

   ```
   https://<your-render-backend-name>.onrender.com/api/webhooks/github
   ```

### ⏰ Keep-Alive Ping (`/ping`)

To prevent Render's free-tier container from sleeping after 15 minutes of inactivity:

- Set up a free 5-10 minute HTTP monitor at `https://cron-job.org` or `https://uptimerobot.com`.
- **Ping URL**: `https://<your-render-backend-name>.onrender.com/ping`
- **Expected response**: `{"status": "pong"}`

---

## 5. 📡 REST API Reference

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` & `/healthz` | Health check probe for Docker & Render |
| `GET` / `HEAD` | `/ping` | Keep-alive heartbeat endpoint for uptime pingers |
| `POST` | `/api/webhooks/github` | Webhook receiver for GitHub `pull_request` and `installation` events |
| `POST` | `/api/reviews` | On-demand LangGraph PR analysis triggered from the dashboard |
| `POST` | `/api/chat` | Interactive PR Copilot Q&A with diff context & findings |
| `POST` | `/api/generate-tests` | Synthesizes autonomous unit test suites (PyTest / Jest / Vitest) |
| `POST` | `/api/push-tests` | Commits generated unit test files directly to the PR branch |
