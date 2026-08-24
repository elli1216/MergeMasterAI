# 🚀 MergeMaster AI

**An autonomous AI co-worker that orchestrates GitHub PR workflows, enforces release gates, remediates vulnerabilities, synthesizes unit tests, and delivers executive ROI analytics.**

Built for the **IBM AI Builders Challenge (Wild Card Category)**.

MergeMaster AI goes far beyond traditional "AI code reviewers." Instead of passively leaving comments, it acts as an active engineering collaborator. It reads pull requests, autonomously pushes code fixes for vulnerabilities directly to the branch, synthesizes comprehensive unit tests, intelligently routes mandatory human reviewers based on file types, enforces organizational security policies, and acts as a strict deployment gatekeeper using risk-confidence scoring.

---

## 🎯 Selected Challenge Theme & Overview

- **Challenge Category**: **Wild Card Category** (Developer Productivity, DevOps Orchestration, AI Automation & Release Governance).
- **The Problem**: Engineering teams waste thousands of hours manually triaging pull requests, routing tickets to the wrong developers, investigating repetitive vulnerabilities, and missing subtle architectural regressions. Standard "AI code reviewers" only leave passive comments, still forcing developers to context-switch and write fixes.
- **The Solution**: MergeMaster AI operates as an autonomous release gatekeeper and active peer programmer. It analyzes PR diffs, executes multi-agent decision trees, enforces organizational policies, pushes remediation commits, synthesizes unit tests, and presents real-time telemetry on an enterprise brutalist dashboard.

---

## 🤖 Multi-Agent Architecture & LangGraph Pipeline

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
                              │ • IBM Granite LLM / Heuristics   │
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

## ✨ Core Features

### 1. 🛠️ Autonomous Code Remediation (Committer Agent)

When MergeMaster detects critical vulnerabilities (such as hardcoded secrets, SQL injection, or unhandled exceptions), it doesn't stop at passive comments. The **Committer Agent** drafts surgical code corrections and autonomously pushes a remediation commit directly to the PR branch via the GitHub API.

### 2. 💬 Interactive PR Copilot Chat (Agentic Q&A)

Developers and engineering leads can open the **PR Copilot Chat** tab to ask detailed questions about the pull request diff, investigate why specific risks were flagged, and receive instant architectural recommendations and refactoring guidance.

### 3. 🧪 Autonomous Unit Test Suite Generator

With one click, MergeMaster analyzes modified functions and synthesizes a comprehensive unit test file (PyTest, Jest, or Vitest) covering happy paths, edge cases, and exception handling—with a one-click **"Push to PR Branch"** commit button.

### 4. 🧠 Historical Context & Semantic Memory (RAG)

MergeMaster indexes past repository reviews, recurring vulnerabilities, and merge gate decisions. When evaluating new PRs, it performs semantic similarity search to ground decisions in prior architectural learnings.

### 5. 🛡️ Custom Organizational Policies (No-Code Rules Engine)

Engineering leads can define custom enterprise rules (e.g. *Strict Input Validation*, *Sanitize DB Queries*, *Disallow Hardcoded Secrets*) with assigned severity levels. These rules are dynamically queried and strictly enforced during all automated reviews.

### 6. 🚦 Smart Dynamic Reviewer Routing

Configurable file-pattern rules (e.g. `schema.prisma` ➔ *Lead Backend Engineer*, `*.sql` ➔ *Database Engineer*, `*.css` ➔ *UI/UX Lead*) automatically route PRs to domain experts, eliminating alert fatigue.

### 7. 📈 Multi-Repo Analytics & ROI Dashboard

An executive dashboard calculating:

- **Developer Hours Saved** (~1.5h per auto-approval + ~2.0h per autonomous remediation).
- **AI Decision Distribution** (Auto-approvals vs Blocked Gates vs Code Remediations vs Human Routing).
- **Risk Confidence Tiers** (Safe 0–25%, Medium 26–75%, Critical 76–100%).
- **Vulnerability Categorization** (Security, Logic, Bugs, Code Quality).

---

## 🏗️ Technology Stack

| Layer | Technologies |
| --- | --- |
| **AI & Multi-Agent** | **LangGraph**, **IBM Granite** (Granite 3.0 / 3.1 Code & Instruct), Pydantic Schemas, Deterministic Security Heuristics |
| **Backend API** | **FastAPI**, **Uvicorn**, **PyGithub**, **HTTPX**, **Docker** |
| **Real-Time Data Layer** | **Convex Cloud** (Live WebSocket Subscriptions, Reactive Mutations, Vector Storage) |
| **Frontend** | **TanStack Start**, **TanStack Router**, **React 19**, **Tailwind CSS v4**, **Lucide Icons** |
| **Authentication** | **WorkOS AuthKit** (GitHub OAuth with `repo` scope token sync) |
| **Deployment** | **Vercel** (Frontend SPA/SSR) & **Render** (Backend Docker Container) |

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Python 3.10+ & Node.js 18+
- [pnpm](https://pnpm.io/) (`npm i -g pnpm`)
- GitHub App credentials & Convex Account
- LLM API Key (IBM watsonx.ai / Granite or OpenAI-compatible endpoint)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1   # On Windows (or source venv/bin/activate on Unix)
pip install -r requirements.txt
python main.py
```

*Backend runs on `http://localhost:8000` (Health check: `http://localhost:8000/healthz`, Keep-alive: `http://localhost:8000/ping`).*

### 2. Frontend Setup

```bash
cd frontend
pnpm install
pnpm dev
```

*Frontend runs on `http://localhost:3000`.*

---

## 🌐 Production Deployment

- **Frontend on Vercel**: See [`frontend/vercel.json`](file:///C:/Users/elli/Documents/programs/MergeMasterAI/frontend/vercel.json) and [`frontend/src/README.md`](file:///C:/Users/elli/Documents/programs/MergeMasterAI/frontend/src/README.md).
- **Backend on Render (Docker)**: See [`backend/Dockerfile`](file:///C:/Users/elli/Documents/programs/MergeMasterAI/backend/Dockerfile) and [`backend/SETUP.md`](file:///C:/Users/elli/Documents/programs/MergeMasterAI/backend/SETUP.md).
- **Complete Deployment Guide**: Read [`DEPLOYMENT.md`](file:///C:/Users/elli/Documents/programs/MergeMasterAI/DEPLOYMENT.md).

---

## 🧑‍💻 How IBM Bob & Generative AI Were Used

MergeMaster AI was architected and developed using AI pair-programming:

1. **LangGraph Pipeline Design**: Generated state graphs, branching conditionals, and deterministic fallback loops.
2. **Pydantic Schema Validation**: Crafted type-safe schemas for finding categorizations, fix drafting, and test synthesis.
3. **Reactive State Synchronization**: Implemented real-time Convex schema indexes and TanStack Router queries.
4. **Token Optimization**: Built diff pruning algorithms filtering lockfile/build noise to save 50–90% of LLM prompt tokens.
