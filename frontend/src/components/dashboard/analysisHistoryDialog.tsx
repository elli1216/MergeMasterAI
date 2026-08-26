import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
} from '~/components/ui/dialog'
import { useHistoryStore } from '~/store'
import type { AnalysisHistoryRecord } from './history'
import {
  HistoryHeader,
  HistorySnapshotStats,
  HistoryFindingsList,
} from './history'

export type { AnalysisHistoryRecord } from './history'

type AnalysisHistoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: AnalysisHistoryRecord | null
  allPrHistory?: Array<AnalysisHistoryRecord>
}

export function AnalysisHistoryDialog({
  open,
  onOpenChange,
  record,
  allPrHistory = [],
}: AnalysisHistoryDialogProps) {
  const selectedRecordId = useHistoryStore((state) => state.selectedRecordId)
  const setSelectedRecordId = useHistoryStore(
    (state) => state.setSelectedRecordId,
  )
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

  // Filter and sort all history records belonging to the same PR (oldest to newest for timeline)
  const prTimeline = useMemo(() => {
    if (!record) return []
    const matching = allPrHistory.filter(
      (h) =>
        (h.pr_id && record.pr_id && h.pr_id === record.pr_id) ||
        (h.repo_name === record.repo_name &&
          String(h.github_pr_id) === String(record.github_pr_id)),
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
    const rawFindings =
      snapshotReview?.findings || (currentRecord as any)?.findings
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
    return findings.filter(
      (f) => String(f.severity || '').toLowerCase() === severityFilter,
    )
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:w-[92vw] md:w-[88vw] lg:w-[84vw] xl:w-[80vw] 2xl:w-[74vw] sm:max-w-none md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[94vh] sm:max-h-[90vh] bg-zinc-950 border border-zinc-800 text-zinc-50 p-0 rounded-none shadow-2xl flex flex-col overflow-hidden font-sans">
        {/* MODAL HEADER WITH TIMELINE */}
        <HistoryHeader
          currentRecord={currentRecord}
          prTimeline={prTimeline}
          setSelectedRecordId={setSelectedRecordId}
          onCopySummary={handleCopySummary}
          copied={copied}
        />

        {/* MODAL BODY (Scrollable with min-h-0) */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto min-h-0 space-y-6 flex-1 bg-zinc-950">
          {/* STATS, SUMMARY, REMEDIATION & ROUTING */}
          <HistorySnapshotStats
            currentRecord={currentRecord}
            riskScore={riskScore}
            findingsCount={findings.length}
            summaryReasoning={summaryReasoning}
            snapshotReview={snapshotReview}
            reviewerRoles={reviewerRoles}
          />

          {/* DETAILED FINDINGS AT THIS STATE */}
          <HistoryFindingsList
            findings={findings}
            filteredFindings={filteredFindings}
            severityFilter={severityFilter}
            setSeverityFilter={setSeverityFilter}
          />

          {/* AUDIT METADATA FOOTER */}
          {currentRecord.overridden_by_name && (
            <div className="p-3 border border-amber-900/40 bg-amber-950/10 text-amber-400 font-mono text-xs flex items-center justify-between">
              <span>Decision overridden by human supervisor:</span>
              <span className="font-bold">
                {currentRecord.overridden_by_name}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
