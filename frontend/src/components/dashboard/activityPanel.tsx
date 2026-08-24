'use client'

import { useState, useMemo } from 'react'
import {
  Activity,
  Flame,
  GitCommit,
  GitPullRequest,
  RefreshCw,
  ExternalLink,
  Calendar,
  Trophy,
  FolderGit2,
  CheckCircle2,
  MessageSquare,
  Tag,
  MapPin,
  Building,
  User,
} from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

type ActivityStats = {
  profile: {
    login: string
    name: string
    avatar_url: string
    bio: string
    public_repos: number
    followers: number
    following: number
    html_url: string
    company?: string
    location?: string
    created_at?: string
  }
  metrics: {
    totalEvents: number
    totalCommits: number
    pushCount: number
    prCount: number
    reviewCount: number
    issueCount: number
    createCount: number
    currentStreak: number
    longestStreak: number
    activeDaysCount: number
  }
  heatmap: Array<{
    date: string
    count: number
    level: number
    dayOfWeek: number
  }>
  topRepositories: Array<{
    name: string
    events: number
    commits: number
  }>
  recentActivity: Array<{
    id: string
    type: 'push' | 'pull_request' | 'review' | 'issue' | 'create' | 'other'
    repo: string
    timestamp: string
    summary: string
    details?: Array<string>
    url?: string
  }>
}

type ActivityPanelProps = {
  data: ActivityStats | null
  loading: boolean
  onRefresh: () => void
  error?: string | null
}

const EVENT_TYPE_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  push: { label: 'Push', color: 'border-emerald-800 bg-emerald-950/40 text-emerald-400', icon: GitCommit },
  pull_request: { label: 'PR', color: 'border-purple-800 bg-purple-950/40 text-purple-400', icon: GitPullRequest },
  review: { label: 'Review', color: 'border-blue-800 bg-blue-950/40 text-blue-400', icon: CheckCircle2 },
  issue: { label: 'Issue', color: 'border-amber-800 bg-amber-950/40 text-amber-400', icon: MessageSquare },
  create: { label: 'Create', color: 'border-cyan-800 bg-cyan-950/40 text-cyan-400', icon: Tag },
  other: { label: 'Event', color: 'border-zinc-800 bg-zinc-900 text-zinc-400', icon: Activity },
}

const HEATMAP_COLORS = [
  'bg-zinc-900 border-zinc-800/80', // 0
  'bg-emerald-950/80 border-emerald-900 text-emerald-300', // 1
  'bg-emerald-800/90 border-emerald-700 text-emerald-100', // 2
  'bg-emerald-600 border-emerald-500 text-black font-bold', // 3
  'bg-emerald-400 border-emerald-300 text-black font-extrabold shadow-sm shadow-emerald-500/50', // 4
]

export function ActivityPanel({
  data,
  loading,
  onRefresh,
  error,
}: ActivityPanelProps) {
  const [filterType, setFilterType] = useState<string>('all')

  const filteredFeed = useMemo(() => {
    if (!data?.recentActivity) return []
    if (filterType === 'all') return data.recentActivity
    return data.recentActivity.filter((item) => item.type === filterType)
  }, [data?.recentActivity, filterType])

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500 space-y-4">
        <RefreshCw size={24} className="animate-spin text-zinc-400" />
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse">
          Fetching GitHub Activity & Contribution Stats...
        </p>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="p-8 bg-red-950/20 border border-red-900 text-center space-y-4">
        <p className="font-mono text-xs text-red-400 uppercase tracking-wider">
          Failed to load GitHub activity: {error}
        </p>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="border-zinc-800 bg-zinc-900 text-white rounded-none font-mono text-xs"
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (!data) return null

  const { profile, metrics, heatmap, topRepositories } = data

  return (
    <div className="space-y-8">
      {/* 1. OPERATOR PROFILE & HERO HEADER */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-zinc-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <img
            src={profile.avatar_url}
            alt={profile.login}
            className="w-16 h-16 rounded-none border-2 border-zinc-700 shadow-xl shrink-0"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {profile.name}
              </h1>
              <span className="font-mono text-xs text-zinc-400 bg-zinc-900 px-2 py-0.5 border border-zinc-800">
                @{profile.login}
              </span>
              <Badge variant="outline" className="border-emerald-800 bg-emerald-950/40 text-emerald-400 font-mono text-[10px] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                Live GitHub Sync
              </Badge>
            </div>
            {profile.bio && (
              <p className="text-xs text-zinc-400 font-sans max-w-xl line-clamp-2">
                {profile.bio}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-zinc-500 pt-1">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {profile.location}
                </span>
              )}
              {profile.company && (
                <span className="flex items-center gap-1">
                  <Building size={11} />
                  {profile.company}
                </span>
              )}
              <span className="flex items-center gap-1">
                <FolderGit2 size={11} />
                {profile.public_repos} Public Repos
              </span>
              <span className="flex items-center gap-1">
                <User size={11} />
                {profile.followers} Followers
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={onRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-none font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 h-9"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Syncing...' : 'Sync Activity'}</span>
          </Button>

          <a
            href={profile.html_url}
            target="_blank"
            rel="noreferrer"
            className="bg-white text-black hover:bg-zinc-200 px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold rounded-none flex items-center gap-1.5 h-9 transition-colors"
          >
            <span>GitHub Profile</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* 2. STATS KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Commits */}
        <Card className="bg-zinc-950 border-zinc-800 rounded-none p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">
              Total Commits
            </span>
            <GitCommit className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-light text-white">
              {metrics.totalCommits}
            </span>
            <span className="text-xs font-mono text-zinc-500">commits</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-2">
            Across {metrics.pushCount} push events in recent activity
          </p>
        </Card>

        {/* Current Day Streak */}
        <Card className="bg-zinc-950 border-zinc-800 rounded-none p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">
              Current Streak
            </span>
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-light text-amber-400">
              {metrics.currentStreak}
            </span>
            <span className="text-xs font-mono text-zinc-500">days</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-2">
            {metrics.activeDaysCount} active days in last 30-day window
          </p>
        </Card>

        {/* Longest Streak */}
        <Card className="bg-zinc-950 border-zinc-800 rounded-none p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">
              Longest Streak
            </span>
            <Trophy className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-light text-white">
              {metrics.longestStreak}
            </span>
            <span className="text-xs font-mono text-zinc-500">consecutive days</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-2">
            Max activity velocity tracked
          </p>
        </Card>

        {/* PRs & Reviews */}
        <Card className="bg-zinc-950 border-zinc-800 rounded-none p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">
              PRs & Reviews
            </span>
            <GitPullRequest className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-light text-white">
              {metrics.prCount + metrics.reviewCount}
            </span>
            <span className="text-xs font-mono text-zinc-500">interactions</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-2">
            {metrics.prCount} PRs opened + {metrics.reviewCount} peer reviews
          </p>
        </Card>
      </div>

      {/* 3. 30-DAY CONTRIBUTION INTENSITY HEATMAP */}
      <Card className="bg-zinc-950 border-zinc-800 rounded-none p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-2">
              <Calendar size={14} className="text-emerald-400" />
              30-Day Contribution Heatmap
            </h3>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">
              Daily frequency of commits, pull requests, reviews, and issues
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
            <span>Less</span>
            {HEATMAP_COLORS.map((colorClass, idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 border rounded-none ${colorClass}`}
              />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-2 pt-2">
          {heatmap.map((cell) => (
            <div
              key={cell.date}
              className={`p-2 border flex flex-col items-center justify-center rounded-none transition-all hover:scale-105 cursor-default ${
                HEATMAP_COLORS[cell.level]
              }`}
              title={`${cell.date}: ${cell.count} contributions`}
            >
              <span className="text-[9px] font-mono opacity-60">
                {cell.date.slice(5)}
              </span>
              <span className="text-xs font-mono font-bold">
                {cell.count}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. TWO-COLUMN: TOP ACTIVE REPOSITORIES & EVENT BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Active Repositories */}
        <Card className="bg-zinc-950 border-zinc-800 rounded-none p-5 lg:col-span-1 space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-2">
              <FolderGit2 size={14} className="text-purple-400" />
              Top Active Codebases
            </h3>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">
              Ranked by recent commits & events
            </p>
          </div>

          <div className="space-y-3">
            {topRepositories.length > 0 ? (
              topRepositories.map((repo, idx) => (
                <div
                  key={repo.name}
                  className="p-3 bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <span className="font-mono text-xs text-zinc-500 font-bold">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <a
                        href={`https://github.com/${repo.name}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-white font-bold hover:underline truncate block"
                      >
                        {repo.name}
                      </a>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {repo.commits} commits • {repo.events} events
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-zinc-950 text-zinc-400 border-zinc-800 font-mono text-[10px] shrink-0">
                    {repo.commits} Commits
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-xs font-mono text-zinc-500 py-4 text-center">
                No active repositories tracked yet
              </p>
            )}
          </div>
        </Card>

        {/* Live Activity Feed / Timeline */}
        <Card className="bg-zinc-950 border-zinc-800 rounded-none p-5 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-2">
                <Activity size={14} className="text-emerald-400" />
                Live GitHub Event Timeline
              </h3>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">
                Chronological feed of commits, PRs, and reviews
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto border border-zinc-800 bg-black/60 p-0.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'push', label: 'Pushes' },
                { id: 'pull_request', label: 'PRs' },
                { id: 'review', label: 'Reviews' },
                { id: 'issue', label: 'Issues' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                    filterType === f.id
                      ? 'bg-zinc-200 text-black font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feed List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredFeed.length > 0 ? (
              filteredFeed.map((item) => {
                const badge = EVENT_TYPE_BADGES[item.type] || EVENT_TYPE_BADGES.other
                const IconComponent = badge.icon
                let timeAgo = ''
                try {
                  timeAgo = formatDistanceToNow(parseISO(item.timestamp), { addSuffix: true })
                } catch {
                  timeAgo = item.timestamp
                }

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-zinc-900/30 border border-zinc-800/80 hover:border-zinc-700 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`rounded-none font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 ${badge.color}`}
                        >
                          <IconComponent size={10} />
                          <span>{badge.label}</span>
                        </Badge>
                        <span className="font-mono text-xs text-zinc-400">
                          {item.repo}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500 shrink-0">
                        {timeAgo}
                      </span>
                    </div>

                    <p className="text-xs text-white font-sans font-medium">
                      {item.summary}
                    </p>

                    {item.details && item.details.length > 0 && (
                      <div className="bg-black/60 border border-zinc-900 p-2 space-y-1">
                        {item.details.map((msg, i) => (
                          <div key={i} className="text-[11px] font-mono text-zinc-400 flex items-start gap-1.5 truncate">
                            <span className="text-zinc-600 shrink-0">•</span>
                            <span className="truncate">{msg}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.url && (
                      <div className="flex justify-end">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-mono text-zinc-500 hover:text-white flex items-center gap-1"
                        >
                          <span>View on GitHub</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                No events found matching this filter
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
