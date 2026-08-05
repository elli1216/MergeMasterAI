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

export const getRepositoryDetails = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repositoryId);
    if (!repo) {
      throw new Error("Repository not found");
    }

    const prs = await ctx.db
      .query("pull_requests")
      .withIndex("by_repository_id", (q) => q.eq("repository_id", args.repositoryId))
      .order("desc")
      .collect();

    const commits = await ctx.db
      .query("commits")
      .withIndex("by_repository_id", (q) => q.eq("repository_id", args.repositoryId))
      .order("desc")
      .take(50); // limit to recent 50 commits

    const branches = await ctx.db
      .query("branches")
      .withIndex("by_repository_id", (q) => q.eq("repository_id", args.repositoryId))
      .collect();

    return { repo, prs, commits, branches };
  },
});
