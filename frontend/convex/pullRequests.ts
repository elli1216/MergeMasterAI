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
  },
  handler: async (ctx, args) => {
    const pr = await ctx.db
      .query('pull_requests')
      .withIndex('by_repo_name_and_github_pr_id', (q) =>
        q.eq('repo_name', args.repo_name).eq('github_pr_id', args.github_pr_id),
      )
      .first()
    if (!pr) return
    await ctx.db.insert('ai_decisions_log', {
      pr_id: pr._id,
      decision_type: args.decision_type,
      reasoning: args.reasoning,
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
        return {
          ...log,
          pr_title: pr?.title || 'Unknown PR',
          repo_name: pr?.repo_name || 'Unknown Repo',
          github_pr_id: pr?.github_pr_id || '?',
          full_review: pr?.full_review,
          overridden_by_name: overriddenByName,
        }
      }),
    )
    return enriched
  },
})
