import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Plus, Trash2, Sparkles, Filter, X } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Card, CardContent } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

type RuleItem = {
  _id: Id<'routing_rules'>
  _creationTime: number
  file_pattern: string
  reviewer_role: string
  auto_approve?: boolean
}

export function RoutingRulesPanel() {
  const rules = (useQuery(api.pullRequests.getRoutingRules) || []) as Array<RuleItem>
  const createRule = useMutation(api.pullRequests.createRoutingRule)
  const deleteRule = useMutation(api.pullRequests.deleteRoutingRule)
  const seedRules = useMutation(api.pullRequests.seedDefaultRoutingRules)

  const [isAdding, setIsAdding] = useState(false)
  const [filePattern, setFilePattern] = useState('')
  const [reviewerRole, setReviewerRole] = useState('')
  const [autoApprove, setAutoApprove] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!filePattern.trim() || !reviewerRole.trim()) return
    await createRule({
      file_pattern: filePattern.trim(),
      reviewer_role: reviewerRole.trim(),
      auto_approve: autoApprove,
    })
    setFilePattern('')
    setReviewerRole('')
    setAutoApprove(false)
    setIsAdding(false)
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await seedRules()
    } finally {
      setSeeding(false)
    }
  }

  const handleDelete = async (id: Id<'routing_rules'>) => {
    await deleteRule({ ruleId: id })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-5 h-5 text-zinc-400" />
            Reviewer Routing Rules
          </h2>
          <p className="text-zinc-500 font-mono text-xs md:text-sm">
            Map touched file patterns to designated domain expert reviewer roles
          </p>
        </div>
        <div className="flex items-center gap-2">
          {rules.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seeding}
              className="border-zinc-700 bg-zinc-950 hover:bg-white hover:text-black text-zinc-300 rounded-none font-mono text-xs uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {seeding ? 'Seeding...' : 'Load Standard Rules'}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase tracking-wider"
          >
            {isAdding ? <X className="w-3.5 h-3.5 mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
            {isAdding ? 'Cancel' : 'Add Rule'}
          </Button>
        </div>
      </div>

      {isAdding && (
        <Card className="bg-zinc-950 border-zinc-700 rounded-none p-4">
          <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                File Pattern / Glob
              </label>
              <input
                type="text"
                placeholder="e.g. *.sql or src/auth/*"
                value={filePattern}
                onChange={(e) => setFilePattern(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 text-white font-mono text-xs p-2.5 rounded-none focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Designated Reviewer Role
              </label>
              <input
                type="text"
                placeholder="e.g. Security Lead, DBA"
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 text-white font-mono text-xs p-2.5 rounded-none focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="flex items-center space-x-2 py-3">
              <input
                type="checkbox"
                id="autoApprove"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="rounded-none bg-zinc-900 border-zinc-700 text-white focus:ring-0"
              />
              <label htmlFor="autoApprove" className="text-xs font-mono text-zinc-300 cursor-pointer">
                Auto-approve safe files
              </label>
            </div>
            <Button
              type="submit"
              size="sm"
              className="bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase tracking-wider"
            >
              Save Rule
            </Button>
          </form>
        </Card>
      )}

      <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none overflow-x-auto">
        <CardContent className="p-0 min-w-150">
          {rules.length > 0 ? (
            <Table>
              <TableHeader className="bg-zinc-900 border-b border-zinc-800">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">
                    File Pattern
                  </TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">
                    Reviewer Role
                  </TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">
                    Decision Behavior
                  </TableHead>
                  <TableHead className="text-right text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule: RuleItem) => (
                  <TableRow
                    key={rule._id}
                    className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-white">
                      <Badge variant="outline" className="rounded-none border-zinc-700 bg-zinc-900 font-mono text-xs">
                        {rule.file_pattern}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-300">
                      {rule.reviewer_role}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {rule.auto_approve ? (
                        <span className="text-green-400">Auto-Approve</span>
                      ) : (
                        <span className="text-amber-400">Requires Review</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule._id)}
                        className="h-7 px-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-none transition-all"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600 gap-3">
              <p className="font-mono text-xs uppercase tracking-wider text-center">
                No custom routing rules defined
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeed}
                disabled={seeding}
                className="border-zinc-800 bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 rounded-none font-mono text-xs uppercase"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Initialize Standard Rules
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
