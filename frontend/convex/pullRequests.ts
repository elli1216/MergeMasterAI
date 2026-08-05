import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getActivePRs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("pull_requests")
      .order("desc")
      .take(50);
  },
});

export const overrideDecision = mutation({
  args: { prId: v.id("pull_requests"), status: v.union(v.literal("approved"), v.literal("blocked")), reason: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch("pull_requests", args.prId, { status: args.status });
    await ctx.db.insert("ai_decisions_log", {
      pr_id: args.prId,
      decision_type: args.status === "approved" ? "auto_approve" : "block_merge",
      reasoning: args.reason,
      created_at: Date.now(),
    });
  },
});

export const updatePullRequestAnalysis = mutation({
  args: {
    github_pr_id: v.string(),
    repo_name: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("blocked"), v.literal("merged"), v.literal("closed")),
    risk_score: v.number(),
    ai_summary: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pull_requests")
      .withIndex("by_repo_name_and_github_pr_id", (q) =>
        q.eq("repo_name", args.repo_name).eq("github_pr_id", args.github_pr_id))
      .first();
    if (!existing) return;
    await ctx.db.patch("pull_requests", existing._id, {
      status: args.status,
      risk_score: args.risk_score,
      ai_summary: args.ai_summary,
      updated_at: Date.now(),
    });
  },
});

export const logAnalysisDecision = mutation({
  args: {
    github_pr_id: v.string(),
    repo_name: v.string(),
    decision_type: v.union(
      v.literal("block_merge"),
      v.literal("route_reviewer"),
      v.literal("remediate_code"),
      v.literal("auto_approve"),
    ),
    reasoning: v.string(),
  },
  handler: async (ctx, args) => {
    const pr = await ctx.db
      .query("pull_requests")
      .withIndex("by_repo_name_and_github_pr_id", (q) =>
        q.eq("repo_name", args.repo_name).eq("github_pr_id", args.github_pr_id))
      .first();
    if (!pr) return;
    await ctx.db.insert("ai_decisions_log", {
      pr_id: pr._id,
      decision_type: args.decision_type,
      reasoning: args.reasoning,
      created_at: Date.now(),
    });
  },
});
