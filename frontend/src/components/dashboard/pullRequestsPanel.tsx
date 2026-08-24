import type { Doc } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Link } from '@tanstack/react-router'
import { ExternalLink, Sparkles, Clock, FolderGit2 } from 'lucide-react'

type PullRequestsPanelProps = {
  prs: Array<Doc<'pull_requests'>>
  onReview: (pr: Doc<'pull_requests'>) => void
  hideRepoLink?: boolean
}

export function PullRequestsPanel({ prs, onReview, hideRepoLink }: PullRequestsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Evaluation Log</span>
            <span className="text-xs font-mono px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-normal">
              {prs.length} PRs
            </span>
          </h2>
          <p className="text-zinc-500 font-mono text-xs md:text-sm">Real-time autonomous risk scoring & release gates</p>
        </div>
      </div>

      {/* 1. MOBILE CARD VIEW (Shown on small screens) */}
      <div className="sm:hidden space-y-3">
        {prs.length > 0 ? (
          prs.map((pr) => (
            <Card key={pr._id} className="bg-zinc-950 border-zinc-800 rounded-none p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 overflow-hidden">
                  <a
                    href={`https://github.com/${pr.repo_name}/pull/${pr.github_pr_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5 hover:underline"
                  >
                    <span>#{pr.github_pr_id}</span>
                    <span className="truncate">{pr.title}</span>
                    <ExternalLink size={12} className="text-zinc-500 shrink-0" />
                  </a>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    by {pr.author} • {pr.repo_name}
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`rounded-none font-mono text-[9px] uppercase tracking-wider shrink-0 border
                    ${pr.status === 'blocked' ? 'border-red-500 text-red-400 bg-red-950/20' : ''}
                    ${pr.status === 'approved' ? 'border-green-500 text-green-400 bg-green-950/20' : ''}
                    ${pr.status === 'pending' ? 'border-zinc-700 text-zinc-400 bg-transparent border-dashed' : ''}
                    ${pr.status === 'merged' ? 'border-zinc-500 text-zinc-300 bg-transparent' : ''}
                    ${pr.status === 'closed' ? 'border-zinc-800 text-zinc-600 bg-transparent' : ''}
                  `}
                >
                  {pr.status}
                </Badge>
              </div>

              {/* Risk Meter */}
              <div className="space-y-1 bg-zinc-900/50 p-2 border border-zinc-900">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-500 uppercase">Risk Confidence</span>
                  <span
                    className={`font-bold ${
                      pr.risk_score <= 25
                        ? 'text-emerald-400'
                        : pr.risk_score <= 75
                          ? 'text-amber-400'
                          : 'text-red-400'
                    }`}
                  >
                    {pr.risk_score}%
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5">
                  <div
                    className={`h-1.5 transition-all ${
                      pr.risk_score <= 25
                        ? 'bg-emerald-500'
                        : pr.risk_score <= 75
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(pr.risk_score, 4)}%` }}
                  />
                </div>
              </div>

              {/* AI Summary excerpt if present */}
              {pr.ai_summary && (
                <p className="text-xs text-zinc-400 font-serif italic line-clamp-2 bg-black/40 p-2 border-l border-zinc-700">
                  "{pr.ai_summary}"
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-zinc-900">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReview(pr)}
                  className="flex-1 h-10 text-xs font-mono uppercase tracking-wider bg-white text-black font-bold hover:bg-zinc-200 rounded-none border-white flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Review & Copilot</span>
                </Button>

                {!hideRepoLink && pr.repository_id && (
                  <Link to="/repository/$id" params={{ id: pr.repository_id }}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-3 text-xs font-mono uppercase tracking-wider bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 rounded-none flex items-center justify-center"
                      title="View Repository Details"
                    >
                      <FolderGit2 className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-600 border border-zinc-900 bg-zinc-950">
            <Clock className="w-8 h-8 mb-3 stroke-1" />
            <p className="font-mono text-xs uppercase tracking-wider text-center">No evaluations found in the system</p>
          </div>
        )}
      </div>

      {/* 2. DESKTOP TABLE VIEW (Shown on sm: and up) */}
      <Card className="hidden sm:block bg-zinc-950 border-zinc-800 rounded-none shadow-none overflow-x-auto">
        <CardContent className="p-0 min-w-[650px]">
          {prs.length > 0 ? (
            <Table>
              <TableHeader className="bg-zinc-900 border-b border-zinc-800">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[80px]">ID</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">Pull Request</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[130px]">Risk Score</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[110px]">Gate Status</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 hidden lg:table-cell">AI Analysis</TableHead>
                  <TableHead className="text-right text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prs.map((pr) => (
                  <TableRow key={pr._id} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                    <TableCell className="font-mono text-zinc-500 text-xs">#{pr.github_pr_id}</TableCell>
                    <TableCell>
                      <a
                        href={`https://github.com/${pr.repo_name}/pull/${pr.github_pr_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-2 max-w-[200px] md:max-w-[320px]"
                      >
                        <div className="font-semibold text-white tracking-tight truncate group-hover:underline decoration-zinc-500 underline-offset-4 decoration-1 transition-all">
                          {pr.title}
                        </div>
                        <ExternalLink size={12} className="text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                      </a>
                      <div className="text-[10px] sm:text-xs text-zinc-500 font-mono mt-1 truncate">
                        by {pr.author} // {pr.repo_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-zinc-800 h-1.5 max-w-[70px]">
                            <div
                              className={`h-1.5 transition-all ${
                                pr.risk_score <= 25
                                  ? 'bg-emerald-500'
                                  : pr.risk_score <= 75
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.max(pr.risk_score, 5)}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-mono font-bold ${
                              pr.risk_score <= 25
                                ? 'text-emerald-400'
                                : pr.risk_score <= 75
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                            }`}
                          >
                            {pr.risk_score}%
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`rounded-none font-mono text-[10px] uppercase tracking-wider border
                          ${pr.status === 'blocked' ? 'border-red-500 text-red-400 bg-red-950/20' : ''}
                          ${pr.status === 'approved' ? 'border-green-500 text-green-400 bg-green-950/20' : ''}
                          ${pr.status === 'pending' ? 'border-zinc-700 text-zinc-400 bg-transparent border-dashed' : ''}
                          ${pr.status === 'merged' ? 'border-zinc-500 text-zinc-300 bg-transparent' : ''}
                          ${pr.status === 'closed' ? 'border-zinc-800 text-zinc-600 bg-transparent' : ''}
                        `}
                      >
                        {pr.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[260px] truncate text-xs text-zinc-400 font-serif italic" title={pr.ai_summary}>
                      "{pr.ai_summary}"
                    </TableCell>
                    <TableCell className="text-right space-x-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReview(pr)}
                        className="h-8 px-3 text-[10px] font-mono uppercase tracking-wider text-black bg-white font-bold hover:bg-zinc-200 rounded-none border-white transition-all shadow-sm"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Review
                      </Button>
                      {!hideRepoLink && pr.repository_id && (
                        <Link to="/repository/$id" params={{ id: pr.repository_id }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-[10px] font-mono uppercase tracking-wider text-zinc-300 hover:text-black hover:bg-white rounded-none transition-all"
                            title="View Repository Details"
                          >
                            <FolderGit2 className="w-3 h-3" />
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
              <Clock className="w-10 h-10 mb-3 stroke-1" />
              <p className="font-mono text-sm uppercase tracking-wider text-center">No evaluations found in the system</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}