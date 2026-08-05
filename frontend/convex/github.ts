import { v } from 'convex/values'
import { action, internalMutation, query } from './_generated/server'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'

export const syncGitHubData = action({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const gh = async (path: string) => {
      const res = await fetch(`https://api.github.com${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })
      if (!res.ok) {
        throw new Error(`GitHub API ${res.status}: ${await res.text()}`)
      }
      return res.json()
    }

    const repos = (await gh(
      '/user/repos?per_page=100&affiliation=owner,collaborator&sort=pushed',
    )) as Array<{ id: number; name: string; owner: { login: string }; full_name: string }>

    let reposSynced = 0
    let prsSynced = 0
    let commitsSynced = 0
    const syncedRepoIds: Array<Id<'repositories'>> = []

    for (const repo of repos) {
      const repositoryId = await ctx.runMutation(internal.github.upsertRepository, {
        name: repo.name,
        owner: repo.owner.login,
        githubRepoId: String(repo.id),
      })

      const pulls = (await gh(`/repos/${repo.full_name}/pulls?state=open&per_page=50`)) as Array<{
        number: number
        title: string
        user: { login: string }
        state: string
        merged_at: string | null
      }>
      for (const pull of pulls) {
        const status =
          pull.state === 'closed'
            ? pull.merged_at
              ? ('merged' as const)
              : ('closed' as const)
            : ('pending' as const)
        await ctx.runMutation(internal.github.upsertPullRequest, {
          githubPrId: String(pull.number),
          repositoryId,
          repoName: repo.full_name,
          title: pull.title,
          author: pull.user.login,
          status,
          riskScore: 0,
          aiSummary: '',
        })
        prsSynced++
      }

      const commits = (await gh(`/repos/${repo.full_name}/commits?per_page=20`)) as Array<{
        sha: string
        commit: { author: { name: string; date: string } | null; message: string }
      }>
      await ctx.runMutation(internal.github.replaceCommits, {
        repositoryId,
        repoName: repo.full_name,
        commits: commits.map((c) => ({
          sha: c.sha,
          author: c.commit.author?.name ?? repo.owner.login,
          message: c.commit.message,
          committedAt: c.commit.author?.date ?? '',
        })),
      })
      commitsSynced += commits.length

      const branches = (await gh(`/repos/${repo.full_name}/branches?per_page=50`)) as Array<{
        name: string
        commit: { sha: string }
        protected: boolean
      }>
      await ctx.runMutation(internal.github.replaceBranches, {
        repositoryId,
        repoName: repo.full_name,
        branches: branches.map((b) => ({
          name: b.name,
          sha: b.commit.sha,
          isProtected: b.protected,
        })),
      })

      reposSynced++
      syncedRepoIds.push(repositoryId)
    }

    await ctx.runMutation(internal.github.applyCleanup, { keepRepoIds: syncedRepoIds })

    return { repos: reposSynced, prs: prsSynced, commits: commitsSynced }
  },
})

export const upsertRepository = internalMutation({
  args: {
    name: v.string(),
    owner: v.string(),
    githubRepoId: v.string(),
  },
  handler: async (ctx, { name, owner, githubRepoId }) => {
    const existing = await ctx.db
      .query('repositories')
      .withIndex('by_github_repo_id', (q) => q.eq('github_repo_id', githubRepoId))
      .first()
    if (existing) {
      await ctx.db.patch('repositories', existing._id, { name, owner, is_active: true })
      return existing._id
    }
    return await ctx.db.insert('repositories', {
      name,
      owner,
      is_active: true,
      github_repo_id: githubRepoId,
    })
  },
})

export const upsertPullRequest = internalMutation({
  args: {
    githubPrId: v.string(),
    repositoryId: v.id('repositories'),
    repoName: v.string(),
    title: v.string(),
    author: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('blocked'),
      v.literal('merged'),
      v.literal('closed'),
    ),
    riskScore: v.number(),
    aiSummary: v.string(),
  },
  handler: async (ctx, { githubPrId, repositoryId, repoName, title, author, status, riskScore, aiSummary }) => {
    const data = {
      repository_id: repositoryId,
      repo_name: repoName,
      title,
      author,
      status,
      risk_score: riskScore,
      ai_summary: aiSummary,
      updated_at: Date.now(),
    }
    const existing = await ctx.db
      .query('pull_requests')
      .withIndex('by_repo_name_and_github_pr_id', (q) =>
        q.eq('repo_name', repoName).eq('github_pr_id', githubPrId),
      )
      .first()
    if (existing) {
      await ctx.db.patch('pull_requests', existing._id, {
        repository_id: repositoryId,
        repo_name: repoName,
        title,
        author,
        status: (status === 'merged' || status === 'closed') ? status : existing.status,
        updated_at: Date.now(),
      })
      return
    }
    await ctx.db.insert('pull_requests', {
      github_pr_id: githubPrId,
      ...data,
    })
  },
})

export const replaceCommits = internalMutation({
  args: {
    repositoryId: v.id('repositories'),
    repoName: v.string(),
    commits: v.array(
      v.object({
        sha: v.string(),
        author: v.string(),
        message: v.string(),
        committedAt: v.string(),
      }),
    ),
  },
  handler: async (ctx, { repositoryId, repoName, commits }) => {
    const existing = await ctx.db
      .query('commits')
      .withIndex('by_repository_id', (q) => q.eq('repository_id', repositoryId))
      .collect()
    for (const doc of existing) {
      await ctx.db.delete('commits', doc._id)
    }
    for (const c of commits) {
      await ctx.db.insert('commits', {
        repository_id: repositoryId,
        repo_name: repoName,
        sha: c.sha,
        author: c.author,
        message: c.message,
        committed_at: c.committedAt,
      })
    }
  },
})

export const replaceBranches = internalMutation({
  args: {
    repositoryId: v.id('repositories'),
    repoName: v.string(),
    branches: v.array(
      v.object({
        name: v.string(),
        sha: v.string(),
        isProtected: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, { repositoryId, repoName, branches }) => {
    const existing = await ctx.db
      .query('branches')
      .withIndex('by_repository_id', (q) => q.eq('repository_id', repositoryId))
      .collect()
    for (const doc of existing) {
      await ctx.db.delete('branches', doc._id)
    }
    for (const b of branches) {
      await ctx.db.insert('branches', {
        repository_id: repositoryId,
        repo_name: repoName,
        name: b.name,
        last_commit_sha: b.sha,
        is_protected: b.isProtected,
      })
    }
  },
})

export const applyCleanup = internalMutation({
  args: { keepRepoIds: v.array(v.id('repositories')) },
  handler: async (ctx, { keepRepoIds }) => {
    const keep = new Set(keepRepoIds)
    for (const pr of await ctx.db.query('pull_requests').collect()) {
      if (!pr.repository_id || !keep.has(pr.repository_id)) {
        await ctx.db.delete('pull_requests', pr._id)
      }
    }
    for (const commit of await ctx.db.query('commits').collect()) {
      if (!keep.has(commit.repository_id)) {
        await ctx.db.delete('commits', commit._id)
      }
    }
    for (const branch of await ctx.db.query('branches').collect()) {
      if (!keep.has(branch.repository_id)) {
        await ctx.db.delete('branches', branch._id)
      }
    }
    for (const repo of await ctx.db.query('repositories').collect()) {
      if (!keep.has(repo._id)) {
        await ctx.db.delete('repositories', repo._id)
      }
    }
  },
})

export const getRecentCommits = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('commits')
      .withIndex('by_committed_at')
      .order('desc')
      .take(20)
  },
})