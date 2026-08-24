import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useAuth } from '@workos-inc/authkit-react'
import { useEffect, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'
import type {ReviewTarget} from '~/components/dashboard';
import type {AiReview} from '~/lib/backend';
import {
  AiReviewDialog,
  AnalyzeHistoryPanel,
  CommitsPanel,
  PullRequestsPanel,
  StatsGrid,
} from '~/components/dashboard'
import { requestAiReview } from '~/lib/backend'
import { LandingView } from '~/components/landing/landingView'


export const Route = createFileRoute('/_dashboard/')({
  component: IndexPage,
})

function IndexPage() {
  const { user, isLoading, signIn, signUp } = useAuth()
  const syncUser = useMutation(api.users.syncUser)

  useEffect(() => {
    if (user) {
      // 1. Persist the session to local storage as requested
      localStorage.setItem('workos_user', JSON.stringify(user))

      // 2. Sync new signups to the Convex database
      syncUser({
        github_id: user.id,
        name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Anonymous Engineer',
        email: user.email,
      }).catch(console.error)
    } else if (!isLoading) {
      // Clean up local storage if logged out
      localStorage.removeItem('workos_user')
    }
  }, [user, isLoading, syncUser])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-mono uppercase tracking-widest text-xs animate-pulse">Loading System...</div>
      </div>
    )
  }

  if (!user) {
    return <LandingView onSignIn={() => signIn()} onSignUp={() => signUp()} />
  }

  return <Dashboard />
}

function Dashboard() {
  const { data: prs } = useSuspenseQuery(convexQuery(api.pullRequests.getActivePRs, {}))
  const { data: commits } = useSuspenseQuery(convexQuery(api.github.getRecentCommits, {}))
  const { data: historyLogs } = useSuspenseQuery(convexQuery(api.pullRequests.getAnalyzeHistory, {}))
  const queryClient = useQueryClient()

  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null)
  const [review, setReview] = useState<AiReview | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  const handleViewHistory = (log: any) => {
    setReviewTarget({ repoName: log.repo_name, prNumber: Number(log.github_pr_id), title: log.pr_title })
    setReview(log.full_review || null)
    setReviewError(null)
    setReviewing(false)
    setReviewOpen(true)
  }

  const handleReview = async (pr: Doc<'pull_requests'>) => {
    const prNumber = Number(pr.github_pr_id)
    if (!Number.isInteger(prNumber)) {
      setReviewTarget(null)
      setReview(null)
      setReviewError(`Invalid PR number for "${pr.title}"`)
      setReviewing(false)
      setReviewOpen(true)
      return
    }
    setReviewTarget({ repoName: pr.repo_name, prNumber, title: pr.title })
    setReviewOpen(true)

    if (pr.full_review) {
      setReview(pr.full_review as AiReview)
      setReviewError(null)
      setReviewing(false)
      return
    }

    setReview(null)
    setReviewError(null)
    setReviewing(true)
    try {
      const result = await requestAiReview(pr.repo_name, prNumber)
      setReview(result)
      await queryClient.invalidateQueries()
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : String(err))
    } finally {
      setReviewing(false)
    }
  }

  const handleReanalyze = async () => {
    if (!reviewTarget || review?.status === 'approved') return
    setReview(null)
    setReviewError(null)
    setReviewing(true)
    try {
      const result = await requestAiReview(reviewTarget.repoName, reviewTarget.prNumber)
      setReview(result)
      await queryClient.invalidateQueries()
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : String(err))
    } finally {
      setReviewing(false)
    }
  }

  const activeCount = prs.filter((pr) => pr.status === 'pending').length
  const blockedCount = prs.filter((pr) => pr.status === 'blocked').length
  const approvedCount = prs.filter((pr) => pr.status === 'approved').length

  return (
    <>
      <div className="space-y-12">
        <StatsGrid active={activeCount} blocked={blockedCount} approved={approvedCount} commits={commits.length} />
        <PullRequestsPanel prs={prs} onReview={handleReview} />
        <CommitsPanel commits={commits} />
        <AnalyzeHistoryPanel logs={historyLogs} onView={handleViewHistory} />
      </div>

      <AiReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        target={reviewTarget}
        review={review}
        loading={reviewing}
        error={reviewError}
        onReanalyze={handleReanalyze}
      />
    </>
  )
}