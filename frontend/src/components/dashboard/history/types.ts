import {
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react'

export type AnalysisHistoryRecord = {
  _id: string
  pr_id: string
  repo_name: string
  github_pr_id: string
  pr_title: string
  pr_author?: string
  current_pr_status?: string
  decision_type:
    | 'block_merge'
    | 'route_reviewer'
    | 'remediate_code'
    | 'auto_approve'
  reasoning: string
  risk_score?: number
  status?: string
  snapshot_review?: any
  overridden_by?: string
  overridden_by_name?: string
  created_at: number
}

export const SEVERITY_STYLES: Record<string, { badge: string; icon: any }> = {
  critical: {
    badge: 'border-red-900 bg-red-950/50 text-red-400',
    icon: ShieldAlert,
  },
  high: {
    badge: 'border-orange-900 bg-orange-950/50 text-orange-400',
    icon: AlertCircle,
  },
  medium: {
    badge: 'border-amber-900 bg-amber-950/50 text-amber-400',
    icon: AlertTriangle,
  },
  low: {
    badge: 'border-zinc-800 bg-zinc-900/50 text-zinc-400',
    icon: AlertCircle,
  },
}

export const DECISION_STYLES: Record<string, { badge: string; label: string }> = {
  auto_approve: {
    badge: 'border-green-500/50 text-green-400 bg-green-950/20',
    label: 'Auto Approved',
  },
  block_merge: {
    badge: 'border-red-500/50 text-red-400 bg-red-950/20',
    label: 'Blocked',
  },
  route_reviewer: {
    badge: 'border-amber-500/50 text-amber-400 bg-amber-950/20',
    label: 'Reviewers Routed',
  },
  remediate_code: {
    badge: 'border-blue-500/50 text-blue-400 bg-blue-950/20',
    label: 'Code Remediated',
  },
}

export function getRiskColor(score: number | null | undefined) {
  if (score == null) return 'text-zinc-500'
  if (score <= 25) return 'text-emerald-400'
  if (score <= 75) return 'text-amber-400'
  return 'text-red-400'
}
