import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useAuth } from '@workos-inc/authkit-react'
import { useEffect, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../convex/_generated/dataModel'
import type {ReviewTarget} from '~/components/dashboard';
import type {AiReview} from '~/lib/backend';
import {
  AiReviewDialog,
  AnalyzeHistoryPanel,
  CommitsPanel,
  PullRequestsPanel,
  StatsGrid
} from '~/components/dashboard'
import { requestAiReview } from '~/lib/backend'


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
    return <LandingPage onSignIn={() => signIn()} onSignUp={() => signUp()} />
  }

  return <Dashboard />
}

function LandingPage({ onSignIn, onSignUp }: { onSignIn: () => void, onSignUp: () => void }) {
  return (
    <div className="min-h-screen bg-black text-zinc-50 flex flex-col font-sans selection:bg-white selection:text-black">
      <header className="flex items-center justify-between p-8 border-b border-zinc-900">
        <div className="flex items-center gap-4">
          <div className="font-extrabold tracking-tight text-white uppercase tracking-widest text-xl">MergeMaster</div>
        </div>
        <div className="flex gap-4">
          <button onClick={onSignIn} className="border border-zinc-700 px-6 py-2 text-xs font-mono uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            System Login
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-4xl mx-auto space-y-4">
        <img src="/mergemaster.png" alt="Main Logo" className='size-30 rounded-full' />
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter text-white">
            The Autonomous <br /><span className="font-serif italic text-zinc-500">Deployment Gatekeeper</span>
          </h1>
          <p className="text-zinc-400 font-mono text-sm max-w-2xl mx-auto leading-relaxed mt-8">
            MergeMaster AI analyzes your PRs, routes human reviewers, generates security risk scores, and autonomously pushes remediations. Keep your mainline pristine.
          </p>
        </div>

        <div className="flex gap-6 mt-12">
          <button onClick={onSignUp} className="bg-white text-black px-8 py-4 text-sm font-mono uppercase tracking-widest hover:bg-zinc-200 transition-all">
            Initialize Setup
          </button>
          <a href="https://github.com/elli1216/MergeMasterAI" target="_blank" rel="noreferrer" className="border border-zinc-700 px-8 py-4 text-sm font-mono uppercase tracking-widest hover:bg-zinc-900 transition-all text-zinc-300">
            View Protocol
          </a>
        </div>
      </main>
    </div>
  )
}

function Dashboard() {
  const { data: prs } = useSuspenseQuery(convexQuery(api.pullRequests.getActivePRs, {}))
  const { data: commits } = useSuspenseQuery(convexQuery(api.github.getRecentCommits, {}))
  const { data: historyLogs } = useSuspenseQuery(convexQuery(api.pullRequests.getAnalyzeHistory, {}))
  const overrideDecision = useMutation(api.pullRequests.overrideDecision)
  const saveMarkdown = useMutation(api.pullRequests.saveMarkdownReport)
  const queryClient = useQueryClient()

  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null)
  const [review, setReview] = useState<AiReview | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  const handleOverride = async (prId: Id<'pull_requests'>, status: 'approved' | 'blocked', reason: string) => {
    if (reason) {
      await overrideDecision({ prId, status, reason })
    }
  }

  const handleSaveMarkdown = async (markdown: string) => {
    if (!reviewTarget) return
    await saveMarkdown({
      github_pr_id: String(reviewTarget.prNumber),
      repo_name: reviewTarget.repoName,
      markdown_report: markdown,
    })
  }

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
    if (!reviewTarget) return
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
        <PullRequestsPanel prs={prs} onOverride={handleOverride} onReview={handleReview} />
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
        onSaveMarkdown={handleSaveMarkdown}
      />
    </>
  )
}