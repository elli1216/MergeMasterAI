import { GitCommit, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

type StatsGridProps = {
  active: number
  blocked: number
  approved: number
  commits: number
}

export function StatsGrid({ active, blocked, approved, commits }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-zinc-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            Active PRs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl md:text-5xl font-light tracking-tighter text-white">{active}</div>
          <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-wider mt-2">Awaiting AI review</p>
        </CardContent>
      </Card>
      <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-zinc-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Blocked
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl md:text-5xl font-light tracking-tighter text-white">{blocked}</div>
          <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-wider mt-2">Risk threshold exceeded</p>
        </CardContent>
      </Card>
      <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-zinc-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Auto-Approved
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl md:text-5xl font-light tracking-tighter text-white">{approved}</div>
          <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-wider mt-2">No blockers detected</p>
        </CardContent>
      </Card>
      <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-zinc-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <GitCommit className="w-4 h-4" /> Commits Indexed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl md:text-5xl font-light tracking-tighter text-white">{commits}</div>
          <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-wider mt-2">Latest activity window</p>
        </CardContent>
      </Card>
    </div>
  )
}
