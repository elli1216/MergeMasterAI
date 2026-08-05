import { RefreshCw } from 'lucide-react'
import type { Doc } from '../../../convex/_generated/dataModel'
import { Card, CardContent } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'

type CommitsPanelProps = {
  commits: Array<Doc<'commits'>>
}

export function CommitsPanel({ commits }: CommitsPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider">Recent Commits</h2>
        <p className="text-zinc-500 font-mono text-xs md:text-sm">Latest activity across monitored repos</p>
      </div>

      <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none overflow-x-auto">
        <CardContent className="p-0 min-w-150">
          {commits.length > 0 ? (
            <Table>
              <TableHeader className="bg-zinc-900 border-b border-zinc-800">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[110px]">SHA</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">Message</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 hidden md:table-cell">Author</TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 hidden lg:table-cell">Repo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commits.map((c) => (
                  <TableRow key={c._id} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                    <TableCell className="font-mono text-zinc-500 text-xs">{c.sha.slice(0, 7)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-white tracking-tight truncate max-w-[300px]">{c.message.split('\n')[0]}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs font-mono text-zinc-400">{c.author}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs font-mono text-zinc-500">{c.repo_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <RefreshCw className="w-12 h-12 mb-6 stroke-1" />
              <p className="font-mono text-sm uppercase tracking-wider text-center">No commits synced yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}