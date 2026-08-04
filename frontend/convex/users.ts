import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const syncUser = mutation({
  args: {
    github_id: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if the user already exists in the database
    const existing = await ctx.db
      .query("users")
      .withIndex("by_github_id", (q) => q.eq("github_id", args.github_id))
      .first();

    // If not, insert them with a default role
    if (!existing) {
      await ctx.db.insert("users", {
        github_id: args.github_id,
        name: args.name,
        email: args.email,
        role: "engineer", // Default role for new signups
      });
    }
  },
});
