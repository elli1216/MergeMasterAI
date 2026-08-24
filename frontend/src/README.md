# 💻 MergeMaster AI - Frontend Architecture (`src/`)

The frontend of **MergeMaster AI** is a high-performance, real-time developer dashboard built with **TanStack Start**, **TanStack Router**, **React 19**, **Convex Cloud**, and **Tailwind CSS v4**.

---

## 📂 Directory Structure

```
frontend/src/
├── components/
│   ├── appLayout.tsx                  # Persistent sidebar navigation & mobile drawer
│   ├── dashboard/
│   │   ├── aiReviewDialog.tsx         # Tabbed modal: AI Report, PR Copilot Chat, Unit Tests
│   │   ├── analyzeHistoryPanel.tsx    # Chronological AI decision & override audit log
│   │   ├── branchesPanel.tsx          # Active Git branches view
│   │   ├── commitsPanel.tsx           # Recent commits timeline
│   │   ├── dashboardHeader.tsx        # User identity, RBAC badge, and GitHub Sync trigger
│   │   ├── overrideDialog.tsx         # Manual merge gate override modal with user attribution
│   │   ├── policiesPanel.tsx          # No-code organizational coding policies manager
│   │   ├── pullRequestsPanel.tsx      # Live PR triage table with risk badges and action buttons
│   │   ├── repositorySidebar.tsx      # Monitored repositories list
│   │   ├── routingRulesPanel.tsx      # Dynamic reviewer file-pattern routing rules manager
│   │   ├── statsGrid.tsx              # Top-level KPI metric cards
│   │   └── index.ts                   # Centralized component exports
│   └── ui/                            # Primitive UI components (Badge, Button, Card, Dialog, Table)
├── lib/
│   ├── backend.ts                     # REST client for FastAPI backend (/reviews, /chat, /generate-tests)
│   ├── utils.ts                       # Tailwind merge & clsx helper
│   └── github.ts                      # Client-side GitHub helpers
├── routes/                            # File-based routing (TanStack Router)
│   ├── __root.tsx                     # Root document, HTML shell, and providers
│   ├── _dashboard.tsx                 # Protected dashboard layout with AppLayout wrapper
│   ├── _dashboard.index.tsx           # Main Dashboard: Live PR triage, Stats, Decision Audit Log
│   ├── _dashboard.analytics.tsx       # Analytics & ROI: Hours saved, Risk distribution, Findings
│   ├── _dashboard.repositories.index.tsx # Codebases: Repos, Routing Rules, Organizational Policies
│   ├── _dashboard.repository.$id.tsx  # Single Repository: PRs, Branches, and Commits
│   ├── login.tsx                      # WorkOS AuthKit Login page
│   └── callback.tsx                   # OAuth callback & GitHub token capture handler
├── routeTree.gen.ts                   # AUTO-GENERATED route tree by TanStack Router (do not edit)
└── router.tsx                         # Router initialization with WorkOS & Convex React Query client
```

---

## 🔑 Key Features & Components

### 1. 📋 Three-in-One AI Review Dialog ([`components/dashboard/aiReviewDialog.tsx`](file:///C:/Users/elli/Documents/programs/MergeMasterAI/frontend/src/components/dashboard/aiReviewDialog.tsx))

A centralized investigation modal with 3 distinct operational tabs:

- **Review Report**: Displays 0–100% confidence risk score, gate status (`approved`, `blocked`, `pending`), assigned reviewer roles, AI summary, categorized findings (Security, Logic, Bugs, Quality), and Markdown export.
- **PR Copilot Chat**: Interactive developer Q&A on the PR diff, explaining vulnerabilities, why risks were flagged, and remediation steps.
- **Unit Tests**: Autonomous test generator (PyTest / Jest / Vitest) with live syntax preview and a one-click **"Push to PR Branch"** commit button.

### 2. 🛡️ Organizational Policies Engine ([`components/dashboard/policiesPanel.tsx`](file:///C:/Users/elli/Documents/programs/MergeMasterAI/frontend/src/components/dashboard/policiesPanel.tsx))

Allows engineering leads to define custom rules (e.g. *Strict Input Validation*, *Sanitize DB Queries*, *Disallow Hardcoded Secrets*) with assigned severity levels. These rules are dynamically queried by the backend and enforced during LLM diff evaluations.

### 3. 🎯 Reviewer Routing Rules ([`components/dashboard/routingRulesPanel.tsx`](file:///C:/Users/elli/Documents/programs/MergeMasterAI/frontend/src/components/dashboard/routingRulesPanel.tsx))

Configures file-pattern globs (e.g. `*.sql`, `src/auth/*`, `schema.prisma`) to route PRs to designated domain expert reviewer roles (e.g. *Database Engineer*, *Security Lead*).

### 4. 📈 Analytics & ROI Dashboard ([`routes/_dashboard.analytics.tsx`](file:///C:/Users/elli/Documents/programs/MergeMasterAI/frontend/src/routes/_dashboard.analytics.tsx))

Executive dashboard tracking:

- **Developer Hours Saved** (~1.5 hrs per auto-approval + ~2.0 hrs per autonomous remediation)
- **AI Decision Distribution** (Auto-approvals vs Blocked Gates vs Code Remediations vs Human Routing)
- **Risk Confidence Tiers** (0–25% Safe, 26–75% Medium, 76–100% Critical)
- **Vulnerability Breakdown** (Security, Logic, Bug, Quality, Docs)

---

## ⚡ Data Flow & Real-Time Sync

1. **Authentication (WorkOS AuthKit)**:
   - Handled in [`router.tsx`](file:///C:/Users/elli/Documents/programs/MergeMasterAI/frontend/src/router.tsx) via `@workos-inc/authkit-react`.
   - On redirect, GitHub OAuth token is stored in `localStorage` as `github_oauth_access_token` and synced to Convex via `api.github.syncGitHubData`.

2. **Reactive State (Convex + TanStack Query)**:
   - Data queries use `useSuspenseQuery(convexQuery(api.pullRequests.getActivePRs, {}))` for instant SSR/client data hydration and live WebSocket push updates.

3. **Backend Communication ([`lib/backend.ts`](file:///C:/Users/elli/Documents/programs/MergeMasterAI/frontend/src/lib/backend.ts))**:
   - `requestAiReview(repoName, prNumber)` ➔ `POST /api/reviews`
   - `askPrCopilot(repoName, prNumber, question)` ➔ `POST /api/chat`
   - `generatePrTests(repoName, prNumber)` ➔ `POST /api/generate-tests`
   - `pushPrTests(repoName, prNumber, filePath, code)` ➔ `POST /api/push-tests`

---

## 🛠️ Development & Build Commands

All commands should be executed from the `frontend/` directory:

```bash
# Start Convex dev backend + Vite dev server (port 3000)
pnpm dev

# Typecheck and production build
pnpm build
```
