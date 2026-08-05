import { useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import type { Doc } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Link } from '@tanstack/react-router'

type RepositorySidebarProps = {
  repos: Array<Doc<'repositories'>>
  openPrCount: Record<string, number>
}

const PAGE_SIZE = 5

export function RepositorySidebar({ repos, openPrCount }: RepositorySidebarProps) {
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filteredRepos = repos.filter((repo) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return repo.name.toLowerCase().includes(q) || repo.owner.toLowerCase().includes(q)
  })
  const shownRepos = filteredRepos.slice(0, visibleCount)
  const hasMoreRepos = shownRepos.length < filteredRepos.length

  const handleSearch = (value: string) => {
    setSearch(value)
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <div className="lg:col-span-1 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
          Repositories
        </h2>
        <p className="text-zinc-500 font-mono text-xs mt-1">Monitored Codebases</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="SEARCH REPOS"
          aria-label="Search repositories"
          className="w-full bg-zinc-950 border border-zinc-800 text-white font-mono text-xs uppercase tracking-wider placeholder:text-zinc-600 px-9 py-3 rounded-none focus:outline-none focus:border-white transition-colors"
        />
      </div>

      <div className="space-y-3">
        {shownRepos.length > 0 ? (
          shownRepos.map((repo, idx) => (
            <Link key={repo._id} to="/repository/$id" params={{ id: repo._id }} className="block">
                <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none hover:border-zinc-500 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-zinc-600">{String(idx + 1).padStart(2, '0')}</span>
                        <div className="text-sm font-bold text-white truncate group-hover:text-white transition-colors">{repo.name}</div>
                    </div>
                    <div className="text-xs text-zinc-500 font-mono truncate mt-1 pl-6">{repo.owner}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                    <div className={`w-2 h-2 rounded-full ${repo.is_active ? 'bg-white' : 'bg-zinc-700'}`} />
                    {openPrCount[repo.name] ? (
                        <span className="text-[10px] font-mono text-zinc-400 border border-zinc-800 px-1.5 py-0.5 bg-zinc-900/50">
                        {openPrCount[repo.name]} OPEN
                        </span>
                    ) : null}
                    </div>
                </CardContent>
                </Card>
            </Link>
          ))
        ) : (
          <div className="text-zinc-600 font-mono text-xs uppercase p-4 border border-zinc-800 border-dashed text-center">
            {search ? 'No repositories match search' : 'No repositories found'}
          </div>
        )}
      </div>

      {hasMoreRepos && (
        <Button
          variant="outline"
          className="w-full border-zinc-800 bg-transparent hover:bg-white hover:text-black text-zinc-400 rounded-none transition-all"
          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
        >
          <ChevronDown className="w-4 h-4 mr-2" />
          LOAD MORE // +{filteredRepos.length - shownRepos.length}
        </Button>
      )}
      <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
        Showing {shownRepos.length} of {filteredRepos.length} repos
      </div>
    </div>
  )
}