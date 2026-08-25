import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useAuth } from '@workos-inc/authkit-react'
import { useEffect } from 'react'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'
import {
  AiReviewDialog,
  AnalysisHistoryDialog,
  AnalyzeHistoryPanel,
  CommitsPanel,
  PullRequestsPanel,
  StatsGrid,
} from '~/components/dashboard'
import { useReviewStore, useHistoryStore } from '~/store'
import { LandingView } from '~/components/landing/landingView'
import Loading from '~/components/common/Loading'

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
        name: user.firstName
          ? `${user.firstName} ${user.lastName || ''}`.trim()
          : 'Anonymous Engineer',
        email: user.email,
      }).catch(console.error)
    } else if (!isLoading) {
      // Clean up local storage if logged out
      localStorage.removeItem('workos_user')
    }
  }, [user, isLoading, syncUser])

  if (isLoading) {
    return <Loading />
  }

  if (!user) {
    return <LandingView onSignIn={() => signIn()} onSignUp={() => signUp()} />
  }

  return <Dashboard />
}

function Dashboard() {
  const { data: prs } = useSuspenseQuery(
    convexQuery(api.pullRequests.getActivePRs, {}),
  )
  const { data: commits } = useSuspenseQuery(
    convexQuery(api.github.getRecentCommits, {}),
  )
  const { data: historyLogs } = useSuspenseQuery(
    convexQuery(api.pullRequests.getAnalyzeHistory, {}),
  )
  const queryClient = useQueryClient()

  // Zustand Stores - Atomic Selectors
  const reviewTarget = useReviewStore((state) => state.reviewTarget)
  const review = useReviewStore((state) => state.review)
  const reviewing = useReviewStore((state) => state.reviewing)
  const reviewError = useReviewStore((state) => state.reviewError)
  const reviewOpen = useReviewStore((state) => state.reviewOpen)
  const setReviewOpen = useReviewStore((state) => state.setReviewOpen)
  const openReviewForPr = useReviewStore((state) => state.openReviewForPr)
  const reanalyzeCurrentTarget = useReviewStore((state) => state.reanalyzeCurrentTarget)

  const selectedHistoryRecord = useHistoryStore((state) => state.selectedHistoryRecord)
  const historyDialogOpen = useHistoryStore((state) => state.historyDialogOpen)
  const setHistoryDialogOpen = useHistoryStore((state) => state.setHistoryDialogOpen)
  const openHistoryDialog = useHistoryStore((state) => state.openHistoryDialog)

  const handleReview = async (pr: Doc<'pull_requests'>) => {
    await openReviewForPr(pr)
    await queryClient.invalidateQueries()
  }

  const handleReanalyze = async () => {
    await reanalyzeCurrentTarget()
    await queryClient.invalidateQueries()
  }

  const activeCount = prs.filter((pr) => pr.status === 'pending').length
  const blockedCount = prs.filter((pr) => pr.status === 'blocked').length
  const approvedCount = prs.filter((pr) => pr.status === 'approved').length

  return (
    <>
      <div className="space-y-12">
        <StatsGrid
          active={activeCount}
          blocked={blockedCount}
          approved={approvedCount}
          commits={commits.length}
        />
        <PullRequestsPanel prs={prs} onReview={handleReview} />
        <CommitsPanel commits={commits} />
        <AnalyzeHistoryPanel logs={historyLogs} onView={openHistoryDialog} />
      </div>

      {/* Live PR Review Dialog */}
      <AiReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        target={reviewTarget}
        review={review}
        loading={reviewing}
        error={reviewError}
        onReanalyze={handleReanalyze}
      />

      {/* Separate Dedicated Historical Analysis State Modal */}
      <AnalysisHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        record={selectedHistoryRecord}
        allPrHistory={historyLogs as any}
      />
    </>
  )
}

