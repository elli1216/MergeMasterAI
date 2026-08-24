import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const getMessages = query({
  args: { prId: v.id('pull_requests') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('chat_messages')
      .withIndex('by_pr_id', (q) => q.eq('pr_id', args.prId))
      .collect()
  },
})

export const sendMessage = mutation({
  args: {
    prId: v.id('pull_requests'),
    sender: v.union(v.literal('user'), v.literal('ai')),
    sender_name: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('chat_messages', {
      pr_id: args.prId,
      sender: args.sender,
      sender_name: args.sender_name,
      message: args.message,
      created_at: Date.now(),
    })
  },
})

export const clearMessages = mutation({
  args: { prId: v.id('pull_requests') },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('chat_messages')
      .withIndex('by_pr_id', (q) => q.eq('pr_id', args.prId))
      .collect()
    for (const msg of messages) {
      await ctx.db.delete('chat_messages', msg._id)
    }
  },
})
