# 🚀 MergePilot AI

**An autonomous AI co-worker that orchestrates GitHub PR workflows, remediates code, and automates deployment decisions.**

Built for the **IBM AI Builders Challenge (Wild Card Category)**.

MergePilot AI goes beyond traditional "AI code reviewers." Instead of passively leaving comments, it acts as an active engineering collaborator. It reads pull requests, autonomously pushes code fixes for vulnerabilities, intelligently routes mandatory human reviewers based on file types, and acts as a strict deployment gatekeeper using risk-confidence scoring.

---

## ✨ Core Features

### 1. Autonomous Code Remediation 🛠️

- **The Problem:** Standard AI tools just tell you what's wrong, forcing the developer to switch contexts and write the fix.
- **The Solution:** When MergePilot detects a security flaw, anti-pattern, or optimization, it doesn't just comment. The IBM Granite agent generates the corrected code and autonomously pushes a new commit directly to the PR branch.

### 2. Smart Reviewer Routing 🚦

- **The Problem:** Tagging the entire team on every PR creates alert fatigue and slows down development.
- **The Solution:** MergePilot analyzes the Git diff to orchestrate the team.
  - Touches `schema.prisma`? It auto-assigns the Lead Backend Engineer.
  - Touches `globals.css`? It assigns the UI/UX Lead.
  - Minor markdown/docs typo? It auto-approves the PR to save human time.

### 3. Release Decision Engine & Risk Scoring 🛡️

- **The Problem:** Merging code is stressful, and human reviewers can miss subtle architectural regressions.
- **The Solution:** Before enabling the merge button, the AI generates a **Risk Confidence Score** (0-100%). If the score is >95%, the PR is cleared. If a critical flaw is detected, MergePilot physically blocks the GitHub merge state and logs a "Blocker" ticket in the project dashboard.

### 4. The DevOps Command Center (Dashboard) 📊

- A sleek, high-density web dashboard for Engineering Managers. View all active PRs, see the AI's risk scores in real-time, override AI decisions, and monitor team velocity—all updated instantly without refreshing the page.

---

## 🏗️ Tech Stack

### AI & Orchestration Layer

- **Primary AI Model:** **IBM Granite** (optimized for code reasoning and structured output).
- **Development Partner:** **IBM Bob** (used for generating boilerplate, LangGraph nodes, and GitHub API logic).
- **Agent Framework:** **LangGraph (Python)** – Powers the multi-agent pipeline (Reviewer Node ➜ Routing Node ➜ Committer Node).

### Backend (API & Webhooks)

- **Framework:** **FastAPI (Python)** – Asynchronous architecture to handle incoming GitHub webhooks and manage long-running LLM tasks without blocking.
- **Data Validation:** **Pydantic v2** – Enforces strict JSON schemas for the AI's output.
- **Integration:** **PyGithub / GitHub Webhooks API** – Reads diffs, posts comments, and pushes commits.

### Frontend & Real-Time State

- **Framework:** **TanStack Start (React)** – Lightning-fast routing and server-side rendering.
- **Styling:** **Tailwind CSS + shadcn/ui** – For a professional, enterprise-grade dark-mode dashboard.
- **Database & Real-time:** **Convex** – Stores PR metadata, AI risk scores, and routing rules, syncing instantly to the frontend dashboard.

---

## 🧠 How the LangGraph Pipeline Works

When a developer opens a Pull Request on GitHub, it triggers the following automated workflow:

1.  **Webhook Trigger:** GitHub sends a webhook to the FastAPI backend.
2.  **Diff Extraction Node:** FastAPI extracts the raw code diffs and file paths.
3.  **IBM Granite Analyst Node:** Evaluates the code for bugs, security risks, and logic errors.
4.  **Decision Branching:**
    - _If Critical Bug:_ Routes to the **Committer Agent**, which drafts a fix and pushes it to GitHub via API.
    - _If Safe:_ Routes to the **Orchestrator Agent**.
5.  **Orchestrator Agent:** Looks at the file paths touched (e.g., `.ts` vs `.py`) and assigns the appropriate human reviewers.
6.  **State Sync:** The final Risk Score and summary are written to Convex, immediately updating the TanStack frontend.

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- Python 3.10+
- Node.js 18+
- A GitHub App Token / Personal Access Token
- IBM / watsonx API Key
- Convex Account

### 1. Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
