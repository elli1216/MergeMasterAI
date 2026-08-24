# 🚀 MergeMaster AI Deployment Guide

This guide details the complete production deployment setup for **MergeMaster AI**:

- **Frontend** on **Vercel**
- **Backend (Dockerized)** on **Render**
- **GitHub Webhook** pointing to Render
- **Convex** and **WorkOS** configurations

---

## 🏗️ Architecture & Data Flow

```
                     ┌──────────────────────────────────────────────┐
                     │          GitHub Webhook & PR API             │
                     └──────────────────────┬───────────────────────┘
                                            │
               1. Webhook Events (opened,   │  4. Commit Status Check Gate
                  synchronize, review)      │     & Blocker Issue / Fix Commits
                                            ▼
┌─────────────────────────┐          ┌──────────────────────────────────────────────┐
│     Frontend (Vercel)   │          │          Backend (Render - Docker)           │
│   TanStack Start + Vite │          │               FastAPI + Uvicorn              │
│                         │          │                                              │
│ • User OAuth Token      │──(REST)─▶│ • POST /api/reviews (On-demand AI Review)    │
│ • Interactive Copilot   │          │ • POST /api/chat (PR Copilot Q&A)            │
│ • Test Suite Generator  │          │ • POST /api/generate-tests & /push-tests     │
│ • Rules & Policies UI   │          │ • POST /api/webhooks/github (Webhook entry)  │
│ • Analytics ROI Cards   │          │ • LangGraph Pipeline + Gemini LLM / Heuristics│
└───────────┬─────────────┘          └──────────────────────┬───────────────────────┘
            │                                               │
            │ 2. Real-time Reactive Sync                    │ 3. Mutations & Decision Logs
            │    (Queries & Live Subscriptions)             │    (Admin Key Authorized)
            ▼                                               ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                   Convex Cloud                                    │
│   • pull_requests   • repositories   • custom_policies   • routing_rules          │
│   • chat_messages   • ai_decisions_log   • pr_embeddings                          │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. 🌐 Frontend Deployment (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
2. Select your `MergeMasterAI` GitHub repository.
3. Configure the Project Settings:
   - **Framework Preset**: `Vite` (or `Other`)
   - **Root Directory**: `frontend`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist/client`
   - **Install Command**: `pnpm install`
4. Add the following **Environment Variables** in Vercel:

   | Variable | Value / Description | Example |
   | --- | --- | --- |
   | `VITE_CONVEX_URL` | Your Convex Cloud deployment URL | `https://your-app.convex.cloud` |
   | `VITE_WORKOS_CLIENT_ID` | Your WorkOS Client ID | `client_YOUR_WORKOS_CLIENT_ID` |
   | `VITE_BACKEND_URL` | Your Render backend service URL | `https://your-app.onrender.com` |

5. Click **Deploy**.

---

## 2. 🐳 Backend Deployment (Render - Dockerized)

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New + > Web Service**.
2. Connect your `MergeMasterAI` GitHub repository.
3. Configure the service:
   - **Name**: `mergemaster-backend`
   - **Region**: Select region closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: `Starter`
4. Set Health Check Path:
   - **Health Check Path**: `/healthz`
5. Add the following **Environment Variables** in Render:

   | Variable | Value / Description |
   | --- | --- |
   | `PORT` | `8000` (or leave default, Render sets `$PORT`) |
   | `GITHUB_APP_ID` | Your GitHub App ID |
   | `GITHUB_PRIVATE_KEY` | Your GitHub App Private Key PEM (securely loaded from environment) |
   | `GITHUB_WEBHOOK_SECRET` | The Webhook secret string configured in your GitHub App |
   | `CONVEX_URL` | Your Convex deployment URL (e.g. `https://your-app.convex.cloud`) |
   | `CONVEX_ADMIN_KEY` | Convex Deploy Key (`Convex Dashboard > Project Settings > Deploy Keys`) |
   | `GEMINI_API_KEY` | Your Google Gemini API Key |
   | `LLM_API_BASE` | `https://generativelanguage.googleapis.com/v1beta/openai` |
   | `LLM_MODEL` | `gemini-3.5-flash-lite` |
   | `CORS_ORIGINS` | `https://<your-vercel-app>.vercel.app,http://localhost:3000` |

6. Click **Create Web Service**.

---

## 3. 🎣 GitHub Webhook Configuration (Where does it point?)

In your **GitHub App** (or Repository Webhook settings):

### 👉 Webhook URL

```
https://<your-render-backend-name>.onrender.com/api/webhooks/github
```

*(Replace `<your-render-backend-name>` with your actual Render service hostname).*

### Webhook Settings

- **Content type**: `application/json`
- **Secret**: Enter the exact secret string you set in `GITHUB_WEBHOOK_SECRET` on Render.
- **SSL verification**: `Enable SSL verification` (Active)
- **Permissions & Events**:
  - `Pull requests` (Read & Write) ➔ Subscribe to **Pull request** events.
  - `Commit statuses` (Read & Write) ➔ For merge gate checks.
  - `Issues` (Read & Write) ➔ For blocker issue creation.
  - `Contents` (Read & Write) ➔ For autonomous fix commits & unit tests.
  - `Repository installation / installation_repositories` ➔ To auto-sync monitored repos.

---

## 4. 🔑 WorkOS Authentication & OAuth Sync

1. In the [WorkOS Dashboard](https://dashboard.workos.com/):
   - **Redirect URIs**: Add `https://<your-vercel-app>.vercel.app/callback` and `http://localhost:3000/callback`.
   - **GitHub OAuth Configuration**:
     - Enable **"Return GitHub OAuth tokens"**.
     - Add the `repo` scope to grant access for PR reading and status updates.

---

## 5. ⏰ Keep-Alive Cron Job (Prevent Render Sleep)

Render free-tier instances spin down after 15 minutes of inactivity. To keep your backend responsive with zero cold-start delay for GitHub webhooks:

1. Use a free uptime monitor such as [UptimeRobot](https://uptimerobot.com/), [cron-job.org](https://cron-job.org/), or [BetterStack](https://betterstack.com/).
2. Create an **HTTP Monitor**:
   - **URL**: `https://<your-render-backend-name>.onrender.com/ping`
   - **Method**: `GET` (or `HEAD`)
   - **Interval**: Every `10 minutes` (or `5 minutes`)
3. Expected Response:

   ```json
   { "status": "pong" }
   ```

---

## 6. ⚡ Verifying the Deployment

1. **Backend Health Check & Ping**:
   Open `https://<your-render-backend>.onrender.com/healthz` in your browser. You should receive status ok.

2. **Frontend Test**:
   Log into your Vercel URL, view monitored repositories, and click **"Review with AI"** or open a test PR on GitHub.
3. **Webhook Test**:
   In your GitHub App settings under **"Advanced > Recent Deliveries"**, click **Redeliver** on any event and verify HTTP `200 OK`.
