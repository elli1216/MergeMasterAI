import { Link, useLocation } from '@tanstack/react-router'
import { LayoutDashboard, FolderGit2, BarChart3, Menu, X, ExternalLink } from 'lucide-react'
import { DashboardHeader } from '~/components/dashboard/dashboardHeader'
import { useState } from 'react'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Codebases', path: '/repositories', icon: FolderGit2 },
    { name: 'Analytics & ROI', path: '/analytics', icon: BarChart3 },
  ]

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-black text-zinc-50 font-sans selection:bg-white selection:text-black">
      {/* Mobile Top Nav Bar */}
      <div className="md:hidden sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-zinc-900 flex items-center justify-between p-4">
        <div className="font-extrabold tracking-tight text-white uppercase tracking-widest text-sm flex items-center gap-2.5">
          <img src="/mergemaster.png" alt="MergeMaster" className="w-7 h-7 rounded-none border border-zinc-800" />
          <div className="flex flex-col">
            <span className="leading-tight">MergeMaster</span>
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">AI Gatekeeper</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-none text-zinc-400 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-zinc-950 border-r border-zinc-900 z-40 transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } flex flex-col justify-between`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 pb-6 border-b border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/mergemaster.png" alt="MergeMaster" className="w-8 h-8 rounded-none border border-zinc-800 shadow-md" />
              <div className="flex flex-col">
                <span className="font-extrabold tracking-widest text-white uppercase text-sm">MergeMaster</span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Autonomous Co-Worker</span>
              </div>
            </div>
            {/* Close button inside drawer for mobile */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-zinc-500 hover:text-white p-1"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-xs font-mono uppercase tracking-widest transition-all rounded-none ${
                    isActive
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <item.icon size={15} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-zinc-900 space-y-3">
          <div className="p-3 bg-zinc-900/60 border border-zinc-900 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LangGraph Engine
            </div>
            <p className="text-[10px] font-mono text-zinc-500">Autonomous Gate Active</p>
          </div>

          <a
            href="https://github.com/elli1216/MergeMasterAI"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between text-[10px] font-mono text-zinc-500 hover:text-zinc-300 p-1"
          >
            <span>GitHub Repository</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative w-full overflow-x-hidden">
        <div className="p-4 md:p-8 flex-1 max-w-7xl mx-auto w-full space-y-8 md:space-y-12">
          <DashboardHeader />
          {children}
        </div>
      </main>

      {/* Overlay for mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
