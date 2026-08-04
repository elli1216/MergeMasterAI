import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    github_id: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("engineer")),
  }).index("by_github_id", ["github_id"]),

  pull_requests: defineTable({
    github_pr_id: v.string(),
    repo_name: v.string(),
    title: v.string(),
    author: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("blocked"), v.literal("merged"), v.literal("closed")),
    risk_score: v.number(), // 0 to 100
    ai_summary: v.string(),
    updated_at: v.number(),
  }).index("by_github_pr_id", ["github_pr_id"])
    .index("by_status", ["status"]),

  routing_rules: defineTable({
    file_pattern: v.string(),
    reviewer_role: v.string(),
    auto_approve: v.boolean(),
  }),

  ai_decisions_log: defineTable({
    pr_id: v.id("pull_requests"),
    decision_type: v.union(
      v.literal("block_merge"),
      v.literal("route_reviewer"),
      v.literal("remediate_code"),
      v.literal("auto_approve")
    ),
    reasoning: v.string(),
    overridden_by: v.optional(v.id("users")),
    created_at: v.number(),
  }).index("by_pr_id", ["pr_id"]),
});
