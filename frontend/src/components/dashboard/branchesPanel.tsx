import { GitBranch, ShieldCheck } from 'lucide-react'
import type { Doc } from '../../../convex/_generated/dataModel'
import { Card, CardContent } from '~/components/ui/card'

type BranchesPanelProps = {
  branches: Array<Doc<'branches'>>
}

export function BranchesPanel({ branches }: BranchesPanelProps) {
  if (branches.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-zinc-500" />
            Branches
          </h2>
        </div>
        <div className="text-zinc-600 font-mono text-xs uppercase p-4 border border-zinc-800 border-dashed text-center">
          No branches synced yet
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-zinc-500" />
          Branches
        </h2>
        <p className="text-zinc-500 font-mono text-xs mt-1">Active repository branches</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b) => (
          <Card key={b._id} className="bg-zinc-950 border-zinc-800 rounded-none shadow-none">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="overflow-hidden">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-white truncate">{b.name}</div>
                  {b.is_protected && (
                    <ShieldCheck size={14} className="text-green-500 shrink-0" />
                  )}
                </div>
                <div className="text-xs text-zinc-500 font-mono truncate mt-1">
                  SHA: {b.last_commit_sha.substring(0, 7)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
