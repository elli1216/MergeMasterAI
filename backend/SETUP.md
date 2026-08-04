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

Open a **new** terminal and run:

```powershell
ngrok http 8000
```

Ngrok will give you a public URL that looks something like `https://a1b2c3d4.ngrok-free.app`. Keep this terminal running!

---

## 4. Connect GitHub to the Tunnel

1. Go back to your GitHub App settings.
2. Find the **Webhook URL** field.
3. Paste your ngrok URL and append the webhook endpoint to it. It must look exactly like this:
   `https://<your-ngrok-id>.ngrok-free.app/api/webhooks/github`
4. Click **Save Changes**.

---

## 5. Verify the Connection

You are now ready to install the App!

1. In the GitHub App settings sidebar, click **Install App**.
2. Install it on your chosen repositories.
3. Watch your FastAPI terminal! You should immediately see a `✅ Received GitHub Event: installation` log when GitHub successfully pings your local backend.

You are now fully configured to receive live PR updates and orchestrate your autonomous agents!
