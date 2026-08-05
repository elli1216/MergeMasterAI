import { v } from "convex/values";
import { query } from "./_generated/server";

export const getUserRepositories = query({
  args: { owner: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // In a real app, you might query by the authenticated user's GitHub org/username
    // For now, we return all repositories or filter by owner
    let repos = await ctx.db.query("repositories").collect();
    if (args.owner) {
        repos = repos.filter(r => r.owner === args.owner);
    }
    return repos;
  },
});
