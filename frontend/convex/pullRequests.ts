import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const getActivePRs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('pull_requests')
      .order('desc')
      .take(50)
  },
})

export const overrideDecision = mutation({
  args: {
    prId: v.id('pull_requests'),
    status: v.union(v.literal('approved'), v.literal('blocked')),
    reason: v.string(),
    userGithubId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId = undefined
    if (args.userGithubId) {
      const user = await ctx.db
        .query('users')
        .withIndex('by_github_id', (q) => q.eq('github_id', args.userGithubId!))
        .first()
      if (user) {
        userId = user._id
      }
    }

    await ctx.db.patch('pull_requests', args.prId, { status: args.status })
    await ctx.db.insert('ai_decisions_log', {
      pr_id: args.prId,
      decision_type: args.status === 'approved' ? 'auto_approve' : 'block_merge',
      reasoning: args.reason,
      overridden_by: userId,
      created_at: Date.now(),
    })
  },
})

export const updatePullRequestAnalysis = mutation({
  args: {
    github_pr_id: v.string(),
    repo_name: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('blocked'),
      v.literal('merged'),
      v.literal('closed'),
    ),
    risk_score: v.number(),
    ai_summary: v.string(),
    full_review: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('pull_requests')
      .withIndex('by_repo_name_and_github_pr_id', (q) =>
        q.eq('repo_name', args.repo_name).eq('github_pr_id', args.github_pr_id),
      )
      .first()
    if (!existing) return
    await ctx.db.patch('pull_requests', existing._id, {
      status: args.status,
      risk_score: args.risk_score,
      ai_summary: args.ai_summary,
      full_review: args.full_review,
      updated_at: Date.now(),
    })
  },
})

export const saveMarkdownReport = mutation({
  args: {
    github_pr_id: v.string(),
    repo_name: v.string(),
    markdown_report: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('pull_requests')
      .withIndex('by_repo_name_and_github_pr_id', (q) =>
        q.eq('repo_name', args.repo_name).eq('github_pr_id', args.github_pr_id),
      )
      .first()
    if (!existing) return
    await ctx.db.patch('pull_requests', existing._id, {
      markdown_report: args.markdown_report,
    })
  },
})

export const saveGeneratedTests = mutation({
  args: {
    github_pr_id: v.string(),
    repo_name: v.string(),
    generated_tests: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('pull_requests')
      .withIndex('by_repo_name_and_github_pr_id', (q) =>
        q.eq('repo_name', args.repo_name).eq('github_pr_id', args.github_pr_id),
      )
      .first()
    if (!existing) return
    await ctx.db.patch('pull_requests', existing._id, {
      generated_tests: args.generated_tests,
    })
  },
})

export const logAnalysisDecision = mutation({
  args: {
    github_pr_id: v.string(),
    repo_name: v.string(),
    decision_type: v.union(
      v.literal('block_merge'),
      v.literal('route_reviewer'),
      v.literal('remediate_code'),
      v.literal('auto_approve'),
    ),
    reasoning: v.string(),
    risk_score: v.optional(v.number()),
    status: v.optional(v.string()),
    snapshot_review: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const pr = await ctx.db
      .query('pull_requests')
      .withIndex('by_repo_name_and_github_pr_id', (q) =>
        q.eq('repo_name', args.repo_name).eq('github_pr_id', args.github_pr_id),
      )
      .first()
    if (!pr) return

    const snapshot = args.snapshot_review ?? pr.full_review
    const riskScore = args.risk_score ?? pr.risk_score ?? snapshot?.risk_score

    await ctx.db.insert('ai_decisions_log', {
      pr_id: pr._id,
      decision_type: args.decision_type,
      reasoning: args.reasoning,
      risk_score: riskScore,
      status: args.status ?? pr.status,
      snapshot_review: snapshot,
      created_at: Date.now(),
    })
  },
})

export const getAnalyzeHistory = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query('ai_decisions_log').order('desc').take(100)
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const pr = await ctx.db.get(log.pr_id)
        let overriddenByName: string | undefined = undefined
        if (log.overridden_by) {
          const user = await ctx.db.get(log.overridden_by)
          if (user) {
            overriddenByName = user.name || user.email
          }
        }
        const historicalReview = log.snapshot_review ?? pr?.full_review
        const historicalScore = log.risk_score ?? historicalReview?.risk_score ?? pr?.risk_score ?? 0

        return {
          ...log,
          pr_title: pr?.title || 'Unknown PR',
          repo_name: pr?.repo_name || 'Unknown Repo',
          github_pr_id: pr?.github_pr_id || '?',
          pr_author: pr?.author,
          current_pr_status: pr?.status,
          risk_score: historicalScore,
          snapshot_review: historicalReview,
          overridden_by_name: overriddenByName,
        }
      }),
    )
    return enriched
  },
})

export const getPrHistoryTimeline = query({
  args: {
    pr_id: v.id('pull_requests'),
  },
  handler: async (ctx, args) => {
    const pr = await ctx.db.get(args.pr_id)
    const logs = await ctx.db
      .query('ai_decisions_log')
      .withIndex('by_pr_id', (q) => q.eq('pr_id', args.pr_id))
      .order('desc')
      .collect()

    return await Promise.all(
      logs.map(async (log) => {
        let overriddenByName: string | undefined = undefined
        if (log.overridden_by) {
          const user = await ctx.db.get(log.overridden_by)
          if (user) {
            overriddenByName = user.name || user.email
          }
        }
        const historicalReview = log.snapshot_review ?? pr?.full_review
        const historicalScore = log.risk_score ?? historicalReview?.risk_score ?? pr?.risk_score ?? 0

        return {
          ...log,
          pr_title: pr?.title || 'Unknown PR',
          repo_name: pr?.repo_name || 'Unknown Repo',
          github_pr_id: pr?.github_pr_id || '?',
          pr_author: pr?.author,
          current_pr_status: pr?.status,
          risk_score: historicalScore,
          snapshot_review: historicalReview,
          overridden_by_name: overriddenByName,
        }
      }),
    )
  },
})

// --- Routing Rules Functions ---

export const DEFAULT_RULES = [
  { file_pattern: 'schema.prisma', reviewer_role: 'Lead Backend Engineer', auto_approve: false },
  { file_pattern: '*.prisma', reviewer_role: 'Lead Backend Engineer', auto_approve: false },
  { file_pattern: '*.sql', reviewer_role: 'Database Engineer', auto_approve: false },
  { file_pattern: '*.py', reviewer_role: 'Backend Engineer', auto_approve: false },
  { file_pattern: '*.ts', reviewer_role: 'Backend Engineer', auto_approve: false },
  { file_pattern: '*.tsx', reviewer_role: 'Frontend Engineer', auto_approve: false },
  { file_pattern: '*.js', reviewer_role: 'Frontend Engineer', auto_approve: false },
  { file_pattern: '*.css', reviewer_role: 'UI/UX Lead', auto_approve: true },
  { file_pattern: '*.md', reviewer_role: 'Docs Reviewer', auto_approve: true },
  { file_pattern: '*.txt', reviewer_role: 'Docs Reviewer', auto_approve: true },
]

export const getRoutingRules = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('routing_rules').collect()
  },
})

export const createRoutingRule = mutation({
  args: {
    file_pattern: v.string(),
    reviewer_role: v.string(),
    auto_approve: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('routing_rules', {
      file_pattern: args.file_pattern,
      reviewer_role: args.reviewer_role,
      auto_approve: args.auto_approve,
    })
  },
})

export const deleteRoutingRule = mutation({
  args: { ruleId: v.id('routing_rules') },
  handler: async (ctx, args) => {
    await ctx.db.delete('routing_rules', args.ruleId)
  },
})

export const seedDefaultRoutingRules = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('routing_rules').first()
    if (existing) return { seeded: false }
    for (const rule of DEFAULT_RULES) {
      await ctx.db.insert('routing_rules', rule)
    }
    return { seeded: true, count: DEFAULT_RULES.length }
  },
})

// --- Custom Policies Functions ---

export const DEFAULT_POLICIES = [
  {
    title: 'Disallow Hardcoded Credentials',
    description: 'Ensure API keys, tokens, passwords, and private secrets are not committed; use environment variables.',
    severity: 'critical' as const,
    is_active: true,
  },
  {
    title: 'Sanitize Database Queries',
    description: 'Prevent raw string interpolation in SQL queries to prevent SQL Injection vulnerabilities.',
    severity: 'critical' as const,
    is_active: true,
  },
  {
    title: 'Strict Input Validation',
    description: 'Validate and schema-check external input parameters on all newly created API endpoints.',
    severity: 'high' as const,
    is_active: true,
  },
  {
    title: 'Safe Async Exception Handling',
    description: 'All async background tasks and API handlers must catch exceptions and avoid unhandled promise rejections.',
    severity: 'medium' as const,
    is_active: true,
  },
]

export const getPolicies = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('custom_policies').order('desc').collect()
  },
})

export const getActivePolicies = query({
  args: {},
  handler: async (ctx) => {
    const policies = await ctx.db.query('custom_policies').collect()
    return policies.filter((p) => p.is_active)
  },
})

export const createPolicy = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    severity: v.union(
      v.literal('critical'),
      v.literal('high'),
      v.literal('medium'),
      v.literal('low'),
    ),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('custom_policies', {
      title: args.title,
      description: args.description,
      severity: args.severity,
      is_active: args.is_active,
      created_at: Date.now(),
    })
  },
})

export const togglePolicy = mutation({
  args: {
    policyId: v.id('custom_policies'),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch('custom_policies', args.policyId, {
      is_active: args.is_active,
    })
  },
})

export const deletePolicy = mutation({
  args: { policyId: v.id('custom_policies') },
  handler: async (ctx, args) => {
    await ctx.db.delete('custom_policies', args.policyId)
  },
})

export const seedDefaultPolicies = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('custom_policies').first()
    if (existing) return { seeded: false }
    for (const policy of DEFAULT_POLICIES) {
      await ctx.db.insert('custom_policies', {
        ...policy,
        created_at: Date.now(),
      })
    }
    return { seeded: true, count: DEFAULT_POLICIES.length }
  },
})

// --- Analytics Functions ---

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

    const estimatedHoursSaved = Number(
      (autoApproveDecisions * 1.5 + remediationsDecisions * 2.0 + totalPRs * 0.5).toFixed(1),
    )

    const avgRiskScore =
      totalPRs > 0
        ? Math.round(prs.reduce((acc, p) => acc + (p.risk_score || 0), 0) / totalPRs)
        : 0

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

    const riskDistribution: Array<{ range: string; count: number; color: string }> = [
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

// --- RAG Historical Decisions ---

export const getPastDecisions = query({
  args: { repo_name: v.string() },
  handler: async (ctx, args) => {
    const prs = await ctx.db
      .query('pull_requests')
      .withIndex('by_repo_name_and_github_pr_id', (q) => q.eq('repo_name', args.repo_name))
      .order('desc')
      .take(10)

    return prs
      .filter((p) => p.ai_summary && p.ai_summary.trim().length > 0)
      .map((p) => ({
        github_pr_id: p.github_pr_id,
        title: p.title,
        status: p.status,
        risk_score: p.risk_score,
        summary: p.ai_summary,
        findings: p.full_review?.findings || [],
      }))
  },
})
