import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useAuth } from '@workos-inc/authkit-react'
import { api } from '../../convex/_generated/api'

import { RepositorySidebar as RepositoriesView } from '~/components/dashboard/repositorySidebar'
import { RoutingRulesPanel } from '~/components/dashboard/routingRulesPanel'
import { PoliciesPanel } from '~/components/dashboard/policiesPanel'

export const Route = createFileRoute('/_dashboard/repositories/')({
  component: RepositoriesPage,
})

function RepositoriesPage() {
  const { user, isLoading } = useAuth()
  const { data: repos } = useSuspenseQuery(convexQuery(api.repositories.getUserRepositories, {}))
  const { data: prs } = useSuspenseQuery(convexQuery(api.pullRequests.getActivePRs, {}))

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

  const openPrCount: Record<string, number> = {}
  for (const pr of prs) {
    if (pr.status === 'pending' || pr.status === 'approved' || pr.status === 'blocked') {
      openPrCount[pr.repo_name] = (openPrCount[pr.repo_name] ?? 0) + 1
    }
  }

  return (
    <>
      <div className="space-y-12 max-w-4xl">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-light tracking-tighter text-white">Codebases</h2>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Monitored repositories & active pull requests</p>
          </div>
          <div className="border border-zinc-900 bg-zinc-950 p-6">
            <RepositoriesView repos={repos} openPrCount={openPrCount} />
          </div>
        </div>

        <RoutingRulesPanel />

        <PoliciesPanel />
      </div>
    </>
  )
}
