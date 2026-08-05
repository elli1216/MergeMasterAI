import { LogOut, RefreshCw, Shield, User } from 'lucide-react'
import { Button } from '~/components/ui/button'

type DashboardHeaderProps = {
  userName: string
  userEmail: string
  avatarUrl?: string
  syncing: boolean
  syncMessage: string | null
  onSync: () => void
  onSignOut: () => void
}

export function DashboardHeader({ userName, userEmail, avatarUrl, syncing, syncMessage, onSync, onSignOut }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-800 pb-8 gap-6">
      <div className="flex items-center gap-4">
        <img src="/mergemaster.png" alt="Logo" className='size-20 rounded-full' />
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white uppercase tracking-widest">Command Center</h1>
          <p className="text-zinc-500 font-mono text-xs md:text-sm mt-1 uppercase">MergeMaster AI // Real-time Dashboard</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
        <div className="flex items-center gap-3 mr-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-none border border-zinc-700" />
          ) : (
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-700 flex items-center justify-center">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
          )}
          <div className="hidden sm:block text-left">
            <div className="text-sm font-bold text-white uppercase tracking-wider truncate max-w-[150px]">
              {userName}
            </div>
            <div className="text-xs text-zinc-500 font-mono truncate max-w-[150px]">{userEmail}</div>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-1">
          <Button variant="outline" className="border-zinc-700 bg-transparent hover:bg-white hover:text-black text-zinc-300 rounded-none transition-all flex-1 md:flex-none" onClick={onSync} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 md:mr-2 ${syncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{syncing ? 'SYNCING...' : 'SYNC GITHUB'}</span>
          </Button>
          {syncMessage && (
            <div className="text-[10px] font-mono text-zinc-500 max-w-[260px] truncate" title={syncMessage}>
              {syncMessage}
            </div>
          )}
        </div>
        <Button variant="outline" className="border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300 rounded-none transition-all" onClick={onSignOut}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
