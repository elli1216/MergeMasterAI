# 🚀 MergeMaster AI

**An autonomous AI co-worker that orchestrates GitHub PR workflows, remediates code, and automates deployment decisions.**

Built for the **IBM AI Builders Challenge (Wild Card Category)**.

MergeMaster AI goes beyond traditional "AI code reviewers." Instead of passively leaving comments, it acts as an active engineering collaborator. It reads pull requests, autonomously pushes code fixes for vulnerabilities, intelligently routes mandatory human reviewers based on file types, and acts as a strict deployment gatekeeper using risk-confidence scoring.

---

## 🎯 Selected Challenge Theme

**Wild Card Category**: MergeMaster AI tackles the broad problem of Developer Productivity, DevOps orchestration, and CI/CD automation.

## 🛑 Problem Statement

Engineering teams waste thousands of hours manually reviewing pull requests, routing tickets to the correct developers, and searching for syntax or security flaws. When developers context-switch to review minor typos or are unnecessarily tagged in PRs outside their domain, velocity drops. Additionally, standard "AI Code Reviewers" only leave passive comments, still forcing the original author to switch contexts again to write the fix.

## 💡 Solution Description

MergeMaster AI is an autonomous AI co-worker that actively orchestrates GitHub PR workflows, remediates code, and automates deployment decisions. It goes beyond passive commenting by reading pull requests, autonomously generating and pushing code fixes for vulnerabilities directly to the branch, intelligently routing mandatory human reviewers based on the specific files touched, and acting as a strict deployment gatekeeper using AI-driven risk-confidence scoring.

## 🤖 AI Approach and Architecture

We utilized a multi-agent system powered by **LangGraph (Python)** to handle complex decision trees without human intervention:

- **The Analyst Node** evaluates the code for bugs, security risks, and logic errors using strict Pydantic structured schemas.
- **The Orchestrator Agent** dynamically assigns human reviewers based on the git diff (e.g., routing `schema.prisma` changes to the Lead Backend Engineer).
- **The Committer Agent** autonomously drafts fixes for critical vulnerabilities and pushes them directly to the GitHub PR via the PyGithub API.

The backend handles incoming GitHub webhooks asynchronously via FastAPI and syncs the agent's decisions to a real-time Convex database, instantly updating our high-density brutalist frontend dashboard.

## 🧑‍💻 How IBM Bob was Used

IBM Bob acted as our primary AI pair-programming partner throughout the development of MergeMaster AI. We leveraged IBM Bob to:

- Generate the LangGraph multi-agent pipeline and state graph architecture.
- Scaffold the FastAPI webhook endpoints and Pydantic validation schemas.
- Build the real-time synchronization logic between the Python backend and the Convex database.
- Rapidly iterate and develop the complex UI components in our TanStack Start dashboard.

---

## ✨ Core Features

### 1. Autonomous Code Remediation 🛠️

- **The Problem:** Standard AI tools just tell you what's wrong, forcing the developer to switch contexts and write the fix.
- **The Solution:** When MergeMaster detects a security flaw, anti-pattern, or optimization, it doesn't just comment. The AI generates the corrected code and autonomously pushes a new commit directly to the PR branch.

### 2. Smart Reviewer Routing 🚦

- **The Problem:** Tagging the entire team on every PR creates alert fatigue and slows down development.
- **The Solution:** MergeMaster analyzes the Git diff to orchestrate the team.
  - Touches `schema.prisma`? It auto-assigns the Lead Backend Engineer.
  - Touches `globals.css`? It assigns the UI/UX Lead.
  - Minor markdown/docs typo? It auto-approves the PR to save human time.

### 3. Release Decision Engine & Risk Scoring 🛡️

- **The Problem:** Merging code is stressful, and human reviewers can miss subtle architectural regressions.
- **The Solution:** Before enabling the merge button, the AI generates a **Risk Score** (0-100%). High-risk PRs physically block the GitHub merge state and trigger a visual alert in the dashboard.

### 4. The DevOps Command Center (Dashboard) 📊

- **Brutalist UI:** A high-contrast, brutalist black-and-white theme built with Tailwind CSS, delivering an enterprise-grade command center experience.
- **Real-time Reactivity:** Powered by Convex. The moment a PR is opened or a webhook fires, the dashboard updates instantly—no page refreshes required.
- **Live GitHub Sync:** Automatically pulls in and displays your recent repositories, PRs, and commits. The commits panel includes direct, clickable links to instantly view changes on GitHub.
- **AI Analysis Reports:** Click on any PR to view the AI's full thought process, findings (categorized by severity), and routing rationale.
- **Markdown Export Engine:** Instantly generate beautifully formatted Markdown reports of the AI's review, save them to the Convex database, and copy them directly into your GitHub PR description.
- **Human Override:** Managers can manually override the AI's risk assessment directly from the dashboard, requiring a logged justification.

---

## 🏗️ Tech Stack

### AI & Orchestration Layer

- **Primary AI Model:** Google Gemini / IBM Models (optimized for code reasoning and structured output).
- **Agent Framework:** **LangGraph (Python)** – Powers the multi-agent pipeline (Reviewer Node ➜ Routing Node ➜ Committer Node).

### Backend (API & Webhooks)

- **Framework:** **FastAPI (Python)** – Asynchronous architecture to handle incoming GitHub webhooks and manage long-running LLM tasks without blocking.
- **Integration:** **PyGithub / GitHub Webhooks API** – Reads diffs, enforces commit-status gates, and pushes remediation commits.

### Frontend & Real-Time State

- **Framework:** **TanStack Start (React)** – Lightning-fast file-based routing and server-side rendering.
- **Styling:** **Tailwind CSS + shadcn/ui** – For a professional, brutalist dark-mode dashboard.
- **Database & Real-time:** **Convex** – Stores PR metadata, AI risk scores, generated Markdown reports, and routing rules, syncing instantly to the frontend dashboard.
- **Authentication:** **WorkOS** – Secure GitHub OAuth login to automatically synchronize the user's repos and PRs.

---

## 🧠 How the LangGraph Pipeline Works

When a developer opens a Pull Request on GitHub, it triggers the following automated workflow:

1. **Webhook Trigger:** GitHub sends a webhook to the FastAPI backend.
2. **Diff Extraction Node:** FastAPI extracts the raw code diffs and file paths.
3. **Analyst Node:** Evaluates the code for bugs, security risks, and logic errors.
4. **Decision Branching:**
    - _If Critical Bug:_ Routes to the **Committer Agent**, which drafts a fix and pushes it to GitHub via API.
    - _If Safe:_ Routes to the **Orchestrator Agent**.
5. **Orchestrator Agent:** Looks at the file paths touched (e.g., `.ts` vs `.py`) and assigns the appropriate human reviewers.
6. **State Sync:** The final Risk Score and summary are written to Convex, immediately updating the TanStack frontend.

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- Python 3.10+
- Node.js 18+
- pnpm (for frontend)
- A GitHub App Token / Personal Access Token
- Convex Account
- LLM API Key (Gemini/OpenAI)

### 1. Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### 2. Frontend Setup (TanStack + Convex)

```bash
cd frontend
pnpm install
pnpm dev
```
