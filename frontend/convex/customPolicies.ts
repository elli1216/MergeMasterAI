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

export const updatePolicy = mutation({
  args: {
    policyId: v.id('custom_policies'),
    title: v.string(),
    description: v.string(),
    severity: v.union(
      v.literal('critical'),
      v.literal('high'),
      v.literal('medium'),
      v.literal('low'),
    ),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch('custom_policies', args.policyId, {
      title: args.title.trim(),
      description: args.description.trim(),
      severity: args.severity,
      ...(args.is_active !== undefined ? { is_active: args.is_active } : {}),
    })
  },
})

export const importPolicies = mutation({
  args: {
    policies: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        severity: v.union(
          v.literal('critical'),
          v.literal('high'),
          v.literal('medium'),
          v.literal('low'),
        ),
        is_active: v.optional(v.boolean()),
      }),
    ),
    mode: v.optional(v.union(v.literal('append'), v.literal('replace'))),
  },
  handler: async (ctx, args) => {
    const mode = args.mode ?? 'append'
    if (mode === 'replace') {
      const existing = await ctx.db.query('custom_policies').collect()
      for (const item of existing) {
        await ctx.db.delete('custom_policies', item._id)
      }
    }

    let importedCount = 0
    let skippedCount = 0
    const existingPolicies = mode === 'append' ? await ctx.db.query('custom_policies').collect() : []
    const existingTitles = new Set(existingPolicies.map((p) => p.title.trim().toLowerCase()))

    for (const item of args.policies) {
      const normTitle = item.title.trim().toLowerCase()
      if (mode === 'append' && existingTitles.has(normTitle)) {
        skippedCount++
        continue
      }
      await ctx.db.insert('custom_policies', {
        title: item.title.trim(),
        description: item.description.trim(),
        severity: item.severity,
        is_active: item.is_active ?? true,
        created_at: Date.now(),
      })
      existingTitles.add(normTitle)
      importedCount++
    }

    return {
      imported: importedCount,
      skipped: skippedCount,
      total: args.policies.length,
    }
  },
})

export const clearAllPolicies = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('custom_policies').collect()
    for (const item of all) {
      await ctx.db.delete('custom_policies', item._id)
    }
    return { deleted: all.length }
  },
})
