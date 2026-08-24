import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const storeEmbedding = mutation({
  args: {
    pr_id: v.id('pull_requests'),
    repo_name: v.string(),
    summary: v.string(),
    findings_summary: v.string(),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('pr_embeddings', {
      pr_id: args.pr_id,
      repo_name: args.repo_name,
      summary: args.summary,
      findings_summary: args.findings_summary,
      embedding: args.embedding,
    })
  },
})

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
