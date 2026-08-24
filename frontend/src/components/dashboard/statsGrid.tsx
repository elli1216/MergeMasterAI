import { GitCommit, ShieldAlert, ShieldCheck, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

type StatsGridProps = {
  active: number
  blocked: number
  approved: number
  commits: number
}

export function StatsGrid({ active, blocked, approved, commits }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* 1. Active PRs */}
      <Card className="bg-zinc-950 border-zinc-800 hover:border-amber-700/60 transition-all rounded-none shadow-none relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500 opacity-60 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-zinc-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Active PRs
          </CardTitle>
          <span className="text-[10px] font-mono text-zinc-600 uppercase">Triage</span>
        </CardHeader>
        <CardContent>
          <div className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tighter text-white font-mono">{active}</div>
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Awaiting or in-review
          </p>
        </CardContent>
      </Card>

      {/* 2. Blocked Gates */}
      <Card className="bg-zinc-950 border-zinc-800 hover:border-red-700/60 transition-all rounded-none shadow-none relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500 opacity-60 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-zinc-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            Blocked Gates
          </CardTitle>
          <span className="text-[10px] font-mono text-red-500/80 uppercase">High Risk</span>
        </CardHeader>
        <CardContent>
          <div className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tighter text-red-400 font-mono">{blocked}</div>
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Threshold exceeded (&gt;75%)
          </p>
        </CardContent>
      </Card>

      {/* 3. Auto-Approved */}
      <Card className="bg-zinc-950 border-zinc-800 hover:border-emerald-700/60 transition-all rounded-none shadow-none relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-zinc-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Auto-Approved
          </CardTitle>
          <span className="text-[10px] font-mono text-emerald-500/80 uppercase">Safe</span>
        </CardHeader>
        <CardContent>
          <div className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tighter text-emerald-400 font-mono">{approved}</div>
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Zero blockers detected
          </p>
        </CardContent>
      </Card>

      {/* 4. Commits Indexed */}
      <Card className="bg-zinc-950 border-zinc-800 hover:border-zinc-600 transition-all rounded-none shadow-none relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-zinc-600 opacity-60 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-zinc-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <GitCommit className="w-3.5 h-3.5 text-zinc-400" />
            Commits Indexed
          </CardTitle>
          <span className="text-[10px] font-mono text-zinc-600 uppercase">Live</span>
        </CardHeader>
        <CardContent>
          <div className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tighter text-white font-mono">{commits}</div>
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Monitored repos activity
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
