import { query } from './_generated/server'

export const getAnalyticsSummary = query({
  args: {},
  handler: async (ctx) => {
    const prs = await ctx.db.query('pull_requests').collect()
    const logs = await ctx.db.query('ai_decisions_log').collect()
    const repos = await ctx.db.query('repositories').collect()

    const totalPRs = prs.length
    const approvedCount = prs.filter((p) => p.status === 'approved').length
    const blockedCount = prs.filter((p) => p.status === 'blocked').length
    const pendingCount = prs.filter((p) => p.status === 'pending').length
    const mergedCount = prs.filter((p) => p.status === 'merged').length

    const autoApproveDecisions = logs.filter((l) => l.decision_type === 'auto_approve').length
    const remediationsDecisions = logs.filter((l) => l.decision_type === 'remediate_code').length
    const blockDecisions = logs.filter((l) => l.decision_type === 'block_merge').length
    const routeDecisions = logs.filter((l) => l.decision_type === 'route_reviewer').length

    // Developer hours saved estimate:
    // ~1.5 hours per auto-approved PR + ~2.0 hours per auto-remediated PR + ~0.5 hours per automated AI triage
    const estimatedHoursSaved = Number(
      (autoApproveDecisions * 1.5 + remediationsDecisions * 2.0 + totalPRs * 0.5).toFixed(1),
    )

    // Average risk score calculation
    const avgRiskScore =
      totalPRs > 0
        ? Math.round(prs.reduce((acc, p) => acc + (p.risk_score || 0), 0) / totalPRs)
        : 0

    // Vulnerabilities & findings categorization
    const categoryCounts: Record<string, number> = {
      security: 0,
      logic: 0,
      bug: 0,
      quality: 0,
      docs: 0,
    }
    const severityCounts: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    let totalFindings = 0
    for (const pr of prs) {
      if (pr.full_review && Array.isArray(pr.full_review.findings)) {
        for (const f of pr.full_review.findings) {
          totalFindings++
          const cat = String(f.category || 'quality').toLowerCase()
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
          const sev = String(f.severity || 'low').toLowerCase()
          severityCounts[sev] = (severityCounts[sev] || 0) + 1
        }
      }
    }

    // Risk distribution brackets
    const riskDistribution = [
      { range: '0-25% (Safe)', count: prs.filter((p) => p.risk_score <= 25).length, color: 'bg-green-500' },
      { range: '26-75% (Medium)', count: prs.filter((p) => p.risk_score > 25 && p.risk_score <= 75).length, color: 'bg-amber-500' },
      { range: '76-100% (Critical)', count: prs.filter((p) => p.risk_score > 75).length, color: 'bg-red-500' },
    ]

    return {
      totalPRs,
      totalRepos: repos.length,
      approvedCount,
      blockedCount,
      pendingCount,
      mergedCount,
      autoApproveDecisions,
      remediationsDecisions,
      blockDecisions,
      routeDecisions,
      estimatedHoursSaved,
      avgRiskScore,
      totalFindings,
      categoryCounts,
      severityCounts,
      riskDistribution,
    }
  },
})
