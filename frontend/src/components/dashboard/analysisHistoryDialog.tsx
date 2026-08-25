'use client'

import { useState, useMemo, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  FileCode2,
  UserCircle2,
  Clock,
  History,
  Copy,
  Check,
  Filter,
  GitCommit,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { useHistoryStore } from '~/store'

export type AnalysisHistoryRecord = {
  _id: string
  pr_id: string
  repo_name: string
  github_pr_id: string
  pr_title: string
  pr_author?: string
  current_pr_status?: string
  decision_type: 'block_merge' | 'route_reviewer' | 'remediate_code' | 'auto_approve'
  reasoning: string
  risk_score?: number
  status?: string
  snapshot_review?: any
  overridden_by?: string
  overridden_by_name?: string
  created_at: number
}

type AnalysisHistoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: AnalysisHistoryRecord | null
  allPrHistory?: Array<AnalysisHistoryRecord>
}

const SEVERITY_STYLES: Record<string, { badge: string; icon: any }> = {
  critical: { badge: 'border-red-900 bg-red-950/50 text-red-400', icon: ShieldAlert },
  high: { badge: 'border-orange-900 bg-orange-950/50 text-orange-400', icon: AlertCircle },
  medium: { badge: 'border-amber-900 bg-amber-950/50 text-amber-400', icon: AlertTriangle },
  low: { badge: 'border-zinc-800 bg-zinc-900/50 text-zinc-400', icon: AlertCircle },
}

const DECISION_STYLES: Record<string, { badge: string; label: string }> = {
  auto_approve: { badge: 'border-green-500/50 text-green-400 bg-green-950/20', label: 'Auto Approved' },
  block_merge: { badge: 'border-red-500/50 text-red-400 bg-red-950/20', label: 'Blocked' },
  route_reviewer: { badge: 'border-amber-500/50 text-amber-400 bg-amber-950/20', label: 'Reviewers Routed' },
  remediate_code: { badge: 'border-blue-500/50 text-blue-400 bg-blue-950/20', label: 'Code Remediated' },
}

function getRiskColor(score: number | null | undefined) {
  if (score == null) return 'text-zinc-500'
  if (score <= 25) return 'text-emerald-400'
  if (score <= 75) return 'text-amber-400'
  return 'text-red-400'
}

export function AnalysisHistoryDialog({
  open,
  onOpenChange,
  record,
  allPrHistory = [],
}: AnalysisHistoryDialogProps) {
  const selectedRecordId = useHistoryStore((state) => state.selectedRecordId)
  const setSelectedRecordId = useHistoryStore((state) => state.setSelectedRecordId)
  const severityFilter = useHistoryStore((state) => state.severityFilter)
  const setSeverityFilter = useHistoryStore((state) => state.setSeverityFilter)
  const [copied, setCopied] = useState(false)

  // Reset selected snapshot when record changes or dialog opens
  useEffect(() => {
    if (record?._id) {
      setSelectedRecordId(record._id)
      setSeverityFilter('all')
    }
  }, [record?._id, open, setSelectedRecordId, setSeverityFilter])

  // Filter and sort all history records belonging to the same PR (oldest to newest for the timeline)
  const prTimeline = useMemo(() => {
    if (!record) return []
    const matching = allPrHistory.filter(
      (h) =>
        (h.pr_id && record.pr_id && h.pr_id === record.pr_id) ||
        (h.repo_name === record.repo_name && String(h.github_pr_id) === String(record.github_pr_id)),
    )
    if (matching.length === 0) return [record]
    return [...matching].sort((a, b) => a.created_at - b.created_at)
  }, [record, allPrHistory])

  // Current active snapshot record
  const currentRecord = useMemo(() => {
    if (!record) return null
    if (selectedRecordId) {
      const found = prTimeline.find((r) => r._id === selectedRecordId)
      if (found) return found
    }
    return record
  }, [record, selectedRecordId, prTimeline])

  // Robust parsing of snapshotReview (handle string or object)
  const snapshotReview = useMemo(() => {
    const raw = currentRecord?.snapshot_review
    if (!raw) return null
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw)
      } catch {
        return null
      }
    }
    return raw
  }, [currentRecord?.snapshot_review])

  // Robust extraction of findings
  const findings: Array<any> = useMemo(() => {
    const rawFindings = snapshotReview?.findings || (currentRecord as any)?.findings
    if (Array.isArray(rawFindings)) return rawFindings
    if (typeof rawFindings === 'string') {
      try {
        const parsed = JSON.parse(rawFindings)
        if (Array.isArray(parsed)) return parsed
      } catch {}
    }
    return []
  }, [snapshotReview, currentRecord])

  // Robust extraction of reviewer roles
  const reviewerRoles: Array<string> = useMemo(() => {
    const roles =
      snapshotReview?.reviewers ||
      snapshotReview?.reviewer_roles ||
      (currentRecord as any)?.reviewers
    if (Array.isArray(roles)) return roles
    return []
  }, [snapshotReview, currentRecord])

  // Robust extraction of risk score
  const riskScore = useMemo(() => {
    if (currentRecord?.risk_score != null) return currentRecord.risk_score
    if (snapshotReview?.risk_score != null) return snapshotReview.risk_score
    return 0
  }, [currentRecord, snapshotReview])

  // Robust extraction of summary reasoning
  const summaryReasoning = useMemo(() => {
    return (
      currentRecord?.reasoning ||
      snapshotReview?.ai_summary ||
      snapshotReview?.summary ||
      snapshotReview?.reasoning ||
      (currentRecord as any)?.ai_summary ||
      'No detailed reasoning recorded for this snapshot.'
    )
  }, [currentRecord, snapshotReview])

  const filteredFindings = useMemo(() => {
    if (severityFilter === 'all') return findings
    return findings.filter((f) => String(f.severity || '').toLowerCase() === severityFilter)
  }, [findings, severityFilter])

  const handleCopySummary = () => {
    if (!currentRecord) return
    const textToCopy = `MergeMaster AI History Snapshot - PR #${currentRecord.github_pr_id} (${currentRecord.repo_name})
Decision: ${currentRecord.decision_type}
Risk Score: ${riskScore}/100
Timestamp: ${format(new Date(currentRecord.created_at), 'yyyy-MM-dd HH:mm:ss')}
Reasoning: ${summaryReasoning}
Findings: ${findings.length} flagged`
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!record || !currentRecord) return null

  const activeIndex = prTimeline.findIndex((r) => r._id === currentRecord._id)
  const decisionStyle = DECISION_STYLES[currentRecord.decision_type] || DECISION_STYLES.route_reviewer

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:w-[92vw] md:w-[88vw] lg:w-[84vw] xl:w-[80vw] 2xl:w-[74vw] sm:max-w-none md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[94vh] sm:max-h-[90vh] bg-zinc-950 border border-zinc-800 text-zinc-50 p-0 rounded-none shadow-2xl flex flex-col overflow-hidden font-sans">
        {/* MODAL HEADER */}
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
                  <span className="truncate">{currentRecord.pr_title || 'Pull Request'}</span>
                </DialogTitle>
                <DialogDescription className="font-mono text-xs text-zinc-400 flex items-center gap-2">
                  <Clock size={12} className="shrink-0 text-zinc-400" />
                  <span>
                    Recorded {format(new Date(currentRecord.created_at), 'PPP pp')} (
                    {formatDistanceToNow(currentRecord.created_at, { addSuffix: true })})
                  </span>
                </DialogDescription>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySummary}
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
                    Viewing Iteration {activeIndex >= 0 ? activeIndex + 1 : 1} of {prTimeline.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {prTimeline.map((item, idx) => {
                    const isSelected = item._id === currentRecord._id
                    const itemDecision = DECISION_STYLES[item.decision_type] || DECISION_STYLES.route_reviewer
                    const itemScore = item.risk_score ?? item.snapshot_review?.risk_score ?? 0

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
                        <span className="text-[10px] text-zinc-400 font-bold">#{idx + 1}</span>
                        <span className="text-[11px] font-medium">{itemDecision.label}</span>
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
                          <ArrowRight size={10} className="text-zinc-700 ml-1 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </DialogHeader>
        </div>

        {/* MODAL BODY (Scrollable with min-h-0) */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto min-h-0 space-y-6 flex-1 bg-zinc-950">
          {/* STATS & DECISION CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 border border-zinc-800 bg-black/60 space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                Decision at this Snapshot
              </span>
              <div className="pt-1">
                <Badge variant="outline" className={`font-mono text-xs uppercase tracking-wider ${decisionStyle.badge} rounded-none`}>
                  {decisionStyle.label}
                </Badge>
              </div>
            </div>

            <div className="p-4 border border-zinc-800 bg-black/60 space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                Risk Score at Snapshot
              </span>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className={`text-2xl font-black font-mono tracking-tight ${getRiskColor(riskScore)}`}>
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
                  {findings.length}
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

          {/* DETAILED FINDINGS AT THIS STATE */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                  Point-in-Time Findings & Violations
                </p>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Showing {filteredFindings.length} of {findings.length} findings in this snapshot
                </p>
              </div>

              {findings.length > 0 && (
                <div className="flex items-center gap-1 bg-black/50 p-1 border border-zinc-900 overflow-x-auto">
                  <span className="text-[10px] font-mono text-zinc-400 px-1 flex items-center gap-1">
                    <Filter size={10} />
                  </span>
                  {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => {
                    const count = sev === 'all'
                      ? findings.length
                      : findings.filter((f) => String(f.severity || '').toLowerCase() === sev).length
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
                  })}
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
                              <span className="truncate font-mono text-[10px]" title={finding.file}>
                                {finding.file}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                          {finding.detail || finding.message || 'No detail provided.'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* AUDIT METADATA FOOTER */}
          {currentRecord.overridden_by_name && (
            <div className="p-3 border border-amber-900/40 bg-amber-950/10 text-amber-400 font-mono text-xs flex items-center justify-between">
              <span>Decision overridden by human supervisor:</span>
              <span className="font-bold">{currentRecord.overridden_by_name}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
