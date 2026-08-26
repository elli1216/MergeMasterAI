import { Filter, CheckCircle2, FileCode2 } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { SEVERITY_STYLES } from './types'

type HistoryFindingsListProps = {
  findings: Array<any>
  filteredFindings: Array<any>
  severityFilter: string
  setSeverityFilter: (filter: 'all' | 'critical' | 'high' | 'medium' | 'low') => void
}

export function HistoryFindingsList({
  findings,
  filteredFindings,
  severityFilter,
  setSeverityFilter,
}: HistoryFindingsListProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Point-in-Time Findings & Violations
          </p>
          <p className="text-[11px] text-zinc-400 font-mono">
            Showing {filteredFindings.length} of {findings.length} findings in
            this snapshot
          </p>
        </div>

        {findings.length > 0 && (
          <div className="flex items-center gap-1 bg-black/50 p-1 border border-zinc-900 overflow-x-auto">
            <span className="text-[10px] font-mono text-zinc-400 px-1 flex items-center gap-1">
              <Filter size={10} />
            </span>
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map(
              (sev) => {
                const count =
                  sev === 'all'
                    ? findings.length
                    : findings.filter(
                        (f) => String(f.severity || '').toLowerCase() === sev,
                      ).length
                if (sev !== 'all' && count === 0) return null
                return (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2 py-0.5 font-mono text-[10px] uppercase transition-colors rounded-none ${
                      severityFilter === sev
                        ? 'bg-zinc-200 text-black font-bold'
                        : 'text-zinc-400 hover:text-white bg-zinc-900/60'
                    }`}
                  >
                    {sev} {count > 0 && `(${count})`}
                  </button>
                )
              },
            )}
          </div>
        )}
      </div>

      {findings.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-zinc-800 bg-zinc-950/50">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400/60 mb-2" />
          <p className="font-mono text-xs text-zinc-400">
            Zero violations were recorded during this state snapshot.
          </p>
        </div>
      ) : filteredFindings.length === 0 ? (
        <div className="text-center py-6 border border-zinc-900 bg-zinc-950/30">
          <p className="font-mono text-xs text-zinc-400">
            No findings matching severity "{severityFilter}".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredFindings.map((finding, i) => {
            const sevKey = String(finding.severity || 'low').toLowerCase()
            const style = SEVERITY_STYLES[sevKey] || SEVERITY_STYLES.low
            const Icon = style.icon

            return (
              <div
                key={`${finding.file || 'unknown'}-${i}`}
                className="border border-zinc-800/80 bg-zinc-900/30 p-4 space-y-2.5 hover:border-zinc-700 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`font-mono text-[9px] uppercase tracking-wider ${style.badge} rounded-none`}
                      >
                        <Icon className="w-3 h-3 mr-1 inline" />
                        {finding.severity || 'LOW'}
                      </Badge>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                        {finding.category || 'Quality'}
                      </span>
                    </div>
                    {finding.file && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/60 border border-zinc-900 text-zinc-400 max-w-full sm:max-w-[220px]">
                        <FileCode2 size={11} className="shrink-0" />
                        <span
                          className="truncate font-mono text-[10px]"
                          title={finding.file}
                        >
                          {finding.file}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                    {finding.detail ||
                      finding.message ||
                      'No detail provided.'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
