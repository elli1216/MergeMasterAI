import { useState } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileCode2,
  UserCircle2,
  Filter,
} from 'lucide-react'
import type { AiReview } from '~/lib/backend'
import { Badge } from '~/components/ui/badge'
import {
  SEVERITY_STYLES,
  STATUS_STYLES,
  getRiskColor,
} from './types'

type ReviewReportTabProps = {
  review: AiReview | null
  error: string | null
}

export function ReviewReportTab({ review, error }: ReviewReportTabProps) {
  const [severityFilter, setSeverityFilter] = useState<
    'all' | 'critical' | 'high' | 'medium' | 'low'
  >('all')

  if (error) {
    return (
      <div className="space-y-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-500/50" />
        <div>
          <p className="font-mono text-sm uppercase tracking-widest text-red-400">
            Review Failed
          </p>
          <p className="font-sans text-xs text-zinc-500 mt-2 max-w-md mx-auto">
            {error}
          </p>
        </div>
      </div>
    )
  }

  if (!review) {
    return (
      <p className="py-16 text-center font-mono text-xs text-zinc-600">
        No review data available.
      </p>
    )
  }

  if (review.error) {
    return (
      <div className="border border-red-900/50 bg-red-950/20 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-3" />
        <p className="font-mono text-sm text-red-400">{review.error}</p>
        <p className="mt-2 font-sans text-xs text-zinc-500">
          Ensure the backend can reach GitHub for this repository (App installed
          or valid tokens provided).
        </p>
      </div>
    )
  }

  const findings = review.findings || []
  const filteredFindings =
    severityFilter === 'all'
      ? findings
      : findings.filter(
          (f) => (f.severity || '').toLowerCase() === severityFilter,
        )

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-5 border border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
            Risk Score
          </p>
          <div
            className={`font-mono text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter ${getRiskColor(review.risk_score)}`}
          >
            {review.risk_score ?? '--'}
            <span className="text-xl lg:text-2xl text-zinc-600">%</span>
          </div>
        </div>

        <div className="p-5 border border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
            Gate Status
          </p>
          <Badge
            variant="outline"
            className={`px-3 py-1 font-mono text-xs uppercase tracking-widest rounded-none ${
              STATUS_STYLES[review.status ?? ''] ??
              'border-zinc-800 text-zinc-600'
            }`}
          >
            {review.status ?? 'unknown'}
          </Badge>
          {review.decision && (
            <p className="mt-2 text-[10px] font-mono text-zinc-500">
              Decision:{' '}
              <span className="text-zinc-300 uppercase">{review.decision}</span>
            </p>
          )}
        </div>

        <div className="p-5 border border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
            Reviewer Routing
          </p>
          {review.reviewers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {review.reviewers.map((r) => (
                <div
                  key={r}
                  className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-300 font-mono"
                >
                  <UserCircle2 size={11} className="text-zinc-500" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-600 font-mono italic">
              No human review required
            </p>
          )}
        </div>
      </div>

      {/* AI Summary */}
      {review.ai_summary && (
        <div className="border-l-2 border-zinc-700 bg-black/40 p-4 sm:p-5">
          <p className="font-sans text-xs sm:text-sm md:text-base leading-relaxed text-zinc-300">
            {review.ai_summary}
          </p>
        </div>
      )}

      {/* Remediation Note if present */}
      {review.remediation_note && (
        <div className="flex gap-3 p-4 border border-amber-900/50 bg-amber-950/20">
          <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-amber-400 mb-1">
              Autonomous Remediation Pushed
            </p>
            <p className="font-sans text-xs sm:text-sm text-amber-200/90 leading-relaxed">
              {review.remediation_note}
            </p>
          </div>
        </div>
      )}

      {/* Findings Section - with Interactive Severity Filtering */}
      <div className="space-y-4 pt-4 border-t border-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Detailed Findings & Violations
            </p>
            <p className="text-[11px] text-zinc-600 font-mono">
              Showing {filteredFindings.length} of {findings.length} findings
            </p>
          </div>

          {/* Severity Filter Pills */}
          {findings.length > 0 && (
            <div className="flex items-center gap-1 bg-black/50 p-1 border border-zinc-900 overflow-x-auto">
              <span className="text-[10px] font-mono text-zinc-600 px-1 flex items-center gap-1">
                <Filter size={10} />
              </span>
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map(
                (sev) => {
                  const count =
                    sev === 'all'
                      ? findings.length
                      : findings.filter((f) => f.severity.toLowerCase() === sev)
                          .length
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
          <div className="text-center py-12 border border-dashed border-zinc-800 bg-zinc-950/50">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400/60 mb-2" />
            <p className="font-mono text-xs text-zinc-400">
              Clean code! Zero vulnerabilities or blockers detected.
            </p>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="text-center py-8 border border-zinc-900 bg-zinc-950/30">
            <p className="font-mono text-xs text-zinc-500">
              No findings with severity "{severityFilter}".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredFindings.map((finding, i) => {
              const style =
                SEVERITY_STYLES[finding.severity.toLowerCase()] ||
                SEVERITY_STYLES.low
              const Icon = style.icon
              return (
                <div
                  key={`${finding.file}-${i}`}
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
                          {finding.severity}
                        </Badge>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                          {finding.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/60 border border-zinc-900 text-zinc-400 max-w-full sm:max-w-60">
                        <FileCode2 size={11} className="shrink-0" />
                        <span
                          className="truncate font-mono text-[10px]"
                          title={finding.file}
                        >
                          {finding.file}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                      {finding.detail}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
