import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Button } from '~/components/ui/button'
import { Shield, GitPullRequest, Settings, ShieldAlert, ShieldCheck, Activity } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

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
