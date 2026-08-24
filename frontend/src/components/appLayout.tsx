import { Link, useLocation } from '@tanstack/react-router'
import { LayoutDashboard, FolderGit2, BarChart3, Menu, X } from 'lucide-react'
import { DashboardHeader } from '~/components/dashboard/dashboardHeader'
import { useState } from 'react'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Repositories', path: '/repositories', icon: FolderGit2 },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ]

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-black text-zinc-50 font-sans selection:bg-white selection:text-black">
      {/* Mobile Top Nav Bar */}
      <div className="md:hidden sticky top-0 z-50 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between p-4">
        <div className="font-extrabold tracking-tight text-white uppercase tracking-widest text-sm flex items-center gap-2">
          <img src="/mergemaster.png" alt="MergeMaster" className="w-6 h-6 rounded" />
          MergeMaster
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 hover:text-white"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-zinc-950 border-r border-zinc-900 z-40 transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } flex flex-col`}
      >
        <div className="p-8 pb-4">
          <div className="font-extrabold tracking-tight text-white uppercase tracking-widest text-lg flex items-center gap-3">
            <img src="/mergemaster.png" alt="MergeMaster" className="w-8 h-8 rounded" />
            MergeMaster
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-mono uppercase tracking-widest transition-colors ${
                  isActive ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <item.icon size={16} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative w-full">
        <div className="p-4 md:p-8 flex-1 max-w-7xl mx-auto w-full space-y-12">
          <DashboardHeader />
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
    </div>
  )
}
