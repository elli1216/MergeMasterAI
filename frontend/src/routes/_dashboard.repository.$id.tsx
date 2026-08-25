import { Link, createFileRoute } from '@tanstack/react-router'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useAuth } from '@workos-inc/authkit-react'
import { ChevronLeft } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import {
  AiReviewDialog,
  BranchesPanel,
  CommitsPanel,
  PullRequestsPanel,
} from '~/components/dashboard'
import { useReviewStore } from '~/store'
import Loading from '~/components/common/Loading'

export const Route = createFileRoute('/_dashboard/repository/$id')({
  component: RepositoryDetailPage,
})

function RepositoryDetailPage() {
  const { user, isLoading } = useAuth()
  const { id } = Route.useParams()
  const queryClient = useQueryClient()

  // Note: we have to cast id to Id<'repositories'> for Convex typing
  const { data } = useSuspenseQuery(
    convexQuery(api.repositories.getRepositoryDetails, {
      repositoryId: id as Id<'repositories'>,
    }),
  )
  const { repo, prs, commits, branches } = data

  // Zustand Review Store - Atomic Selectors
  const reviewTarget = useReviewStore((state) => state.reviewTarget)
  const review = useReviewStore((state) => state.review)
  const reviewing = useReviewStore((state) => state.reviewing)
  const reviewError = useReviewStore((state) => state.reviewError)
  const reviewOpen = useReviewStore((state) => state.reviewOpen)
  const setReviewOpen = useReviewStore((state) => state.setReviewOpen)
  const openReviewForPr = useReviewStore((state) => state.openReviewForPr)
  const reanalyzeCurrentTarget = useReviewStore((state) => state.reanalyzeCurrentTarget)

  if (isLoading) {
    return <Loading />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p>Unauthorized. Please return to the homepage to log in.</p>
      </div>
    )
  }

  const handleReview = async (pr: any) => {
    await openReviewForPr(pr)
    await queryClient.invalidateQueries()
  }

  const handleReanalyze = async () => {
    await reanalyzeCurrentTarget()
    await queryClient.invalidateQueries()
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <Link
            to="/repositories"
            className="text-zinc-500 hover:text-white flex items-center gap-2 font-mono text-xs uppercase tracking-widest mb-6 transition-colors w-fit"
          >
            <ChevronLeft size={16} />
            Back to Repositories
          </Link>

          <h2 className="text-3xl font-light tracking-tighter text-white">
            {repo.name}
          </h2>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-2">
            {repo.owner}
          </p>
        </div>

        <div className="space-y-12">
          <BranchesPanel branches={branches} />
          <PullRequestsPanel prs={prs} onReview={handleReview} hideRepoLink />
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

