import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useAuth } from '@workos-inc/authkit-react'
import {
  Clock,
  ShieldAlert,
  Sparkles,
  GitPullRequest,
  CheckCircle2,
  TrendingDown,
  Bug,
  FolderGit2,
  Lock,
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

export const Route = createFileRoute('/_dashboard/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { user, isLoading } = useAuth()
  const { data: analytics } = useSuspenseQuery(convexQuery(api.pullRequests.getAnalyticsSummary, {}))

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-mono uppercase tracking-widest text-xs animate-pulse">Loading System...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p>Unauthorized. Please return to the homepage to log in.</p>
      </div>
    )
  }

  const {
    totalPRs,
    totalRepos,
    approvedCount,
    blockedCount,
    estimatedHoursSaved,
    avgRiskScore,
    autoApproveDecisions,
    remediationsDecisions,
    blockDecisions,
    routeDecisions,
    categoryCounts,
    severityCounts,
    riskDistribution,
    totalFindings,
  } = analytics

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-light tracking-tighter text-white">Analytics & ROI Dashboard</h2>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
          Autonomous gatekeeper metrics, developer hours saved & vulnerability telemetry
        </p>
      </div>

      {/* Top 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hours Saved */}
        <Card className="bg-zinc-950 border-zinc-800 rounded-none p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Hours Saved</p>
            <Clock className="w-4 h-4 text-green-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-mono text-4xl font-light text-white">{estimatedHoursSaved}</span>
            <span className="text-xs font-mono text-zinc-500">hrs</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-2">
            ~{autoApproveDecisions} auto-approvals + {remediationsDecisions} remediations
          </p>
        </Card>

        {/* Total Reviews */}
        <Card className="bg-zinc-950 border-zinc-800 rounded-none p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Total PRs</p>
            <GitPullRequest className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-mono text-4xl font-light text-white">{totalPRs}</span>
            <span className="text-xs font-mono text-zinc-500">evaluated</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-2">
            {approvedCount} approved ({totalPRs > 0 ? Math.round((approvedCount / totalPRs) * 100) : 0}%)
          </p>
        </Card>

        {/* Avg Risk Score */}
        <Card className="bg-zinc-950 border-zinc-800 rounded-none p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Avg Risk Score</p>
            <TrendingDown className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`font-mono text-4xl font-light ${avgRiskScore > 50 ? 'text-red-400' : 'text-white'}`}>
              {avgRiskScore}
            </span>
            <span className="text-xs font-mono text-zinc-500">%</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-2">
            {blockedCount} blocked merge gates
          </p>
        </Card>

        {/* Codebases Monitored */}
        <Card className="bg-zinc-950 border-zinc-800 rounded-none p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Codebases</p>
            <FolderGit2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-mono text-4xl font-light text-white">{totalRepos}</span>
            <span className="text-xs font-mono text-zinc-500">active repos</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-2">
            Real-time webhook sync enabled
          </p>
        </Card>
      </div>

      {/* Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Decision Breakdown & Risk Distribution */}
        <div className="space-y-6">
          {/* Decision Breakdown */}
          <Card className="bg-zinc-950 border-zinc-800 rounded-none p-6">
            <h3 className="font-bold text-white uppercase font-sans text-sm tracking-wider flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-zinc-400" />
              AI Decision Distribution
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>Auto-Approved (Low Risk / Docs)</span>
                  <span>{autoApproveDecisions}</span>
                </div>
                <div className="w-full bg-zinc-900 h-2">
                  <div
                    className="bg-green-500 h-2 transition-all"
                    style={{ width: `${totalPRs > 0 ? (autoApproveDecisions / Math.max(totalPRs, 1)) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>Blocked Gate (High / Critical Risks)</span>
                  <span>{blockDecisions}</span>
                </div>
                <div className="w-full bg-zinc-900 h-2">
                  <div
                    className="bg-red-500 h-2 transition-all"
                    style={{ width: `${totalPRs > 0 ? (blockDecisions / Math.max(totalPRs, 1)) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>Autonomous Remediation Pushed</span>
                  <span>{remediationsDecisions}</span>
                </div>
                <div className="w-full bg-zinc-900 h-2">
                  <div
                    className="bg-blue-500 h-2 transition-all"
                    style={{ width: `${totalPRs > 0 ? (remediationsDecisions / Math.max(totalPRs, 1)) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                  <span>Routed for Human Review</span>
                  <span>{routeDecisions}</span>
                </div>
                <div className="w-full bg-zinc-900 h-2">
                  <div
                    className="bg-amber-500 h-2 transition-all"
                    style={{ width: `${totalPRs > 0 ? (routeDecisions / Math.max(totalPRs, 1)) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Risk Distribution Brackets */}
          <Card className="bg-zinc-950 border-zinc-800 rounded-none p-6">
            <h3 className="font-bold text-white uppercase font-sans text-sm tracking-wider flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4 text-zinc-400" />
              Risk Confidence Tiers
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {riskDistribution.map((tier: { range: string; count: number; color: string }) => (
                <div key={tier.range} className="p-4 bg-zinc-900/40 border border-zinc-800 text-center">
                  <p className="font-mono text-[10px] uppercase text-zinc-500 truncate">{tier.range}</p>
                  <p className="font-mono text-2xl font-bold text-white mt-2">{tier.count}</p>
                  <span className="text-[10px] font-mono text-zinc-600">PRs</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Findings Telemetry */}
        <div className="space-y-6">
          {/* Findings by Category */}
          <Card className="bg-zinc-950 border-zinc-800 rounded-none p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white uppercase font-sans text-sm tracking-wider flex items-center gap-2">
                <Bug className="w-4 h-4 text-zinc-400" />
                Vulnerabilities by Category
              </h3>
              <Badge variant="outline" className="font-mono text-[10px] bg-zinc-900 border-zinc-800 text-zinc-400">
                {totalFindings} total flagged
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-900/30 border border-zinc-800 flex items-center gap-3">
                <Lock className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <p className="text-xs font-mono text-zinc-500 uppercase">Security</p>
                  <p className="text-xl font-mono text-white font-bold">{categoryCounts.security || 0}</p>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/30 border border-zinc-800 flex items-center gap-3">
                <Bug className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-mono text-zinc-500 uppercase">Bugs</p>
                  <p className="text-xl font-mono text-white font-bold">{categoryCounts.bug || 0}</p>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/30 border border-zinc-800 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs font-mono text-zinc-500 uppercase">Logic</p>
                  <p className="text-xl font-mono text-white font-bold">{categoryCounts.logic || 0}</p>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/30 border border-zinc-800 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-xs font-mono text-zinc-500 uppercase">Code Quality</p>
                  <p className="text-xl font-mono text-white font-bold">{categoryCounts.quality || 0}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Severity Breakdown */}
          <Card className="bg-zinc-950 border-zinc-800 rounded-none p-6">
            <h3 className="font-bold text-white uppercase font-sans text-sm tracking-wider flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4 text-zinc-400" />
              Severity Breakdown
            </h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-red-950/20 border border-red-900/50">
                <p className="font-mono text-[10px] uppercase text-red-400">Critical</p>
                <p className="font-mono text-xl font-bold text-red-400 mt-1">{severityCounts.critical || 0}</p>
              </div>
              <div className="p-3 bg-orange-950/20 border border-orange-900/50">
                <p className="font-mono text-[10px] uppercase text-orange-400">High</p>
                <p className="font-mono text-xl font-bold text-orange-400 mt-1">{severityCounts.high || 0}</p>
              </div>
              <div className="p-3 bg-amber-950/20 border border-amber-900/50">
                <p className="font-mono text-[10px] uppercase text-amber-400">Medium</p>
                <p className="font-mono text-xl font-bold text-amber-400 mt-1">{severityCounts.medium || 0}</p>
              </div>
              <div className="p-3 bg-zinc-900/40 border border-zinc-800">
                <p className="font-mono text-[10px] uppercase text-zinc-400">Low</p>
                <p className="font-mono text-xl font-bold text-zinc-300 mt-1">{severityCounts.low || 0}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
