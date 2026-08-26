import { formatDistanceToNow, format } from 'date-fns'
import {
  History,
  Clock,
  Copy,
  Check,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import type { AnalysisHistoryRecord } from './types'
import { DECISION_STYLES } from './types'

type HistoryHeaderProps = {
  currentRecord: AnalysisHistoryRecord
  prTimeline: Array<AnalysisHistoryRecord>
  setSelectedRecordId: (id: string) => void
  onCopySummary: () => void
  copied: boolean
}

export function HistoryHeader({
  currentRecord,
  prTimeline,
  setSelectedRecordId,
  onCopySummary,
  copied,
}: HistoryHeaderProps) {
  const activeIndex = prTimeline.findIndex((r) => r._id === currentRecord._id)

  return (
    <div className="border-b border-zinc-800 p-4 sm:p-6 shrink-0 bg-black/50">
      <DialogHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <History size={11} className="text-zinc-400" />
                Historical Audit Snapshot
              </span>
              <span className="font-mono text-xs text-zinc-400 truncate max-w-[200px] sm:max-w-[300px]">
                {currentRecord.repo_name}
              </span>
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>PR #{currentRecord.github_pr_id}:</span>
              <span className="truncate">
                {currentRecord.pr_title || 'Pull Request'}
              </span>
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-zinc-400 flex items-center gap-2">
              <Clock size={12} className="shrink-0 text-zinc-400" />
              <span>
                Recorded{' '}
                {format(new Date(currentRecord.created_at), 'PPP pp')} (
                {formatDistanceToNow(currentRecord.created_at, {
                  addSuffix: true,
                })}
                )
              </span>
            </DialogDescription>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onCopySummary}
              className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white rounded-none font-mono text-xs uppercase h-8 px-3"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-emerald-400 mr-1.5" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} className="mr-1.5" />
                  <span>Copy Record</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* PR STATE ITERATION TIMELINE */}
        {prTimeline.length > 1 && (
          <div className="mt-3 pt-3 border-t border-zinc-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Layers size={11} className="text-zinc-400" />
                PR State Evolution Timeline ({prTimeline.length} Iterations Logged)
              </span>
              <span className="font-mono text-[10px] text-zinc-400">
                Viewing Iteration {activeIndex >= 0 ? activeIndex + 1 : 1} of{' '}
                {prTimeline.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {prTimeline.map((item, idx) => {
                const isSelected = item._id === currentRecord._id
                const itemDecision =
                  DECISION_STYLES[item.decision_type] ||
                  DECISION_STYLES.route_reviewer
                const itemScore =
                  item.risk_score ?? item.snapshot_review?.risk_score ?? 0

                return (
                  <button
                    key={item._id}
                    onClick={() => setSelectedRecordId(item._id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 border font-mono text-xs transition-all shrink-0 rounded-none text-left ${
                      isSelected
                        ? 'bg-zinc-800 border-zinc-400 text-white shadow-sm ring-1 ring-zinc-400'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-[10px] text-zinc-400 font-bold">
                      #{idx + 1}
                    </span>
                    <span className="text-[11px] font-medium">
                      {itemDecision.label}
                    </span>
                    <span
                      className={`text-[10px] px-1 py-0.2 border ${
                        itemScore <= 25
                          ? 'border-emerald-800 text-emerald-400 bg-emerald-950/40'
                          : itemScore <= 75
                            ? 'border-amber-800 text-amber-400 bg-amber-950/40'
                            : 'border-red-800 text-red-400 bg-red-950/40'
                      }`}
                    >
                      Risk {itemScore}
                    </span>
                    {idx < prTimeline.length - 1 && (
                      <ArrowRight
                        size={10}
                        className="text-zinc-700 ml-1 shrink-0"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </DialogHeader>
    </div>
  )
}
