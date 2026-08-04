# AGENTS.md

MergeMaster AI: an autonomous PR-review / risk-scoring app for the IBM AI Builders Challenge. `frontend/` (TanStack Start + Convex dashboard) and `backend/` (FastAPI + GitHub webhooks) are **two independent projects with no root manifest**. Run all commands from inside the relevant subdirectory.

## Frontend (`frontend/`, pnpm workspace)

- Package manager is **pnpm** (never npm). `pnpm install` for deps.
- Commands (from `frontend/`):
  - `pnpm dev` — `convex dev --start 'vite dev'`; starts Convex dev backend + Vite (port 3000). Requires Convex login/account.
  - `pnpm lint` — `tsc && eslint .` with `--max-warnings 0`; must pass cleanly.
  - `pnpm build` — `vite build && tsc --noEmit`.
- Files under `convex/_generated/` and `src/routeTree.gen.ts` are **generated** (Convex CLI / TanStack Router) — never hand-edit.
- Convex backend lives in `frontend/convex/`: schema in `convex/schema.ts`, functions in `convex/{pullRequests,repositories,users}.ts`. Before editing Convex code, read `frontend/AGENTS.md` and `convex/_generated/ai/guidelines.md` (Convex rules override training-data assumptions). `frontend/AGENTS.md`'s `convex-ai-start/end` block is CLI-managed — keep it intact.
- `convex/myFunctions.ts` is an intentional mock kept only for boilerplate compatibility (the `numbers` table was deleted).
- Routing is file-based under `src/routes/`. `~/*` path alias maps to `src/*`.
- Env (in `frontend/.env.local`, gitignored): `VITE_CONVEX_URL` and `VITE_WORKOS_CLIENT_ID` (used in `src/router.tsx`).
- Style: Prettier with no semicolons, single quotes, trailing commas. Dashboard can seed mock data via the "SEED DATA" button (`seedMockData` / `seedMockRepositories` mutations are idempotent).

## Backend (`backend/`, FastAPI)

- Python venv already exists at `backend/venv`. Activate it (`backend\venv\Scripts\Activate.ps1`) then `python main.py` runs uvicorn on port 8000 with reload.
- **There is no `requirements.txt`** in the repo despite the README referencing `pip install -r requirements.txt`; use the existing venv.
- `main.py` loads `backend/.env` via `load_dotenv()`; only the GitHub webhook endpoint is implemented. The LangGraph agent pipeline, reviewer routing, and remediation described in `PHASES.md`/README are not yet built — code is marked with TODOs.
- Webhook signature verification reads `GITHUB_WEBHOOK_SECRET` (skips verification with a warning if unset — not production-safe).
- Env (`backend/.env`, gitignored): `GITHUB_WEBHOOK_SECRET`; `SETUP.md` also expects GitHub App ID, private key PEM, and a Convex URL. Testing webhooks locally requires an ngrok tunnel to `POST /api/webhooks/github` (see `SETUP.md`).

## Reference docs

- `PHASES.md` — architecture plan and implementation phases (some phases still aspirational).
- `backend/SETUP.md` — GitHub App + webhook tunnel setup.
