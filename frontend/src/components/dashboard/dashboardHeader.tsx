import { LogOut, RefreshCw, User, Shield } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { useAuth } from '@workos-inc/authkit-react'
import { useAction, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useSyncStore } from '~/store/syncStore'
import { useCallback, useEffect } from 'react'

export function DashboardHeader() {
  const { user, signOut } = useAuth()
  const syncGitHub = useAction(api.github.syncGitHubData)
  const dbUser = useQuery(
    api.users.getUserByGithubId,
    user?.id ? { github_id: user.id } : 'skip',
  )

  const syncing = useSyncStore((state) => state.syncing)
  const syncMessage = useSyncStore((state) => state.syncMessage)
  const didAutoSync = useSyncStore((state) => state.didAutoSync)
  const setSyncing = useSyncStore((state) => state.setSyncing)
  const setSyncMessage = useSyncStore((state) => state.setSyncMessage)
  const setDidAutoSync = useSyncStore((state) => state.setDidAutoSync)

  const doSync = useCallback(async () => {
    const token = localStorage.getItem('github_oauth_access_token')
    if (!token) {
      setSyncMessage('No GitHub token found. Sign out and sign back in to grant GitHub access.')
      return
    }
    setSyncing(true)
    setSyncMessage(null)
    try {
      const result = await syncGitHub({ token })
      setSyncMessage(`Synced ${result.repos} repos, ${result.prs} PRs, ${result.commits} commits`)
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : String(err))
    } finally {
      setSyncing(false)
    }
  }, [syncGitHub, setSyncing, setSyncMessage])

  useEffect(() => {
    if (!didAutoSync) {
      setDidAutoSync(true)
      doSync()
    }
  }, [didAutoSync, doSync, setDidAutoSync])

  const userName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Unknown User' : 'Unknown User'
  const userEmail = user?.email ?? ''
  const avatarUrl = user?.profilePictureUrl
  const userRole = dbUser?.role || 'engineer'

  return (
    <header className="flex flex-col xl:flex-row items-start xl:items-center justify-between border-b border-zinc-800 pb-6 gap-6">
      {/* Title Area */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white uppercase tracking-widest">
          Command Center
        </h1>
        <p className="text-zinc-500 font-mono text-xs md:text-sm mt-1 uppercase">
          MergeMaster AI // Real-time Dashboard
        </p>
      </div>

      {/* Controls Area */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full xl:w-auto">
        {/* User Badge */}
        <div className="flex items-center gap-3 bg-zinc-950 p-2 border border-zinc-800 flex-1 sm:flex-none sm:min-w-[220px]">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-none border border-zinc-700 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
          )}
          <div className="text-left overflow-hidden pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white uppercase tracking-wider truncate">
                {userName}
              </span>
              <Badge
                variant="outline"
                className="rounded-none text-[8px] font-mono uppercase tracking-widest px-1.5 py-0 border-zinc-700 bg-zinc-900 text-zinc-400"
              >
                <Shield className="w-2.5 h-2.5 mr-0.5 inline text-zinc-500" />
                {userRole}
              </Badge>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono truncate">{userEmail}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col flex-1">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-zinc-700 bg-zinc-950 hover:bg-white hover:text-black text-zinc-300 rounded-none transition-all flex items-center justify-center gap-2 h-14 sm:h-14"
              onClick={doSync}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span className="font-mono text-xs uppercase tracking-widest">
                {syncing ? 'SYNCING...' : 'SYNC GITHUB'}
              </span>
            </Button>
          </div>

          <Button
            variant="outline"
            className="border-zinc-700 bg-zinc-950 hover:bg-red-950 hover:text-red-400 hover:border-red-900 text-zinc-300 rounded-none transition-all h-14 w-full sm:w-14 shrink-0 flex items-center justify-center"
            onClick={() => signOut()}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 hidden sm:block" />
            <span className="font-mono text-xs uppercase tracking-widest sm:hidden flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </span>
          </Button>
        </div>
      </div>

      {/* Global Sync Message Feedback */}
      {syncMessage && (
        <div className="w-full xl:hidden text-[10px] font-mono text-zinc-500 truncate" title={syncMessage}>
          {syncMessage}
        </div>
      )}
    </header>
  )
}
