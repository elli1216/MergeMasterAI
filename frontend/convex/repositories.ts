import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

export const seedMockRepositories = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("repositories").collect();
    if (existing.length > 0) return;

    await ctx.db.insert("repositories", {
      name: "MergeMasterAI",
      owner: "flore",
      is_active: true,
      github_repo_id: "repo_101",
    });

    await ctx.db.insert("repositories", {
      name: "awesome-web-app",
      owner: "flore",
      is_active: false,
      github_repo_id: "repo_102",
    });
  },
});
