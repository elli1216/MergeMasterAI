import { Shield, GitCommit, UserCircle2 } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import type { AnalysisHistoryRecord } from './types'
import { DECISION_STYLES, getRiskColor } from './types'

type HistorySnapshotStatsProps = {
  currentRecord: AnalysisHistoryRecord
  riskScore: number
  findingsCount: number
  summaryReasoning: string
  snapshotReview?: any
  reviewerRoles?: Array<string>
}

export function HistorySnapshotStats({
  currentRecord,
  riskScore,
  findingsCount,
  summaryReasoning,
  snapshotReview,
  reviewerRoles = [],
}: HistorySnapshotStatsProps) {
  const decisionStyle =
    DECISION_STYLES[currentRecord.decision_type] ||
    DECISION_STYLES.route_reviewer

  return (
    <div className="space-y-6">
      {/* STATS & DECISION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 border border-zinc-800 bg-black/60 space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Decision at this Snapshot
          </span>
          <div className="pt-1">
            <Badge
              variant="outline"
              className={`font-mono text-xs uppercase tracking-wider ${decisionStyle.badge} rounded-none`}
            >
              {decisionStyle.label}
            </Badge>
          </div>
        </div>

        <div className="p-4 border border-zinc-800 bg-black/60 space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Risk Score at Snapshot
          </span>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span
              className={`text-2xl font-black font-mono tracking-tight ${getRiskColor(riskScore)}`}
            >
              {riskScore}
            </span>
            <span className="text-zinc-600 font-mono text-xs">/ 100</span>
          </div>
        </div>

        <div className="p-4 border border-zinc-800 bg-black/60 space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Recorded Violations
          </span>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-2xl font-black font-mono tracking-tight text-white">
              {findingsCount}
            </span>
            <span className="text-zinc-600 font-mono text-xs">issues</span>
          </div>
        </div>
      </div>

      {/* REASONING & SUMMARY */}
      <div className="border border-zinc-800 bg-black/40 p-4 sm:p-5 space-y-2">
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
          <Shield size={12} className="text-blue-400" />
          Recorded Analysis Reasoning & Summary
        </span>
        <p className="text-sm font-sans text-zinc-200 leading-relaxed whitespace-pre-wrap">
          {summaryReasoning}
        </p>
      </div>

      {/* CODE REMEDIATION DETAILS (If remediate_code) */}
      {snapshotReview?.remediation_note && (
        <div className="border border-blue-900/60 bg-blue-950/20 p-4 space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-blue-400 flex items-center gap-1.5 font-bold">
            <GitCommit size={13} />
            Automated Remediation Performed
          </span>
          <p className="text-xs sm:text-sm text-zinc-300 font-sans">
            {snapshotReview.remediation_note}
          </p>
          {snapshotReview.head_sha && (
            <div className="flex items-center gap-2 pt-1 font-mono text-xs text-zinc-400">
              <span className="text-zinc-400">Commit SHA:</span>
              <code className="bg-black px-2 py-0.5 border border-zinc-800 text-blue-300">
                {snapshotReview.head_sha.slice(0, 7)}
              </code>
            </div>
          )}
        </div>
      )}

      {/* REVIEWER ROUTING AT THIS STATE */}
      {reviewerRoles.length > 0 && (
        <div className="border border-zinc-800 bg-black/40 p-4 space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
            <UserCircle2 size={12} className="text-amber-400" />
            Reviewer Roles Routed During This Iteration
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {reviewerRoles.map((role, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="border-zinc-700 bg-zinc-900 text-zinc-300 font-mono text-[11px] rounded-none px-2.5 py-1"
              >
                {role}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
