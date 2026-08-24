import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

type AnalyzeHistoryPanelProps = {
  logs: Array<any>
  onView: (log: any) => void
}

export function AnalyzeHistoryPanel({ logs, onView }: AnalyzeHistoryPanelProps) {
  return (
    <div className="space-y-4 mt-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider">Analysis History</h2>
          <p className="text-zinc-500 font-mono text-xs md:text-sm">Audit log of all AI automated decisions</p>
        </div>
      </div>

      <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none overflow-x-auto">
        <CardContent className="p-0 min-w-150">
          {logs.length > 0 ? (
            <Table>
              <TableHeader className="bg-zinc-900 border-b border-zinc-800">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[120px]">Time</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">Repository / PR</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">Action</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 hidden md:table-cell">Reasoning</TableHead>
                  <TableHead className="text-right text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                    <TableCell className="font-mono text-zinc-500 text-xs">
                      {formatDistanceToNow(log.created_at, { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-white tracking-tight truncate max-w-[200px]">{log.repo_name}</div>
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
                        className="h-7 px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-300 hover:text-black hover:bg-white rounded-none transition-all disabled:opacity-30"
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
              <p className="font-mono text-sm uppercase tracking-wider text-center">No history logs recorded</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
