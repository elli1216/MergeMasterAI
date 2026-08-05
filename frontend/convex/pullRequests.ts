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
