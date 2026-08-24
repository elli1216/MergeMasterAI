import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Clock, Sparkles } from 'lucide-react'

type AnalyzeHistoryPanelProps = {
  logs: Array<any>
  onView: (log: any) => void
}

export function AnalyzeHistoryPanel({ logs, onView }: AnalyzeHistoryPanelProps) {
  return (
    <div className="space-y-4 mt-8 md:mt-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Analysis History</span>
            <span className="text-xs font-mono px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-normal">
              {logs.length} Decisions Logged
            </span>
          </h2>
          <p className="text-zinc-500 font-mono text-xs md:text-sm">Audit log of all autonomous multi-agent decisions</p>
        </div>
      </div>

      {/* Mobile Card List (sm:hidden) */}
      <div className="sm:hidden space-y-3">
        {logs.length > 0 ? (
          logs.map((log) => (
            <Card key={log._id} className="bg-zinc-950 border-zinc-800 rounded-none p-4 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-[10px]">
                  {formatDistanceToNow(log.created_at, { addSuffix: true })}
                </span>
                <Badge
                  variant="outline"
                  className={`rounded-none font-mono text-[9px] uppercase tracking-wider border
                    ${log.decision_type === 'block_merge' ? 'border-red-500/50 text-red-400 bg-red-950/20' : ''}
                    ${log.decision_type === 'auto_approve' ? 'border-green-500/50 text-green-400 bg-green-950/20' : ''}
                    ${log.decision_type === 'route_reviewer' ? 'border-amber-500/50 text-amber-400 bg-amber-950/20' : ''}
                    ${log.decision_type === 'remediate_code' ? 'border-blue-500/50 text-blue-400 bg-blue-950/20' : ''}
                  `}
                >
                  {log.decision_type.replace('_', ' ')}
                </Badge>
              </div>

              <div>
                <div className="text-sm font-bold text-white tracking-tight">{log.repo_name}</div>
                <div className="text-[11px] text-zinc-400">PR #{log.github_pr_id} • {log.pr_title}</div>
              </div>

              {log.reasoning && (
                <p className="text-zinc-400 font-serif italic text-xs bg-black/40 p-2 border-l border-zinc-700">
                  "{log.reasoning}"
                </p>
              )}

              {log.overridden_by_name && (
                <div className="text-[10px] text-amber-400">
                  Overridden by: {log.overridden_by_name}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(log)}
                disabled={!log.full_review}
                className="w-full h-9 text-xs font-mono uppercase tracking-wider bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-white hover:text-black rounded-none flex items-center justify-center gap-1.5 mt-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>View Full Review Analysis</span>
              </Button>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-600 bg-zinc-950 border border-zinc-900">
            <Clock className="w-8 h-8 mb-3 stroke-1" />
            <p className="font-mono text-xs uppercase tracking-wider text-center">No history logs recorded</p>
          </div>
        )}
      </div>

      {/* Desktop Table (hidden sm:block) */}
      <Card className="hidden sm:block bg-zinc-950 border-zinc-800 rounded-none shadow-none overflow-x-auto">
        <CardContent className="p-0 min-w-[650px]">
          {logs.length > 0 ? (
            <Table>
              <TableHeader className="bg-zinc-900 border-b border-zinc-800">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[120px]">Time</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">Repository / PR</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[140px]">Decision</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 hidden md:table-cell">Reasoning</TableHead>
                  <TableHead className="text-right text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[90px]">Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                    <TableCell className="font-mono text-zinc-500 text-xs">
                      {formatDistanceToNow(log.created_at, { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-white tracking-tight truncate max-w-[220px]">{log.repo_name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-1 truncate">PR #{log.github_pr_id} // {log.pr_title}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`rounded-none font-mono text-[9px] uppercase tracking-wider border
                          ${log.decision_type === 'block_merge' ? 'border-red-500/50 text-red-400 bg-red-950/20' : ''}
                          ${log.decision_type === 'auto_approve' ? 'border-green-500/50 text-green-400 bg-green-950/20' : ''}
                          ${log.decision_type === 'route_reviewer' ? 'border-amber-500/50 text-amber-400 bg-amber-950/20' : ''}
                          ${log.decision_type === 'remediate_code' ? 'border-blue-500/50 text-blue-400 bg-blue-950/20' : ''}
                        `}
                      >
                        {log.decision_type.replace('_', ' ')}
                      </Badge>
                      {log.overridden_by_name && (
                        <div className="text-[9px] font-mono text-zinc-500 mt-1">
                          by {log.overridden_by_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[300px] truncate text-xs text-zinc-400 font-serif italic" title={log.reasoning}>
                      "{log.reasoning}"
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(log)}
                        disabled={!log.full_review}
                        className="h-8 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-300 hover:text-black hover:bg-white rounded-none transition-all disabled:opacity-30"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <Clock className="w-10 h-10 mb-4 stroke-1" />
              <p className="font-mono text-sm uppercase tracking-wider text-center">No history logs recorded</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
