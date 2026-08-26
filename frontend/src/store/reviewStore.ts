import { create } from 'zustand'
import type { ReviewTarget } from '~/components/dashboard'
import type { AiReview } from '~/lib/backend'
import { requestAiReview } from '~/lib/backend'

export type PipelineStage = {
  id: number
  name: string
  subtitle: string
  log: string
}

export const PIPELINE_STAGES: Array<PipelineStage> = [
  {
    id: 1,
    name: 'Extracting Git Diff & Checking Mergeability',
    subtitle: 'Fetching PR file tree, lines modified, and scanning for merge conflicts from GitHub...',
    log: 'Extracting unified diff and analyzing file boundaries',
  },
  {
    id: 2,
    name: 'Loading Guardrails & Semantic RAG Memory',
    subtitle: 'Retrieving organizational coding policies and semantic vector embeddings of past PR outcomes...',
    log: 'Retrieved active custom guardrails & vector historical context',
  },
  {
    id: 3,
    name: 'Executing IBM Granite Code Analysis',
    subtitle: 'Autonomous multi-agent inspection of security vulnerabilities, logic bugs, code quality, and risk score...',
    log: 'IBM Granite 3.1 Code & Instruct analyzing diff AST and security risks',
  },
  {
    id: 4,
    name: 'Evaluating Reviewer Routing & Governance',
    subtitle: 'Mapping modified files against team domain ownership rules and policy constraints...',
    log: 'Matching reviewer ownership rules & determining gate status',
  },
  {
    id: 5,
    name: 'Enforcing Commit Gate & Finalizing Decision',
    subtitle: 'Setting GitHub commit status checks, drafting surgical fixes, and recording immutable audit log...',
    log: 'Enforcing commit-status gate and syncing Convex decision snapshot',
  },
]

interface ReviewState {
  reviewTarget: ReviewTarget | null
  review: AiReview | null
  reviewing: boolean
  reviewError: string | null
  reviewOpen: boolean
  activeTab: 'report' | 'chat' | 'tests'
  currentStageIndex: number

  setReviewTarget: (target: ReviewTarget | null) => void
  setReview: (review: AiReview | null) => void
  setReviewing: (loading: boolean) => void
  setReviewError: (err: string | null) => void
  setReviewOpen: (open: boolean) => void
  setActiveTab: (tab: 'report' | 'chat' | 'tests') => void
  setCurrentStageIndex: (idx: number) => void

  openReviewForPr: (pr: {
    github_pr_id: string
    repo_name: string
    title: string
    full_review?: any
  }) => Promise<void>
  reanalyzeCurrentTarget: () => Promise<void>
  reset: () => void
}

let stageInterval: any = null

function startStageProgression(set: (fn: (state: ReviewState) => Partial<ReviewState>) => void) {
  if (stageInterval) clearInterval(stageInterval)
  set(() => ({ currentStageIndex: 0 }))
  stageInterval = setInterval(() => {
    set((state) => {
      if (state.currentStageIndex < PIPELINE_STAGES.length - 1) {
        return { currentStageIndex: state.currentStageIndex + 1 }
      }
      return {}
    })
  }, 1400)
}

function stopStageProgression() {
  if (stageInterval) {
    clearInterval(stageInterval)
    stageInterval = null
  }
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviewTarget: null,
  review: null,
  reviewing: false,
  reviewError: null,
  reviewOpen: false,
  activeTab: 'report',
  currentStageIndex: 0,

  setReviewTarget: (reviewTarget) => set({ reviewTarget }),
  setReview: (review) => set({ review }),
  setReviewing: (reviewing) => set({ reviewing }),
  setReviewError: (reviewError) => set({ reviewError }),
  setCurrentStageIndex: (currentStageIndex) => set({ currentStageIndex }),
  setReviewOpen: (reviewOpen) => {
    // If opening or closing, respect loading state
    if (get().reviewing && !reviewOpen) return
    set({ reviewOpen })
  },
  setActiveTab: (activeTab) => {
    if (get().reviewing) return
    set({ activeTab })
  },

  openReviewForPr: async (pr) => {
    const prNumber = Number(pr.github_pr_id)
    if (!Number.isInteger(prNumber)) {
      stopStageProgression()
      set({
        reviewTarget: null,
        review: null,
        reviewError: `Invalid PR number for "${pr.title}"`,
        reviewing: false,
        reviewOpen: true,
        activeTab: 'report',
        currentStageIndex: 0,
      })
      return
    }

    const target: ReviewTarget = { repoName: pr.repo_name, prNumber, title: pr.title }
    set({
      reviewTarget: target,
      reviewOpen: true,
      activeTab: 'report',
    })

    if (pr.full_review) {
      stopStageProgression()
      set({
        review: pr.full_review as AiReview,
        reviewError: null,
        reviewing: false,
        currentStageIndex: 0,
      })
      return
    }

    set({
      review: null,
      reviewError: null,
      reviewing: true,
      currentStageIndex: 0,
    })

    startStageProgression(set)

    try {
      const result = await requestAiReview(pr.repo_name, prNumber)
      set({ review: result, reviewing: false, currentStageIndex: PIPELINE_STAGES.length - 1 })
    } catch (err) {
      set({
        reviewError: err instanceof Error ? err.message : String(err),
        reviewing: false,
      })
    } finally {
      stopStageProgression()
    }
  },

  reanalyzeCurrentTarget: async () => {
    const { reviewTarget, review, reviewing } = get()
    if (!reviewTarget || review?.status === 'approved' || reviewing) return

    set({
      review: null,
      reviewError: null,
      reviewing: true,
      activeTab: 'report',
      currentStageIndex: 0,
    })

    startStageProgression(set)

    try {
      const result = await requestAiReview(reviewTarget.repoName, reviewTarget.prNumber)
      set({ review: result, reviewing: false, currentStageIndex: PIPELINE_STAGES.length - 1 })
    } catch (err) {
      set({
        reviewError: err instanceof Error ? err.message : String(err),
        reviewing: false,
      })
    } finally {
      stopStageProgression()
    }
  },

  reset: () => {
    stopStageProgression()
    set({
      reviewTarget: null,
      review: null,
      reviewing: false,
      reviewError: null,
      reviewOpen: false,
      activeTab: 'report',
      currentStageIndex: 0,
    })
  },
}))

