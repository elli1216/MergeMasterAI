import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const getUserRepositories = query({
  args: { owner: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // In a real app, you might query by the authenticated user's GitHub org/username
    // For now, we return all repositories or filter by owner
    let repos = await ctx.db.query('repositories').collect()
    if (args.owner) {
      repos = repos.filter((r) => r.owner === args.owner)
    }
    return repos
  },
})

export const getRepositoryDetails = query({
  args: { repositoryId: v.id('repositories') },
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repositoryId)
    if (!repo) {
      throw new Error('Repository not found')
    }

    const prs = await ctx.db
      .query('pull_requests')
      .withIndex('by_repository_id', (q) => q.eq('repository_id', args.repositoryId))
      .order('desc')
      .collect()

    const commits = await ctx.db
      .query('commits')
      .withIndex('by_repository_id', (q) => q.eq('repository_id', args.repositoryId))
      .order('desc')
      .take(50) // limit to recent 50 commits

    const branches = await ctx.db
      .query('branches')
      .withIndex('by_repository_id', (q) => q.eq('repository_id', args.repositoryId))
      .collect()

    return { repo, prs, commits, branches }
  },
})

export const syncInstallationRepositories = mutation({
  args: {
    action: v.string(), // "created", "deleted", "added", "removed", "suspend", "unsuspend"
    repositories: v.array(
      v.object({
        name: v.string(),
        owner: v.string(),
        githubRepoId: v.string(),
      }),
    ),
  },
  handler: async (ctx, { action, repositories }) => {
    const isActive = action !== 'deleted' && action !== 'removed' && action !== 'suspend'
    for (const repo of repositories) {
      const existing = await ctx.db
        .query('repositories')
        .withIndex('by_github_repo_id', (q) => q.eq('github_repo_id', repo.githubRepoId))
        .first()

      if (existing) {
        await ctx.db.patch('repositories', existing._id, {
          name: repo.name,
          owner: repo.owner,
          is_active: isActive,
        })
      } else if (isActive) {
        await ctx.db.insert('repositories', {
          name: repo.name,
          owner: repo.owner,
          is_active: true,
          github_repo_id: repo.githubRepoId,
        })
      }
    }
  },
})

export const toggleRepositoryActive = mutation({
  args: {
    repositoryId: v.id('repositories'),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch('repositories', args.repositoryId, {
      is_active: args.isActive,
    })
  },
})
