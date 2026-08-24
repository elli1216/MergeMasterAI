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

export const getUserActivityStats = action({
  args: {
    token: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (_ctx, { token, username }) => {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'MergeMaster-AI-App',
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    let profile = {
      login: username || 'User',
      name: username || 'Developer',
      avatar_url: 'https://github.com/github.png',
      bio: '',
      public_repos: 0,
      followers: 0,
      following: 0,
      html_url: username ? `https://github.com/${username}` : 'https://github.com',
      company: '',
      location: '',
      created_at: '',
    }

    let eventsRaw: Array<any> = []

    try {
      // 1. Fetch User Profile
      const profileEndpoint = token
        ? 'https://api.github.com/user'
        : username
          ? `https://api.github.com/users/${username}`
          : null

      if (profileEndpoint) {
        const userRes = await fetch(profileEndpoint, { headers })
        if (userRes.ok) {
          const userData = await userRes.json()
          profile = {
            login: userData.login || profile.login,
            name: userData.name || userData.login || profile.name,
            avatar_url: userData.avatar_url || profile.avatar_url,
            bio: userData.bio || '',
            public_repos: userData.public_repos || 0,
            followers: userData.followers || 0,
            following: userData.following || 0,
            html_url: userData.html_url || `https://github.com/${userData.login}`,
            company: userData.company || '',
            location: userData.location || '',
            created_at: userData.created_at || '',
          }
        }
      }

      // 2. Fetch User Events
      const targetUser = profile.login || username
      if (targetUser && targetUser !== 'User') {
        const eventsUrl = token
          ? 'https://api.github.com/user/events?per_page=100'
          : `https://api.github.com/users/${targetUser}/events?per_page=100`

        const eventsRes = await fetch(eventsUrl, { headers })
        if (eventsRes.ok) {
          eventsRaw = await eventsRes.json()
        }
      }
    } catch (err) {
      console.warn('GitHub API fetch error during activity stats:', err)
    }

    // 3. Process Events & Metrics
    let totalCommits = 0
    let pushCount = 0
    let prCount = 0
    let issueCount = 0
    let reviewCount = 0
    let createCount = 0

    const repoActivityMap: Record<string, { name: string; events: number; commits: number }> = {}
    const dateCountMap: Record<string, number> = {}
    const activityFeed: Array<{
      id: string
      type: 'push' | 'pull_request' | 'review' | 'issue' | 'create' | 'other'
      repo: string
      timestamp: string
      summary: string
      details?: Array<string>
      url?: string
    }> = []

    for (const ev of eventsRaw) {
      const repoName = ev.repo?.name || 'unknown'
      if (!repoActivityMap[repoName]) {
        repoActivityMap[repoName] = { name: repoName, events: 0, commits: 0 }
      }
      repoActivityMap[repoName].events++

      const dateStr = ev.created_at ? ev.created_at.split('T')[0] : ''
      if (dateStr) {
        dateCountMap[dateStr] = (dateCountMap[dateStr] || 0) + 1
      }

      const eventType = ev.type
      if (eventType === 'PushEvent') {
        pushCount++
        const commits = ev.payload?.commits || []
        const commitCount = commits.length || 1
        totalCommits += commitCount
        repoActivityMap[repoName].commits += commitCount

        const commitMsgs = commits.slice(0, 3).map((c: any) => c.message?.split('\n')[0] || c.sha?.slice(0, 7))
        activityFeed.push({
          id: ev.id,
          type: 'push',
          repo: repoName,
          timestamp: ev.created_at,
          summary: `Pushed ${commitCount} commit${commitCount > 1 ? 's' : ''} to ${ev.payload?.ref?.replace('refs/heads/', '') || 'branch'}`,
          details: commitMsgs,
          url: `https://github.com/${repoName}/commit/${commits[0]?.sha || ''}`,
        })
      } else if (eventType === 'PullRequestEvent') {
        prCount++
        const action = ev.payload?.action || 'opened'
        const pr = ev.payload?.pull_request || {}
        activityFeed.push({
          id: ev.id,
          type: 'pull_request',
          repo: repoName,
          timestamp: ev.created_at,
          summary: `${action.charAt(0).toUpperCase() + action.slice(1)} Pull Request #${pr.number || ''}: ${pr.title || ''}`,
          url: pr.html_url || `https://github.com/${repoName}/pulls`,
        })
      } else if (eventType === 'PullRequestReviewEvent' || eventType === 'PullRequestReviewCommentEvent') {
        reviewCount++
        const pr = ev.payload?.pull_request || {}
        activityFeed.push({
          id: ev.id,
          type: 'review',
          repo: repoName,
          timestamp: ev.created_at,
          summary: `Reviewed Pull Request #${pr.number || ''} on ${repoName}`,
          url: pr.html_url || `https://github.com/${repoName}/pulls`,
        })
      } else if (eventType === 'IssuesEvent' || eventType === 'IssueCommentEvent') {
        issueCount++
        const issue = ev.payload?.issue || {}
        activityFeed.push({
          id: ev.id,
          type: 'issue',
          repo: repoName,
          timestamp: ev.created_at,
          summary: `Issue activity on #${issue.number || ''}: ${issue.title || ''}`,
          url: issue.html_url || `https://github.com/${repoName}/issues`,
        })
      } else if (eventType === 'CreateEvent') {
        createCount++
        const refType = ev.payload?.ref_type || 'repository'
        const refName = ev.payload?.ref || repoName
        activityFeed.push({
          id: ev.id,
          type: 'create',
          repo: repoName,
          timestamp: ev.created_at,
          summary: `Created ${refType} "${refName}"`,
          url: `https://github.com/${repoName}`,
        })
      } else {
        activityFeed.push({
          id: ev.id,
          type: 'other',
          repo: repoName,
          timestamp: ev.created_at,
          summary: `${ev.type.replace('Event', '')} activity on ${repoName}`,
          url: `https://github.com/${repoName}`,
        })
      }
    }

    // 4. Calculate Streaks & 30-Day Heatmap
    const today = new Date()
    const heatmap: Array<{ date: string; count: number; level: number; dayOfWeek: number }> = []

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const count = dateCountMap[ds] || 0
      let level = 0
      if (count > 0) level = 1
      if (count >= 3) level = 2
      if (count >= 6) level = 3
      if (count >= 10) level = 4
      heatmap.push({
        date: ds,
        count,
        level,
        dayOfWeek: d.getDay(),
      })
    }

    // Calculate current streak
    let currentStreak = 0
    let checkDate = new Date(today)
    while (true) {
      const ds = checkDate.toISOString().split('T')[0]
      if (dateCountMap[ds] && dateCountMap[ds] > 0) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        // If today has 0, check if yesterday had activity
        if (currentStreak === 0) {
          checkDate.setDate(checkDate.getDate() - 1)
          const yestDs = checkDate.toISOString().split('T')[0]
          if (dateCountMap[yestDs] && dateCountMap[yestDs] > 0) {
            currentStreak = 1
            checkDate.setDate(checkDate.getDate() - 1)
            continue
          }
        }
        break
      }
    }

    // Calculate longest streak in the 30-day window
    let longestStreak = 0
    let tempStreak = 0
    for (const cell of heatmap) {
      if (cell.count > 0) {
        tempStreak++
        if (tempStreak > longestStreak) longestStreak = tempStreak
      } else {
        tempStreak = 0
      }
    }
    if (currentStreak > longestStreak) longestStreak = currentStreak

    // Top repositories
    const topRepositories = Object.values(repoActivityMap)
      .sort((a, b) => b.events - a.events)
      .slice(0, 5)

    return {
      profile,
      metrics: {
        totalEvents: eventsRaw.length,
        totalCommits,
        pushCount,
        prCount,
        reviewCount,
        issueCount,
        createCount,
        currentStreak,
        longestStreak,
        activeDaysCount: Object.keys(dateCountMap).length,
      },
      heatmap,
      topRepositories,
      recentActivity: activityFeed.slice(0, 25),
    }
  },
})