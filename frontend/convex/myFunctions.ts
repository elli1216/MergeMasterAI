import { v } from 'convex/values'
import { action, mutation, query } from './_generated/server'
import { api } from './_generated/api'

// Mock functions to maintain compatibility with boilerplate files without requiring the deleted 'numbers' table.

export const listNumbers = query({
  args: {
    count: v.number(),
  },
  handler: async (ctx, args) => {
    return {
      viewer: (await ctx.auth.getUserIdentity())?.name ?? null,
      numbers: Array.from({ length: args.count }, (_, i) => i + 1),
    }
  },
})

export const addNumber = mutation({
  args: {
    value: v.number(),
  },
  handler: async (ctx, args) => {
    console.log('Mock add number:', args.value)
  },
})

export const myAction = action({
  args: {
    first: v.number(),
  },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(api.myFunctions.listNumbers, {
      count: 10,
    })
    console.log(data)
    await ctx.runMutation(api.myFunctions.addNumber, {
      value: args.first,
    })
  },
})
