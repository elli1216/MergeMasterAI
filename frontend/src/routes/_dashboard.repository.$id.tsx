import { Link, createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useAuth } from '@workos-inc/authkit-react'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { ReviewTarget } from '~/components/dashboard'
import type { AiReview } from '~/lib/backend'
import type { Id } from '../../convex/_generated/dataModel'
import { requestAiReview } from '~/lib/backend'
import { AiReviewDialog, BranchesPanel, CommitsPanel, PullRequestsPanel } from '~/components/dashboard'


export const Route = createFileRoute('/_dashboard/repository/$id')({
  component: RepositoryDetailPage,
})

function RepositoryDetailPage() {
  const { user, isLoading } = useAuth()
  const { id } = Route.useParams()

  // Note: we have to cast id to Id<'repositories'> for Convex typing
  const { data } = useSuspenseQuery(convexQuery(api.repositories.getRepositoryDetails, { repositoryId: id as Id<'repositories'> }))
  const { repo, prs, commits, branches } = data

  const overrideDecision = useMutation(api.pullRequests.overrideDecision)

  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null)
  const [review, setReview] = useState<AiReview | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-mono uppercase tracking-widest text-xs animate-pulse">Loading System...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p>Unauthorized. Please return to the homepage to log in.</p>
      </div>
    )
  }

  const handleOverride = async (prId: Id<'pull_requests'>, status: 'approved' | 'blocked', reason: string) => {
    if (reason) {
      await overrideDecision({ prId, status, reason, userGithubId: user?.id })
    }
  }

  const handleReview = async (pr: any) => {
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
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : String(err))
    } finally {
      setReviewing(false)
    }
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <Link to="/repositories" className="text-zinc-500 hover:text-white flex items-center gap-2 font-mono text-xs uppercase tracking-widest mb-6 transition-colors w-fit">
            <ChevronLeft size={16} />
            Back to Repositories
          </Link>

          <h2 className="text-3xl font-light tracking-tighter text-white">{repo.name}</h2>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-2">{repo.owner}</p>
        </div>

        <div className="space-y-12">
          <BranchesPanel branches={branches} />
          <PullRequestsPanel prs={prs} onOverride={handleOverride} onReview={handleReview} hideRepoLink />
          <CommitsPanel commits={commits} />
        </div>
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
