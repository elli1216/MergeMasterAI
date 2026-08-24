import { LogOut, RefreshCw, User, Shield, ChevronDown, CheckCircle2 } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { useAuth } from '@workos-inc/authkit-react'
import { useAction, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useSyncStore } from '~/store/syncStore'
import { useCallback, useEffect, useRef, useState } from 'react'

export function DashboardHeader() {
  const { user, signOut } = useAuth()
  const syncGitHub = useAction(api.github.syncGitHubData)
  const dbUser = useQuery(
    api.users.getUserByGithubId,
    user?.id ? { github_id: user.id } : 'skip',
  )

  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const userName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Anonymous Engineer'
    : 'Anonymous Engineer'
  const userEmail = user?.email ?? ''
  const avatarUrl = user?.profilePictureUrl
  const userRole = dbUser?.role || 'engineer'

  return (
    <header className="flex items-center justify-between border-b border-zinc-800 pb-5 w-full">
      {/* 1. Left Title */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white uppercase tracking-wider">
            Command Center
          </h1>
          <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-1.5 py-0.5 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
        <p className="text-zinc-500 font-mono text-xs hidden sm:block">
          MergeMaster AI // Real-time Release Gatekeeper
        </p>
      </div>

      {/* 2. Right: Sleek User Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 p-1.5 sm:px-3 sm:py-2 transition-all focus:outline-none focus:ring-1 focus:ring-zinc-700"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-7 h-7 rounded-none border border-zinc-700 object-cover"
            />
          ) : (
            <div className="w-7 h-7 bg-zinc-900 border border-zinc-700 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          )}

          <div className="text-left hidden sm:flex flex-col">
            <span className="text-xs font-bold text-white uppercase tracking-wider truncate max-w-[130px]">
              {userName}
            </span>
          </div>

          <Badge
            variant="outline"
            className="rounded-none text-[8px] font-mono uppercase tracking-widest px-1.5 py-0 border-zinc-700 bg-zinc-900 text-zinc-300 hidden md:inline-flex"
          >
            <Shield className="w-2.5 h-2.5 mr-0.5 inline text-zinc-500" />
            {userRole}
          </Badge>

          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-150 ${
              menuOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu Box */}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-zinc-950 border border-zinc-800 shadow-2xl z-50 p-3 space-y-3 font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
            {/* User Info Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-900">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-9 h-9 rounded-none border border-zinc-700 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
              )}
              <div className="overflow-hidden">
                <div className="font-bold text-white uppercase text-xs truncate">{userName}</div>
                <div className="text-[10px] text-zinc-500 truncate">{userEmail}</div>
                <div className="mt-1">
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400">
                    Role: {userRole}
                  </span>
                </div>
              </div>
            </div>

            {/* Sync GitHub Action */}
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  doSync()
                }}
                disabled={syncing}
                className="w-full flex items-center justify-between p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${syncing ? 'animate-spin' : ''}`} />
                  <span className="uppercase tracking-wider font-bold">
                    {syncing ? 'Syncing...' : 'Sync GitHub'}
                  </span>
                </div>
                <span className="text-[9px] text-zinc-500 uppercase">Repos & PRs</span>
              </button>

              {syncMessage && (
                <div className="p-2 bg-zinc-900/60 border border-zinc-900 text-[10px] text-zinc-400 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{syncMessage}</span>
                </div>
              )}
            </div>

            {/* Sign Out Action */}
            <div className="pt-2 border-t border-zinc-900">
              <button
                onClick={() => {
                  setMenuOpen(false)
                  signOut()
                }}
                className="w-full flex items-center gap-2 p-2 text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors text-left uppercase tracking-wider font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
