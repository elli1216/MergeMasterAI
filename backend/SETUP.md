# MergeMaster AI - Backend Setup Guide

Welcome to Phase 2 of MergeMaster AI! This document outlines how to spin up your local FastAPI backend and connect it to your GitHub App so that it can autonomously read and orchestrate Pull Requests in real-time.

---

## 1. Environment Configuration

You must first fill out the `.env` file located in this `backend` directory.

1. Go to your **GitHub Developer Settings** -> **GitHub Apps**.
2. Select your `MergeMaster AI` app.
3. Find your **App ID** and paste it into `.env`.
4. Create a **Webhook Secret** (a random string of your choice) in the GitHub dashboard and paste it into `.env`.
5. Generate a **Private Key** for the app. Open the downloaded `.pem` file, copy its entire contents, and paste it securely into `.env`.
6. Ensure your Convex deployment URL is also in the `.env` file so the backend can push real-time updates to the dashboard.

_(Example `.env` format is provided in the repository)_

---

## 2. Start the FastAPI Server

The backend runs on Python and utilizes `FastAPI`.
Open a terminal, navigate to the `backend` directory, and run:

```powershell
# 1. Activate the virtual environment
.\venv\Scripts\Activate.ps1

# 2. Start the backend server
python main.py
```

You should see a message indicating the server is running on `http://0.0.0.0:8000`.

---

## 3. Create a Secure Webhook Tunnel

GitHub cannot send webhooks directly to your local `localhost` network. We will use **ngrok** to create a secure, public tunnel to your local machine.

### 3a. Install ngrok (first time only)

- Download from <https://ngrok.com/download>, **or** install via a package manager:

  ```powershell
  winget install ngrok
  # or
  choco install ngrok
  ```

### 3b. Connect your ngrok account (first time only)

ngrok requires a free account. Create one at <https://ngrok.com>, then copy your **authtoken** from the dashboard (<https://dashboard.ngrok.com/your-authtoken>) and run:

```powershell
ngrok config add-authtoken <your_authtoken>
```

### 3c. Start the tunnel

Open a **new** terminal (keep the backend from Step 2 running) and run:

```powershell
ngrok http 8000
```

Ngrok will print a dashboard with a **Forwarding** line like:

```
Forwarding   https://a1b2c3d4.ngrok-free.app -> http://localhost:8000
```

That public URL is your tunnel address. **Keep this terminal running.**

> **Note:** on the free plan the URL changes every time ngrok restarts. If yours changes later, you only need to update the **Webhook URL** field in the GitHub App settings (Step 4) — the webhook secret stays the same.

### 3d. Sanity-check the tunnel (optional)

Open the Forwarding URL in a browser and append `/docs`:

```
https://a1b2c3d4.ngrok-free.app/docs
```

You should see the FastAPI Swagger UI. If you get an error instead, the backend isn't running, or the port doesn't match.

---

## 4. Connect GitHub to the Tunnel

1. Go back to your GitHub App settings.
2. Find the **Webhook URL** field.
3. Paste your ngrok URL from the **Forwarding** line and append the webhook endpoint to it. It must look exactly like this:
   `https://<your-ngrok-id>.ngrok-free.app/api/webhooks/github`
4. In the **Webhook secret** field, paste the same value you set for `GITHUB_WEBHOOK_SECRET` in `backend/.env` (the two must match exactly).
5. Click **Save Changes**. GitHub sends a `ping` delivery immediately — you should see it logged by the backend.

---

## 5. Verify the Connection

You are now ready to install the App!

1. In the GitHub App settings sidebar, click **Install App**.
2. Install it on your chosen repositories.
3. Watch your FastAPI terminal! You should immediately see log lines like `GitHub event 'ping' (delivery=...)` and `GitHub event 'installation' (delivery=...)` when GitHub successfully reaches your local backend.
4. If you instead see `401 Invalid webhook signature`, the secret in GitHub does not match `GITHUB_WEBHOOK_SECRET` in `backend/.env` — fix it and re-test with **Redeliver** (App → Advanced → past delivery → Redeliver).

You are now fully configured to receive live PR updates and orchestrate your autonomous agents!
