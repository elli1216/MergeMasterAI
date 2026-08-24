import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const syncUser = mutation({
  args: {
    github_id: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if the user already exists in the database
    const existing = await ctx.db
      .query('users')
      .withIndex('by_github_id', (q) => q.eq('github_id', args.github_id))
      .first()

    // If not, insert them with a default role
    if (!existing) {
      return await ctx.db.insert('users', {
        github_id: args.github_id,
        name: args.name,
        email: args.email,
        role: 'engineer', // Default role for new signups
      })
    }
    return existing._id
  },
})

export const getUserByGithubId = query({
  args: { github_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_github_id', (q) => q.eq('github_id', args.github_id))
      .first()
  },
})

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('users').collect()
  },
})

export const updateUserRole = mutation({
  args: {
    userId: v.id('users'),
    role: v.union(v.literal('admin'), v.literal('manager'), v.literal('engineer')),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch('users', args.userId, { role: args.role })
  },
})
