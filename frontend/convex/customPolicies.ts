import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

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
