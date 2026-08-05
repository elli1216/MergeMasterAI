import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Link } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { OverrideDialog, type OverrideState } from './overrideDialog'

type PullRequestsPanelProps = {
  prs: Array<Doc<'pull_requests'>>
  onOverride: (prId: Id<'pull_requests'>, status: 'approved' | 'blocked', reason: string) => void
  onReview: (pr: Doc<'pull_requests'>) => void
  hideRepoLink?: boolean
}

export function PullRequestsPanel({ prs, onOverride, onReview, hideRepoLink }: PullRequestsPanelProps) {
  const [overrideState, setOverrideState] = useState<OverrideState>(null)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider">Evaluation Log</h2>
          <p className="text-zinc-500 font-mono text-xs md:text-sm">Real-time risk scoring and routing</p>
        </div>
      </div>

      <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none overflow-x-auto">
        <CardContent className="p-0 min-w-150">
          {prs.length > 0 ? (
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
                      <a href={`https://github.com/${pr.repo_name}/pull/${pr.github_pr_id}`} target="_blank" rel="noreferrer" className="group flex items-center gap-2 max-w-[200px] sm:max-w-[300px]">
                        <div className="font-semibold text-white tracking-tight truncate group-hover:underline decoration-zinc-500 underline-offset-4 decoration-1 transition-all">{pr.title}</div>
                        <ExternalLink size={12} className="text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                      </a>
                      <div className="text-[10px] sm:text-xs text-zinc-500 font-mono mt-1 truncate">by {pr.author} // {pr.repo_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-zinc-800 h-1 max-w-[60px]">
                          <div
                            className={`h-1 ${pr.risk_score <= 25 ? 'bg-white' : pr.risk_score <= 75 ? 'bg-orange-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.max(pr.risk_score, 5)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-mono ${pr.risk_score <= 25 ? 'text-zinc-400' : pr.risk_score <= 75 ? 'text-orange-500' : 'text-red-500'}`}>{pr.risk_score}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant="outline"
                        className={`rounded-none font-mono text-[10px] uppercase tracking-wider border
                          ${pr.status === 'blocked' ? 'border-red-500 text-red-500 bg-red-500/10' : ''}
                          ${pr.status === 'approved' ? 'border-green-500 text-green-500 bg-green-500/10' : ''}
                          ${pr.status === 'pending' ? 'border-zinc-700 text-zinc-500 bg-transparent border-dashed' : ''}
                          ${pr.status === 'merged' ? 'border-zinc-500 text-zinc-300 bg-transparent' : ''}
                          ${pr.status === 'closed' ? 'border-zinc-800 text-zinc-600 bg-transparent' : ''}
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
                        onClick={() => onReview(pr)}
                        className="h-7 px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-300 hover:text-black hover:bg-white rounded-none transition-all"
                      >
                        AI
                      </Button>
                      {!hideRepoLink && pr.repository_id && (
                        <Link to="/repository/$id" params={{ id: pr.repository_id }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-300 hover:text-black hover:bg-white rounded-none transition-all"
                          >
                            Repo
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOverrideState({ prId: pr._id, status: 'approved' })}
                        className="h-7 px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-black hover:bg-white rounded-none transition-all"
                      >
                        Apprv
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOverrideState({ prId: pr._id, status: 'blocked' })}
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
              <p className="font-mono text-sm uppercase tracking-wider text-center">No evaluations found in the system</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <OverrideDialog
        overrideState={overrideState}
        onClose={() => setOverrideState(null)}
        onSubmit={onOverride}
      />
    </div>
  )
}