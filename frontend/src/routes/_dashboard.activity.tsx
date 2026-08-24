import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@workos-inc/authkit-react'
import { useAction, useQuery } from 'convex/react'
import { useCallback, useEffect, useState } from 'react'
import { api } from '../../convex/_generated/api'
import { ActivityPanel } from '~/components/dashboard'

export const Route = createFileRoute('/_dashboard/activity')({
  component: ActivityPage,
})

function ActivityPage() {
  const { user, isLoading } = useAuth()
  const fetchActivity = useAction(api.github.getUserActivityStats)
  const dbUser = useQuery(
    api.users.getUserByGithubId,
    user?.id ? { github_id: user.id } : 'skip',
  )

  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadActivity = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('github_oauth_access_token') || undefined : undefined
    const username = (dbUser as any)?.username || (user as any)?.username || (user as any)?.firstName || undefined

    setLoading(true)
    setError(null)
    try {
      const res = await fetchActivity({
        token,
        username,
      })
      setStats(res)
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }, [fetchActivity, dbUser, user])

  useEffect(() => {
    if (!isLoading && user) {
      loadActivity()
    }
  }, [isLoading, user, loadActivity])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-mono uppercase tracking-widest text-xs animate-pulse">
          Loading System...
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p>Unauthorized. Please return to the homepage to log in.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      <ActivityPanel
        data={stats}
        loading={loading}
        onRefresh={loadActivity}
        error={error}
      />
    </div>
  )
}
