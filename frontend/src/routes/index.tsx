import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Button } from '~/components/ui/button'
import { Shield, GitPullRequest, Settings, ShieldAlert, ShieldCheck, Activity } from 'lucide-react'
import { useAuth } from '@workos-inc/authkit-react'
import { useEffect } from 'react'

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
        email: user.email ?? 'no-email-provided',
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
            MergePilot AI analyzes your PRs, routes human reviewers, generates security risk scores, and autonomously pushes remediations. Keep your mainline pristine.
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
  const overrideDecision = useMutation(api.pullRequests.overrideDecision)
  const seedMockData = useMutation(api.pullRequests.seedMockData)

  const handleOverride = async (prId: any, status: 'approved' | 'blocked') => {
    const reason = window.prompt(`Reason for overriding to ${status}?`)
    if (reason) {
      await overrideDecision({ prId, status, reason })
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-50 p-8 font-sans selection:bg-white selection:text-black">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header Section */}
        <header className="flex items-center justify-between border-b border-zinc-800 pb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white text-black rounded-none">
              <Shield className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase tracking-widest">Command Center</h1>
              <p className="text-zinc-500 font-mono text-sm mt-1 uppercase">MergePilot AI // Real-time Dashboard</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="border-zinc-700 bg-transparent hover:bg-white hover:text-black text-zinc-300 rounded-none transition-all" onClick={() => seedMockData()}>
              <Activity className="w-4 h-4 mr-2" />
              SEED DATA
            </Button>
            <Button variant="outline" className="border-zinc-700 bg-transparent hover:bg-white hover:text-black text-zinc-300 rounded-none transition-all">
              <Settings className="w-4 h-4 mr-2" />
              SETTINGS
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                <GitPullRequest className="w-4 h-4" /> Active PRs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-light tracking-tighter text-white">{prs?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Blocked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-light tracking-tighter text-white">
                {prs?.filter(pr => pr.status === 'blocked').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Auto-Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-light tracking-tighter text-white">
                {prs?.filter(pr => pr.status === 'approved').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PR List Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">Evaluation Log</h2>
              <p className="text-zinc-500 font-mono text-sm">Real-time risk scoring and routing</p>
            </div>
          </div>

          <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none">
            <CardContent className="p-0">
              {prs && prs.length > 0 ? (
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader className="bg-zinc-900 border-b border-zinc-800">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">ID</TableHead>
                        <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">Pull Request</TableHead>
                        <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">Risk</TableHead>
                        <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">Status</TableHead>
                        <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">AI Analysis</TableHead>
                        <TableHead className="text-right text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">Manual Override</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prs.map((pr) => (
                        <TableRow key={pr._id} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                          <TableCell className="font-mono text-zinc-500">#{pr.github_pr_id}</TableCell>
                          <TableCell>
                            <div className="font-semibold text-white tracking-tight">{pr.title}</div>
                            <div className="text-xs text-zinc-500 font-mono mt-1">by {pr.author} // {new Date(pr.updated_at).toLocaleTimeString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-full bg-zinc-800 h-1 max-w-[100px]">
                                <div
                                  className="h-1 bg-white"
                                  style={{ width: `${Math.max(pr.risk_score, 5)}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-zinc-400">{pr.risk_score}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`rounded-none font-mono text-xs uppercase tracking-wider border
                                ${pr.status === 'blocked' ? 'border-white text-black bg-white' : ''}
                                ${pr.status === 'approved' ? 'border-zinc-500 text-zinc-300 bg-transparent' : ''}
                                ${pr.status === 'pending' ? 'border-zinc-700 text-zinc-500 bg-transparent border-dashed' : ''}
                              `}
                            >
                              {pr.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate text-sm text-zinc-400 font-serif italic" title={pr.ai_summary}>
                            "{pr.ai_summary}"
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOverride(pr._id, 'approved')}
                              className="h-8 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-black hover:bg-white rounded-none transition-all"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOverride(pr._id, 'blocked')}
                              className="h-8 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-none transition-all"
                            >
                              Block
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
                  <GitPullRequest className="w-12 h-12 mb-6 stroke-1" />
                  <p className="font-mono text-sm uppercase tracking-wider">No evaluations found in the system</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
