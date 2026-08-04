import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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
    await ctx.db.patch(args.prId, { status: args.status });
    await ctx.db.insert("ai_decisions_log", {
      pr_id: args.prId,
      decision_type: args.status === "approved" ? "auto_approve" : "block_merge",
      reasoning: args.reason,
      created_at: Date.now(),
    });
  },
});

// For seeding mock data during dev
export const seedMockData = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("pull_requests").collect();
    if (existing.length > 0) return;

    let repo = await ctx.db.query("repositories").filter(q => q.eq(q.field("name"), "MergeMasterAI")).first();
    let repoId;
    if (repo) {
      repoId = repo._id;
    } else {
      repoId = await ctx.db.insert("repositories", {
        name: "MergeMasterAI",
        owner: "flore",
        is_active: true,
        github_repo_id: "repo_101",
      });
    }

    await ctx.db.insert("pull_requests", {
      github_pr_id: "101",
      repository_id: repoId,
      repo_name: "MergeMasterAI",
      title: "feat: implement login page",
      author: "alice_dev",
      status: "pending",
      risk_score: 15,
      ai_summary: "Adds login page with standard OAuth flows. No major risks detected.",
      updated_at: Date.now() - 100000,
    });

    await ctx.db.insert("pull_requests", {
      github_pr_id: "102",
      repository_id: repoId,
      repo_name: "MergeMasterAI",
      title: "fix: update db schema for users",
      author: "bob_engineer",
      status: "blocked",
      risk_score: 98,
      ai_summary: "CRITICAL: Detected destructive drop table without migration script.",
      updated_at: Date.now() - 50000,
    });
    
    await ctx.db.insert("pull_requests", {
      github_pr_id: "103",
      repository_id: repoId,
      repo_name: "MergeMasterAI",
      title: "docs: fix typo in README",
      author: "charlie_writer",
      status: "approved",
      risk_score: 2,
      ai_summary: "Minor markdown typo fix. Safe to merge.",
      updated_at: Date.now(),
    });
  },
});
