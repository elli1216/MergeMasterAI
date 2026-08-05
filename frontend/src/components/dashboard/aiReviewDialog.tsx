'use client'

import type { AiReview } from '~/lib/backend'
import { Badge } from '~/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'border-white text-black bg-white',
  high: 'border-red-500 text-red-400',
  medium: 'border-amber-500 text-amber-400',
  low: 'border-zinc-600 text-zinc-400',
}

const STATUS_STYLES: Record<string, string> = {
  blocked: 'border-white text-black bg-white',
  approved: 'border-zinc-500 text-zinc-300 bg-transparent',
  pending: 'border-zinc-700 text-zinc-500 bg-transparent border-dashed',
  merged: 'border-zinc-500 text-zinc-300 bg-transparent',
  closed: 'border-zinc-800 text-zinc-600 bg-transparent',
}

function severityStyle(severity: string): string {
  return SEVERITY_STYLES[severity] ?? 'border-zinc-600 text-zinc-400'
}

export type ReviewTarget = { repoName: string; prNumber: number; title: string }

type AiReviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: ReviewTarget | null
  review: AiReview | null
  loading: boolean
  error: string | null
}

export function AiReviewDialog({
  open,
  onOpenChange,
  target,
  review,
  loading,
  error,
}: AiReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 text-zinc-50 ring-zinc-800">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm font-bold uppercase tracking-widest">
            AI Review
          </DialogTitle>
          <DialogDescription className="truncate font-serif italic text-zinc-500">
            {target
              ? `#${target.prNumber} ${target.title} // ${target.repoName}`
              : 'Pull request review'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="h-8 w-8 animate-spin border border-zinc-700 border-t-white" />
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
              Analyzing pull request...
            </p>
          </div>
        ) : error ? (
          <div className="space-y-2 py-8">
            <p className="font-mono text-xs uppercase tracking-widest text-red-400">
              Review failed
            </p>
            <p className="font-mono text-xs whitespace-pre-wrap text-zinc-400">{error}</p>
          </div>
        ) : review ? (
          review.error ? (
            <div className="border border-zinc-800 p-4">
              <p className="font-mono text-xs text-red-400">{review.error}</p>
              <p className="mt-2 font-mono text-[10px] text-zinc-600">
                Make sure the backend can reach GitHub for this repo (GitHub App installed,
                or signed in with repo access).
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-5xl font-bold">
                    {review.risk_score ?? '--'}
                    <span className="text-xl text-zinc-500">%</span>
                  </span>
                  <div className="space-y-2">
                    <Badge
                      variant="outline"
                      className={`rounded-none font-mono text-[10px] uppercase tracking-wider border ${
                        STATUS_STYLES[review.status ?? ''] ??
                        'border-zinc-800 text-zinc-600 bg-transparent'
                      }`}
                    >
                      {review.status ?? 'unknown'}
                    </Badge>
                    {review.decision && (
                      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                        decision: {review.decision}
                      </p>
                    )}
                  </div>
                </div>
                {review.reviewers.length > 0 && (
                  <div className="text-right">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                      Routed to
                    </p>
                    <p className="font-mono text-xs text-zinc-300">
                      {review.reviewers.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {review.ai_summary && (
                <p className="font-serif text-sm italic text-zinc-400">"{review.ai_summary}"</p>
              )}

              {review.remediation_note && (
                <div className="border border-amber-500/40 p-3">
                  <p className="font-mono text-xs text-amber-400">{review.remediation_note}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Findings ({review.findings.length})
                </p>
                {review.findings.length === 0 ? (
                  <p className="font-mono text-xs text-zinc-600">No findings flagged.</p>
                ) : (
                  review.findings.map((finding, i) => (
                    <div key={`${finding.file}-${i}`} className="border border-zinc-800 p-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`rounded-none text-[9px] border ${severityStyle(
                            finding.severity
                          )}`}
                        >
                          {finding.severity}
                        </Badge>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                          {finding.category}
                        </span>
                        <span className="ml-auto max-w-[40%] truncate font-mono text-[10px] text-zinc-600">
                          {finding.file}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-zinc-300">{finding.detail}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        ) : (
          <p className="py-8 font-mono text-xs text-zinc-600">No review available.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}