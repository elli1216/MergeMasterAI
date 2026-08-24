import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

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

export const updateRoutingRule = mutation({
  args: {
    ruleId: v.id('routing_rules'),
    file_pattern: v.string(),
    reviewer_role: v.string(),
    auto_approve: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch('routing_rules', args.ruleId, {
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
