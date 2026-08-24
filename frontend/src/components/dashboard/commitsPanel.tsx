import { RefreshCw, ExternalLink, GitCommit } from 'lucide-react'
import type { Doc } from '../../../convex/_generated/dataModel'
import { Card, CardContent } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'

type CommitsPanelProps = {
  commits: Array<Doc<'commits'>>
}

export function CommitsPanel({ commits }: CommitsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Recent Commits</span>
            <span className="text-xs font-mono px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-normal">
              {commits.length} Indexed
            </span>
          </h2>
          <p className="text-zinc-500 font-mono text-xs md:text-sm">Latest activity across monitored repositories</p>
        </div>
      </div>

      {/* Mobile Card List (sm:hidden) */}
      <div className="sm:hidden space-y-2">
        {commits.length > 0 ? (
          commits.map((c) => (
            <div key={c._id} className="bg-zinc-950 border border-zinc-800 p-3 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <a
                  href={`https://github.com/${c.repo_name}/commit/${c.sha}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-300 font-bold hover:underline flex items-center gap-1"
                >
                  <GitCommit size={12} className="text-zinc-500" />
                  <span>{c.sha.slice(0, 7)}</span>
                  <ExternalLink size={10} className="text-zinc-500" />
                </a>
                <span className="text-[10px] text-zinc-500">{c.repo_name}</span>
              </div>
              <p className="text-white text-xs tracking-tight line-clamp-2">{c.message.split('\n')[0]}</p>
              <div className="text-[10px] text-zinc-500">by {c.author}</div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-600 bg-zinc-950 border border-zinc-900">
            <RefreshCw className="w-8 h-8 mb-3 stroke-1" />
            <p className="font-mono text-xs uppercase tracking-wider text-center">No commits synced yet</p>
          </div>
        )}
      </div>

      {/* Desktop Table (hidden sm:block) */}
      <Card className="hidden sm:block bg-zinc-950 border-zinc-800 rounded-none shadow-none overflow-x-auto">
        <CardContent className="p-0 min-w-[550px]">
          {commits.length > 0 ? (
            <Table>
              <TableHeader className="bg-zinc-900 border-b border-zinc-800">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[110px]">SHA</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">Message</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 hidden md:table-cell w-[160px]">Author</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 hidden lg:table-cell w-[200px]">Repository</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commits.map((c) => (
                  <TableRow key={c._id} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                    <TableCell className="font-mono text-zinc-400 text-xs">
                      <a
                        href={`https://github.com/${c.repo_name}/commit/${c.sha}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 hover:text-white hover:underline transition-colors group"
                        title={`View commit ${c.sha} on GitHub`}
                      >
                        <span className="bg-zinc-900 px-1.5 py-0.5 border border-zinc-800 group-hover:border-zinc-600">
                          {c.sha.slice(0, 7)}
                        </span>
                        <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white tracking-tight truncate max-w-[320px]">{c.message.split('\n')[0]}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs font-mono text-zinc-400">{c.author}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs font-mono text-zinc-500">{c.repo_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <RefreshCw className="w-10 h-10 mb-4 stroke-1" />
              <p className="font-mono text-sm uppercase tracking-wider text-center">No commits synced yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}