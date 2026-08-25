import { create } from 'zustand'
import type { ReviewTarget } from '~/components/dashboard'
import type { AiReview } from '~/lib/backend'
import { requestAiReview } from '~/lib/backend'

interface ReviewState {
  reviewTarget: ReviewTarget | null
  review: AiReview | null
  reviewing: boolean
  reviewError: string | null
  reviewOpen: boolean
  activeTab: 'report' | 'chat' | 'tests'

  setReviewTarget: (target: ReviewTarget | null) => void
  setReview: (review: AiReview | null) => void
  setReviewing: (loading: boolean) => void
  setReviewError: (err: string | null) => void
  setReviewOpen: (open: boolean) => void
  setActiveTab: (tab: 'report' | 'chat' | 'tests') => void

  openReviewForPr: (pr: {
    github_pr_id: string
    repo_name: string
    title: string
    full_review?: any
  }) => Promise<void>
  reanalyzeCurrentTarget: () => Promise<void>
  reset: () => void
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviewTarget: null,
  review: null,
  reviewing: false,
  reviewError: null,
  reviewOpen: false,
  activeTab: 'report',

  setReviewTarget: (reviewTarget) => set({ reviewTarget }),
  setReview: (review) => set({ review }),
  setReviewing: (reviewing) => set({ reviewing }),
  setReviewError: (reviewError) => set({ reviewError }),
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
      set({
        reviewTarget: null,
        review: null,
        reviewError: `Invalid PR number for "${pr.title}"`,
        reviewing: false,
        reviewOpen: true,
        activeTab: 'report',
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
      set({
        review: pr.full_review as AiReview,
        reviewError: null,
        reviewing: false,
      })
      return
    }

    set({
      review: null,
      reviewError: null,
      reviewing: true,
    })

    try {
      const result = await requestAiReview(pr.repo_name, prNumber)
      set({ review: result, reviewing: false })
    } catch (err) {
      set({
        reviewError: err instanceof Error ? err.message : String(err),
        reviewing: false,
      })
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
    })

    try {
      const result = await requestAiReview(reviewTarget.repoName, reviewTarget.prNumber)
      set({ review: result, reviewing: false })
    } catch (err) {
      set({
        reviewError: err instanceof Error ? err.message : String(err),
        reviewing: false,
      })
    }
  },

  reset: () =>
    set({
      reviewTarget: null,
      review: null,
      reviewing: false,
      reviewError: null,
      reviewOpen: false,
      activeTab: 'report',
    }),
}))
