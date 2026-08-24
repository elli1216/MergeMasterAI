import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Plus, Trash2, Sparkles, Shield, X } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Card, CardContent } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

const SEVERITY_BADGES: Record<string, string> = {
  critical: 'border-red-900 bg-red-950/50 text-red-400',
  high: 'border-orange-900 bg-orange-950/50 text-orange-400',
  medium: 'border-amber-900 bg-amber-950/50 text-amber-400',
  low: 'border-zinc-800 bg-zinc-900/50 text-zinc-400',
}

type PolicyItem = {
  _id: Id<'custom_policies'>
  _creationTime: number
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  is_active: boolean
  created_at?: number
}

export function PoliciesPanel() {
  const policies = (useQuery(api.pullRequests.getPolicies) || []) as Array<PolicyItem>
  const createPolicy = useMutation(api.pullRequests.createPolicy)
  const togglePolicy = useMutation(api.pullRequests.togglePolicy)
  const deletePolicy = useMutation(api.pullRequests.deletePolicy)
  const seedPolicies = useMutation(api.pullRequests.seedDefaultPolicies)

  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('high')
  const [seeding, setSeeding] = useState(false)

  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    await createPolicy({
      title: title.trim(),
      description: description.trim(),
      severity,
      is_active: true,
    })
    setTitle('')
    setDescription('')
    setSeverity('high')
    setIsAdding(false)
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await seedPolicies()
    } finally {
      setSeeding(false)
    }
  }

  const handleDelete = async (id: Id<'custom_policies'>) => {
    await deletePolicy({ policyId: id })
  }

  const handleToggle = async (id: Id<'custom_policies'>, currentActive: boolean) => {
    await togglePolicy({ policyId: id, is_active: !currentActive })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-5 h-5 text-zinc-400" />
            Organizational Coding Policies
          </h2>
          <p className="text-zinc-500 font-mono text-xs md:text-sm">
            Rules and constraints enforced by the AI Analyst across all pull requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          {policies.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seeding}
              className="border-zinc-700 bg-zinc-950 hover:bg-white hover:text-black text-zinc-300 rounded-none font-mono text-xs uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {seeding ? 'Seeding...' : 'Load Standard Policies'}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase tracking-wider"
          >
            {isAdding ? <X className="w-3.5 h-3.5 mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
            {isAdding ? 'Cancel' : 'Add Policy'}
          </Button>
        </div>
      </div>

      {isAdding && (
        <Card className="bg-zinc-950 border-zinc-700 rounded-none p-4">
          <form onSubmit={handleAddPolicy} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  Policy Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Enforce Input Validation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 text-white font-mono text-xs p-2.5 rounded-none focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  Severity Level
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white font-mono text-xs p-2.5 rounded-none focus:outline-none focus:border-zinc-500"
                >
                  <option value="critical">Critical (Blocks Merge)</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Detailed Requirement / Instruction for AI
              </label>
              <textarea
                placeholder="e.g. Ensure all new endpoint controllers validate request bodies using zod or pydantic."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-800 text-white font-sans text-xs p-2.5 rounded-none focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                className="bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase tracking-wider"
              >
                Save Policy
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none overflow-x-auto">
        <CardContent className="p-0 min-w-150">
          {policies.length > 0 ? (
            <Table>
              <TableHeader className="bg-zinc-900 border-b border-zinc-800">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[80px]">
                    Status
                  </TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[180px]">
                    Policy
                  </TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[100px]">
                    Severity
                  </TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">
                    Description
                  </TableHead>
                  <TableHead className="text-right text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy: PolicyItem) => (
                  <TableRow
                    key={policy._id}
                    className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors"
                  >
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleToggle(policy._id, policy.is_active)}
                        className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                          policy.is_active ? 'bg-green-500 ring-2 ring-green-500/20' : 'bg-zinc-700'
                        }`}
                        title={policy.is_active ? 'Active (click to disable)' : 'Disabled (click to enable)'}
                      />
                    </TableCell>
                    <TableCell className="font-bold text-white font-sans text-sm">
                      {policy.title}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`rounded-none font-mono text-[9px] uppercase tracking-wider ${
                          SEVERITY_BADGES[policy.severity] || SEVERITY_BADGES.low
                        }`}
                      >
                        {policy.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400 font-sans leading-relaxed">
                      {policy.description}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(policy._id)}
                        className="h-7 px-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-none transition-all"
                        title="Delete Policy"
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
                No custom policies defined
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeed}
                disabled={seeding}
                className="border-zinc-800 bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 rounded-none font-mono text-xs uppercase"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Initialize Standard Policies
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
