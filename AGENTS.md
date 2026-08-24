# AGENTS.md

MergeMaster AI: an autonomous PR-review / risk-scoring app for the IBM AI Builders Challenge. `frontend/` (TanStack Start + Convex dashboard) and `backend/` (FastAPI + GitHub webhooks) are **two independent projects with no root manifest**. Run all commands from inside the relevant subdirectory.

## Frontend (`frontend/`, pnpm workspace)

- Package manager is **pnpm** (never npm). `pnpm install` for deps.
- Commands (from `frontend/`):
  - `pnpm dev` — `convex dev --start 'vite dev'`; starts Convex dev backend + Vite (port 3000). Requires Convex login/account.
  - `pnpm lint` — `tsc && eslint .` with `--max-warnings 0`; must pass cleanly.
  - `pnpm build` — `vite build && tsc --noEmit`.
- Files under `convex/_generated/` and `src/routeTree.gen.ts` are **generated** (Convex CLI / TanStack Router) — never hand-edit.
- Convex backend lives in `frontend/convex/`: schema in `convex/schema.ts`, functions in `convex/{pullRequests,repositories,users,github}.ts`. Before editing Convex code, read `frontend/AGENTS.md` and `convex/_generated/ai/guidelines.md` (Convex rules override training-data assumptions). `frontend/AGENTS.md`'s `convex-ai-start/end` block is CLI-managed — keep it intact.
- `convex/myFunctions.ts` is an intentional mock kept only for boilerplate compatibility (the `numbers` table was deleted).
- Routing is file-based under `src/routes/`. `~/*` path alias maps to `src/*`.
- Env (in `frontend/.env.local`, gitignored): `VITE_CONVEX_URL` and `VITE_WORKOS_CLIENT_ID` (used in `src/router.tsx`).
- Style: Prettier with no semicolons, single quotes, trailing commas. The dashboard pulls the logged-in user's real GitHub data (repos/PRs/commits) via the WorkOS GitHub OAuth token captured in `src/router.tsx` `onRedirectCallback` (stored in localStorage as `github_oauth_access_token`) and synced into Convex by the `api.github.syncGitHubData` action (auto-runs on dashboard load; "SYNC GITHUB" button re-runs it). Requires the WorkOS app to have "Return GitHub OAuth tokens" enabled and the `repo` scope; user must re-login after enabling.

## Backend (`backend/`, FastAPI)

- Python venv already exists at `backend/venv`. Activate it (`backend\venv\Scripts\Activate.ps1`) then `python main.py` runs uvicorn on port 8000 with reload.
- **There is no `requirements.txt`** in the repo despite the README referencing `pip install -r requirements.txt`; use the existing venv.
- `main.py` loads `backend/.env` via `load_dotenv()`; only the GitHub webhook endpoint is implemented. The LangGraph agent pipeline, reviewer routing, and remediation described in `PHASES.md`/README are not yet built — code is marked with TODOs.
- Webhook signature verification reads `GITHUB_WEBHOOK_SECRET` (skips verification with a warning if unset — not production-safe).
- **Phase 3 (implemented):** `pull_request` webhook events (`opened`, `synchronize`, `reopened`, `ready_for_review`) kick off the LangGraph pipeline in a background task. Pipeline modules: `agents/graph.py` (compiled StateGraph: `extract_diff -> analyze_changes -> route_reviewers -> [committer_agent if blocked] -> enforce_gate -> record_result`, cached graph), `agents/nodes.py`, `agents/state.py` (TypedDict), `routing_rules.py` (file-pattern -> reviewer role mapping, docs-only detection), `github_client.py` (PyGithub App auth via `GITHUB_APP_ID`/`GITHUB_PRIVATE_KEY`, fetches PR files/patch + head SHA/ref, sets the commit-status gate and opens a Blocker issue via `enforce_gate`; fails gracefully when creds are unset/bad), `analysis.py` (IBM Granite via OpenAI-compatible `POST {base}/chat/completions`, Pydantic-validated `RiskAssessment` JSON: summary + findings + risk_score + suggested_decision; falls back to deterministic `heuristic_analysis` when no `GEMINI_API_KEY` is set or the call fails), `convex_client.py` (writes `status`/`risk_score`/`ai_summary` and an `ai_decisions_log` row via `POST {CONVEX_URL}/api/mutation` with `Authorization: Bearer {CONVEX_ADMIN_KEY}`; skips with a warning when either is unset). Decisions: `auto_approve` -> `approved`, `block` -> `blocked` (+ commit-status `failure` + Blocker issue), else `pending` with findings and reviewer roles appended to the summary. **Phase 4 (implemented):** structured Analyst findings (logic/bug/security/quality, low..critical) + 0-100 risk score + `enforce_gate` node. **Phase 5 (implemented):** `committer_agent.py` drafts surgical fixes for high/critical findings (IBM Granite `FixDraft` JSON, else heuristic: hardcoded JS/TS secrets -> `process.env.*`; destructive SQL/dynamic exec -> no safe fix) and pushes them as commits to the PR branch via `repo.update_file` (exact unique snippet match, otherwise skipped); on success the PR flips to `pending` (re-review) and logs `remediate_code`; the follow-up `synchronize` webhook re-runs the pipeline to re-verify. Convex side: `pull_requests` gained index `by_repo_name_and_github_pr_id`, mutations `updatePullRequestAnalysis` and `logAnalysisDecision` (match PRs by repo+number).
- Env (`backend/.env`, gitignored): `GITHUB_WEBHOOK_SECRET`; `SETUP.md` also expects GitHub App ID, private key PEM, and a Convex URL. Phase 3 adds `GEMINI_API_KEY`, `LLM_API_BASE` (default `https://generativelanguage.googleapis.com/v1beta/openai`), `LLM_MODEL` (default `gemini-3.5-flash-lite`) and `CONVEX_ADMIN_KEY` (Convex Dashboard -> Deploy Keys). Testing webhooks locally requires an ngrok tunnel to `POST /api/webhooks/github` (see `SETUP.md`). Frontend calls `POST /api/reviews` (`{repo_name, pr_number, github_token?}`) for on-demand AI reviews; CORS origins come from `CORS_ORIGINS` (default `http://localhost:3000`); frontend uses `VITE_BACKEND_URL` (default `http://localhost:8000`).

## Reference docs

- `PHASES.md` — architecture plan and implementation phases (some phases still aspirational).
- `backend/SETUP.md` — GitHub App + webhook tunnel setup.
