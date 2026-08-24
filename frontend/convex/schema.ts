import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    github_id: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal('admin'),
      v.literal('manager'),
      v.literal('engineer'),
    ),
  }).index('by_github_id', ['github_id']),

  repositories: defineTable({
    name: v.string(),
    owner: v.string(), // The GitHub user or organization
    is_active: v.boolean(), // Is MergeMaster enabled for this repo?
    github_repo_id: v.optional(v.string()),
  }).index('by_github_repo_id', ['github_repo_id']),

  commits: defineTable({
    repository_id: v.id('repositories'),
    repo_name: v.string(),
    sha: v.string(),
    author: v.string(),
    message: v.string(),
    committed_at: v.string(),
  })
    .index('by_repository_id', ['repository_id'])
    .index('by_committed_at', ['committed_at']),

  branches: defineTable({
    repository_id: v.id('repositories'),
    repo_name: v.string(),
    name: v.string(),
    last_commit_sha: v.string(),
    is_protected: v.optional(v.boolean()),
  })
    .index('by_repository_id', ['repository_id'])
    .index('by_repo_name_and_name', ['repo_name', 'name']),

  pull_requests: defineTable({
    github_pr_id: v.string(),
    repository_id: v.optional(v.id('repositories')),
    repo_name: v.string(),
    title: v.string(),
    author: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('blocked'),
      v.literal('merged'),
      v.literal('closed'),
    ),
    risk_score: v.number(), // 0 to 100
    ai_summary: v.string(),
    full_review: v.optional(v.any()),
    markdown_report: v.optional(v.string()),
    generated_tests: v.optional(v.any()),
    updated_at: v.number(),
  })
    .index('by_github_pr_id', ['github_pr_id'])
    .index('by_repository_id', ['repository_id'])
    .index('by_repo_name_and_github_pr_id', ['repo_name', 'github_pr_id'])
    .index('by_status', ['status']),

  routing_rules: defineTable({
    file_pattern: v.string(),
    reviewer_role: v.string(),
    auto_approve: v.boolean(),
  }),

  custom_policies: defineTable({
    title: v.string(),
    description: v.string(),
    severity: v.union(
      v.literal('critical'),
      v.literal('high'),
      v.literal('medium'),
      v.literal('low'),
    ),
    is_active: v.boolean(),
    created_at: v.number(),
  }),

  chat_messages: defineTable({
    pr_id: v.id('pull_requests'),
    sender: v.union(v.literal('user'), v.literal('ai')),
    sender_name: v.string(),
    message: v.string(),
    created_at: v.number(),
  }).index('by_pr_id', ['pr_id']),

  pr_embeddings: defineTable({
    pr_id: v.id('pull_requests'),
    repo_name: v.string(),
    summary: v.string(),
    findings_summary: v.string(),
    embedding: v.array(v.float64()),
  }).vectorIndex('by_embedding', {
    vectorField: 'embedding',
    dimensions: 768,
    filterFields: ['repo_name'],
  }),

  ai_decisions_log: defineTable({
    pr_id: v.id('pull_requests'),
    decision_type: v.union(
      v.literal('block_merge'),
      v.literal('route_reviewer'),
      v.literal('remediate_code'),
      v.literal('auto_approve'),
    ),
    reasoning: v.string(),
    overridden_by: v.optional(v.id('users')),
    created_at: v.number(),
  }).index('by_pr_id', ['pr_id']),
})
