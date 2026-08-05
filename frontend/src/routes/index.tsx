import { createFileRoute } from '@tanstack/react-router'
import { useAction, useMutation } from 'convex/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useAuth } from '@workos-inc/authkit-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { CommitsPanel, DashboardHeader, PullRequestsPanel, RepositorySidebar, StatsGrid } from '~/components/dashboard'

export const Route = createFileRoute('/')({
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
  const { user, signOut } = useAuth()
  const { data: prs } = useSuspenseQuery(convexQuery(api.pullRequests.getActivePRs, {}))
  const { data: repos } = useSuspenseQuery(convexQuery(api.repositories.getUserRepositories, {}))
  const { data: commits } = useSuspenseQuery(convexQuery(api.github.getRecentCommits, {}))
  const overrideDecision = useMutation(api.pullRequests.overrideDecision)
  const syncGitHub = useAction(api.github.syncGitHubData)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const didAutoSync = useRef(false)

  const doSync = useCallback(async () => {
    const token = localStorage.getItem('github_oauth_access_token')
    if (!token) {
      setSyncMessage('No GitHub token found. Sign out and sign back in to grant GitHub access.')
      return
    }
    setSyncing(true)
    setSyncMessage(null)
    try {
      const result = await syncGitHub({ token })
      setSyncMessage(`Synced ${result.repos} repos, ${result.prs} PRs, ${result.commits} commits`)
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : String(err))
    } finally {
      setSyncing(false)
    }
  }, [syncGitHub])

  useEffect(() => {
    if (!didAutoSync.current) {
      didAutoSync.current = true
      doSync()
    }
  }, [doSync])

  const handleOverride = async (prId: Id<'pull_requests'>, status: 'approved' | 'blocked') => {
    const reason = window.prompt(`Reason for overriding to ${status}?`)
    if (reason) {
      await overrideDecision({ prId, status, reason })
    }
  }

  const openPrCount: Record<string, number> = {}
  for (const pr of prs) {
    if (pr.status === 'pending' || pr.status === 'approved' || pr.status === 'blocked') {
      openPrCount[pr.repo_name] = (openPrCount[pr.repo_name] ?? 0) + 1
    }
  }
  const activeCount = prs.filter((pr) => pr.status === 'pending').length
  const blockedCount = prs.filter((pr) => pr.status === 'blocked').length
  const approvedCount = prs.filter((pr) => pr.status === 'approved').length

  return (
    <div className="min-h-screen bg-black text-zinc-50 p-4 md:p-8 font-sans selection:bg-white selection:text-black">
      <div className="max-w-7xl mx-auto space-y-12">
        <DashboardHeader
          userName={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`}
          userEmail={user?.email ?? ''}
          avatarUrl={user?.profilePictureUrl ?? undefined}
          syncing={syncing}
          syncMessage={syncMessage}
          onSync={() => doSync()}
          onSignOut={() => signOut()}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <RepositorySidebar repos={repos} openPrCount={openPrCount} />

          <div className="lg:col-span-3 space-y-12">
            <StatsGrid active={activeCount} blocked={blockedCount} approved={approvedCount} commits={commits.length} />
            <PullRequestsPanel prs={prs} onOverride={handleOverride} />
            <CommitsPanel commits={commits} />
          </div>
        </div>
      </div>
    </div>
  )
}