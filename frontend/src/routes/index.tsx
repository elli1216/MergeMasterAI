import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Button } from '~/components/ui/button'
import { Shield, GitPullRequest, ShieldAlert, ShieldCheck, Activity, User, LogOut } from 'lucide-react'
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
  const overrideDecision = useMutation(api.pullRequests.overrideDecision)
  const seedMockData = useMutation(api.pullRequests.seedMockData)
  const seedRepos = useMutation(api.repositories.seedMockRepositories)

  const handleOverride = async (prId: any, status: 'approved' | 'blocked') => {
    const reason = window.prompt(`Reason for overriding to ${status}?`)
    if (reason) {
      await overrideDecision({ prId, status, reason })
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-50 p-4 md:p-8 font-sans selection:bg-white selection:text-black">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-800 pb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white text-black rounded-none">
              <Shield className="w-8 h-8 md:w-10 md:h-10 stroke-[1.5]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white uppercase tracking-widest">Command Center</h1>
              <p className="text-zinc-500 font-mono text-xs md:text-sm mt-1 uppercase">MergeMaster AI // Real-time Dashboard</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
            <div className="flex items-center gap-3 mr-4">
              {user?.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="Avatar" className="w-10 h-10 rounded-none border border-zinc-700" />
              ) : (
                <div className="w-10 h-10 bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-zinc-400" />
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="text-sm font-bold text-white uppercase tracking-wider truncate max-w-[150px]">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-zinc-500 font-mono truncate max-w-[150px]">{user?.email}</div>
              </div>
            </div>
            <Button variant="outline" className="border-zinc-700 bg-transparent hover:bg-white hover:text-black text-zinc-300 rounded-none transition-all flex-1 md:flex-none" onClick={() => { seedMockData(); seedRepos(); }}>
              <Activity className="w-4 h-4 md:mr-2" />
              <span className="hidden sm:inline">SEED DATA</span>
            </Button>
            <Button variant="outline" className="border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300 rounded-none transition-all" onClick={() => signOut()}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar / Repositories */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Repositories
              </h2>
              <p className="text-zinc-500 font-mono text-xs mt-1">Monitored Codebases</p>
            </div>

            <div className="space-y-3">
              {repos && repos.length > 0 ? (
                repos.map(repo => (
                  <Card key={repo._id} className="bg-zinc-950 border-zinc-800 rounded-none shadow-none hover:border-zinc-600 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="overflow-hidden">
                        <div className="text-sm font-bold text-white truncate">{repo.name}</div>
                        <div className="text-xs text-zinc-500 font-mono truncate">{repo.owner}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${repo.is_active ? 'bg-white' : 'bg-zinc-700'}`} />
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-zinc-600 font-mono text-xs uppercase p-4 border border-zinc-800 border-dashed text-center">
                  No repositories found
                </div>
              )}
            </div>
          </div>

          {/* Main Content / PRs */}
          <div className="lg:col-span-3 space-y-12">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-zinc-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4" /> Active PRs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl md:text-5xl font-light tracking-tighter text-white">{prs?.length || 0}</div>
                </CardContent>
              </Card>
              <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-zinc-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Blocked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl md:text-5xl font-light tracking-tighter text-white">
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
                  <div className="text-4xl md:text-5xl font-light tracking-tighter text-white">
                    {prs?.filter(pr => pr.status === 'approved').length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PR List Table */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider">Evaluation Log</h2>
                  <p className="text-zinc-500 font-mono text-xs md:text-sm">Real-time risk scoring and routing</p>
                </div>
              </div>

              <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none overflow-x-auto">
                <CardContent className="p-0 min-w-[600px]">
                  {prs && prs.length > 0 ? (
                    <Table>
                      <TableHeader className="bg-zinc-900 border-b border-zinc-800">
                        <TableRow className="border-none hover:bg-transparent">
                          <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[80px]">ID</TableHead>
                          <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">Pull Request</TableHead>
                          <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[120px]">Risk</TableHead>
                          <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 hidden md:table-cell">Status</TableHead>
                          <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 hidden lg:table-cell">AI Analysis</TableHead>
                          <TableHead className="text-right text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">Override</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prs.map((pr) => (
                          <TableRow key={pr._id} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                            <TableCell className="font-mono text-zinc-500 text-xs">#{pr.github_pr_id}</TableCell>
                            <TableCell>
                              <div className="font-semibold text-white tracking-tight truncate max-w-[200px] sm:max-w-[300px]">{pr.title}</div>
                              <div className="text-[10px] sm:text-xs text-zinc-500 font-mono mt-1 truncate">by {pr.author} // {pr.repo_name}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-zinc-800 h-1 max-w-[60px]">
                                  <div
                                    className="h-1 bg-white"
                                    style={{ width: `${Math.max(pr.risk_score, 5)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono text-zinc-400">{pr.risk_score}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge
                                variant="outline"
                                className={`rounded-none font-mono text-[10px] uppercase tracking-wider border
                                  ${pr.status === 'blocked' ? 'border-white text-black bg-white' : ''}
                                  ${pr.status === 'approved' ? 'border-zinc-500 text-zinc-300 bg-transparent' : ''}
                                  ${pr.status === 'pending' ? 'border-zinc-700 text-zinc-500 bg-transparent border-dashed' : ''}
                                `}
                              >
                                {pr.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-xs text-zinc-400 font-serif italic" title={pr.ai_summary}>
                              "{pr.ai_summary}"
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOverride(pr._id, 'approved')}
                                className="h-7 px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-black hover:bg-white rounded-none transition-all"
                              >
                                Apprv
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOverride(pr._id, 'blocked')}
                                className="h-7 px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-none transition-all"
                              >
                                Blk
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
                      <GitPullRequest className="w-12 h-12 mb-6 stroke-1" />
                      <p className="font-mono text-sm uppercase tracking-wider text-center">No evaluations found in the system</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
