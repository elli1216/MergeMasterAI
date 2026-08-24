import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Plus, Trash2, Sparkles, Check, X, ShieldCheck } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Card, CardContent } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

export function RoutingRulesPanel() {
  const rules = useQuery(api.routingRules.getRoutingRules) || []
  const createRule = useMutation(api.routingRules.createRoutingRule)
  const deleteRule = useMutation(api.routingRules.deleteRoutingRule)
  const seedRules = useMutation(api.routingRules.seedDefaultRoutingRules)

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
            <ShieldCheck className="w-5 h-5 text-zinc-400" />
            Reviewer Routing Rules
          </h2>
          <p className="text-zinc-500 font-mono text-xs md:text-sm">
            Configure automatic reviewer role assignments and auto-approval policies
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
              {seeding ? 'Seeding...' : 'Load Default Rules'}
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
                File Pattern (Glob)
              </label>
              <input
                type="text"
                placeholder="e.g. *.sql, src/api/*"
                value={filePattern}
                onChange={(e) => setFilePattern(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 text-white font-mono text-xs p-2.5 rounded-none focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Assigned Reviewer Role
              </label>
              <input
                type="text"
                placeholder="e.g. Database Architect, Lead Security Engineer"
                value={reviewerRole}
                onChange={(e) => setReviewerRole(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 text-white font-mono text-xs p-2.5 rounded-none focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-zinc-300">
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  className="rounded border-zinc-800 bg-zinc-900 text-white"
                />
                Auto-approve
              </label>
              <Button
                type="submit"
                size="sm"
                className="bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase tracking-wider ml-auto"
              >
                Save
              </Button>
            </div>
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
                    Pattern
                  </TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">
                    Assigned Role
                  </TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">
                    Auto-Approve
                  </TableHead>
                  <TableHead className="text-right text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow
                    key={rule._id}
                    className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors"
                  >
                    <TableCell className="font-mono text-white text-xs font-bold">
                      <code>{rule.file_pattern}</code>
                    </TableCell>
                    <TableCell className="font-sans text-zinc-300 text-sm">{rule.reviewer_role}</TableCell>
                    <TableCell>
                      {rule.auto_approve ? (
                        <Badge
                          variant="outline"
                          className="rounded-none font-mono text-[9px] uppercase tracking-wider border-green-500/50 text-green-400 bg-green-950/20"
                        >
                          <Check className="w-3 h-3 mr-1 inline" /> Enabled
                        </Badge>
                      ) : (
                        <span className="font-mono text-xs text-zinc-600">Manual review</span>
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
