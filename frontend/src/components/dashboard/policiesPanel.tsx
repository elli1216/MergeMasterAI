import { useState, useMemo } from 'react'
import { useMutation, useQuery } from 'convex/react'
import {
  Plus,
  Trash2,
  Sparkles,
  Shield,
  X,
  FileCode,
  Search,
  Filter,
  CheckCircle2,
  Edit2,
} from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Card, CardContent } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { PolicyImportExportModal } from './policyImportExportModal'

const SEVERITY_BADGES: Record<string, string> = {
  critical: 'border-red-900 bg-red-950/50 text-red-400',
  high: 'border-orange-900 bg-orange-950/50 text-orange-400',
  medium: 'border-amber-900 bg-amber-950/50 text-amber-400',
  low: 'border-zinc-800 bg-zinc-900/50 text-zinc-400',
}

export type PolicyItem = {
  _id: Id<'custom_policies'>
  _creationTime: number
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  is_active: boolean
  created_at?: number
}

type PoliciesPanelProps = {
  showHero?: boolean
}

export function PoliciesPanel({ showHero = false }: PoliciesPanelProps) {
  const policies = (useQuery(api.customPolicies.getPolicies) || []) as Array<PolicyItem>
  const createPolicy = useMutation(api.customPolicies.createPolicy)
  const updatePolicy = useMutation(api.customPolicies.updatePolicy)
  const togglePolicy = useMutation(api.customPolicies.togglePolicy)
  const deletePolicy = useMutation(api.customPolicies.deletePolicy)
  const seedPolicies = useMutation(api.customPolicies.seedDefaultPolicies)
  const importPolicies = useMutation(api.customPolicies.importPolicies)

  const [isAdding, setIsAdding] = useState(false)
  const [editingPolicyId, setEditingPolicyId] = useState<Id<'custom_policies'> | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('high')
  const [seeding, setSeeding] = useState(false)
  const [importExportOpen, setImportExportOpen] = useState(false)

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = p.title.toLowerCase().includes(q)
        const matchDesc = p.description.toLowerCase().includes(q)
        if (!matchTitle && !matchDesc) return false
      }
      // Severity
      if (severityFilter !== 'all' && p.severity !== severityFilter) {
        return false
      }
      // Status
      if (statusFilter === 'active' && !p.is_active) return false
      if (statusFilter === 'inactive' && p.is_active) return false

      return true
    })
  }, [policies, searchQuery, severityFilter, statusFilter])

  const activeCount = policies.filter((p) => p.is_active).length

  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    if (editingPolicyId) {
      await updatePolicy({
        policyId: editingPolicyId,
        title: title.trim(),
        description: description.trim(),
        severity,
      })
      setEditingPolicyId(null)
    } else {
      await createPolicy({
        title: title.trim(),
        description: description.trim(),
        severity,
        is_active: true,
      })
    }

    setTitle('')
    setDescription('')
    setSeverity('high')
    setIsAdding(false)
  }

  const startEdit = (policy: PolicyItem) => {
    setEditingPolicyId(policy._id)
    setTitle(policy.title)
    setDescription(policy.description)
    setSeverity(policy.severity)
    setIsAdding(true)
  }

  const handleCancelAdd = () => {
    setIsAdding(false)
    setEditingPolicyId(null)
    setTitle('')
    setDescription('')
    setSeverity('high')
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

  const handleImportBatch = async (
    items: Array<{ title: string; description: string; severity: 'critical' | 'high' | 'medium' | 'low'; is_active?: boolean }>,
    mode: 'append' | 'replace',
  ) => {
    return await importPolicies({
      policies: items,
      mode,
    })
  }

  return (
    <div className="space-y-6">
      {/* OPTIONAL HERO BANNER (shown on /policies route) */}
      {showHero && (
        <div className="p-6 bg-linear-to-r from-zinc-950 via-zinc-900 to-black border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest">
            <Shield size={14} className="text-white" />
            <span>AI Governance & Custom Guardrails</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Organizational Coding Policies
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed font-sans">
            Define custom architectural, security, and quality constraints. MergeMaster AI's autonomous Analyst agent actively enforces these policies during diff analysis and risk scoring.
          </p>
        </div>
      )}

      {/* HEADER & ACTION BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          {!showHero && (
            <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-5 h-5 text-zinc-400" />
              Organizational Coding Policies
            </h2>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs text-zinc-400">
              {activeCount} of {policies.length} Policies Active
            </span>
            <span className="text-zinc-600">•</span>
            <span className="font-mono text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={11} />
              Enforced on every PR
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* IMPORT / EXPORT BUTTON */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportExportOpen(true)}
            className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-none font-mono text-xs uppercase tracking-wider flex items-center gap-1.5"
          >
            <FileCode size={13} className="text-blue-400" />
            <span>Import / Export JSON</span>
          </Button>

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
            onClick={() => {
              if (isAdding) {
                handleCancelAdd()
              } else {
                setIsAdding(true)
              }
            }}
            className="bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase tracking-wider font-bold"
          >
            {isAdding ? <X className="w-3.5 h-3.5 mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
            {isAdding ? 'Cancel' : 'Add Policy'}
          </Button>
        </div>
      </div>

      {/* ADD / EDIT POLICY FORM */}
      {isAdding && (
        <Card className="bg-zinc-950 border border-zinc-700 rounded-none p-5 shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-2">
              {editingPolicyId ? <Edit2 size={13} /> : <Plus size={13} />}
              {editingPolicyId ? 'Edit Coding Policy' : 'Create New Coding Policy'}
            </span>
            <button
              onClick={handleCancelAdd}
              className="text-zinc-500 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleAddPolicy} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  Policy Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Enforce Input Validation with Zod"
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
                  className="w-full bg-zinc-900 border border-zinc-800 text-white font-mono text-xs p-2.5 rounded-none focus:outline-none focus:border-zinc-500 cursor-pointer"
                >
                  <option value="critical">Critical (Blocks Merge)</option>
                  <option value="high">High (Flags Warning)</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low (Quality Note)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                Detailed Requirement / Instruction for AI Analyst
              </label>
              <textarea
                placeholder="e.g. Ensure all newly added API route handlers validate request bodies using Zod schemas and reject unvalidated input."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 text-white font-sans text-xs p-2.5 rounded-none focus:outline-none focus:border-zinc-500 leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelAdd}
                className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white rounded-none font-mono text-xs uppercase"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase tracking-wider font-bold"
              >
                {editingPolicyId ? 'Update Policy' : 'Save Policy'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* FILTER & SEARCH BAR */}
      {policies.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950 p-3 border border-zinc-800">
          <div className="relative flex-1 max-w-md">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search policies by title or rule description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 pl-8 pr-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-zinc-600 rounded-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Status Filter */}
            <div className="flex items-center border border-zinc-800 bg-black/60 p-0.5 shrink-0">
              {(['all', 'active', 'inactive'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                    statusFilter === st ? 'bg-zinc-200 text-black font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <div className="flex items-center border border-zinc-800 bg-black/60 p-0.5 shrink-0">
              <span className="text-[10px] font-mono text-zinc-600 px-1.5 flex items-center">
                <Filter size={10} />
              </span>
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                    severityFilter === sev ? 'bg-zinc-200 text-black font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* POLICIES TABLE */}
      <Card className="bg-zinc-950 border-zinc-800 rounded-none shadow-none overflow-x-auto">
        <CardContent className="p-0 min-w-[650px]">
          {filteredPolicies.length > 0 ? (
            <Table>
              <TableHeader className="bg-zinc-900 border-b border-zinc-800">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[90px]">
                    Status
                  </TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[220px]">
                    Policy Name
                  </TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[110px]">
                    Severity
                  </TableHead>
                  <TableHead className="text-zinc-400 font-mono text-xs uppercase tracking-wider py-4">
                    AI Constraint Description
                  </TableHead>
                  <TableHead className="text-right text-zinc-400 font-mono text-xs uppercase tracking-wider py-4 w-[100px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPolicies.map((policy: PolicyItem) => (
                  <TableRow
                    key={policy._id}
                    className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors"
                  >
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleToggle(policy._id, policy.is_active)}
                        className={`flex items-center gap-1.5 px-2 py-1 border font-mono text-[10px] uppercase transition-all cursor-pointer rounded-none ${
                          policy.is_active
                            ? 'border-emerald-800 bg-emerald-950/30 text-emerald-400'
                            : 'border-zinc-800 bg-zinc-900/40 text-zinc-500'
                        }`}
                        title={policy.is_active ? 'Active (click to disable)' : 'Disabled (click to enable)'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${policy.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                        <span>{policy.is_active ? 'Active' : 'Off'}</span>
                      </button>
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
                    <TableCell className="text-xs text-zinc-300 font-sans leading-relaxed">
                      {policy.description}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(policy)}
                        className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-none transition-all"
                        title="Edit Policy"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(policy._id)}
                        className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-none transition-all"
                        title="Delete Policy"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : policies.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600 gap-2">
              <p className="font-mono text-xs uppercase tracking-wider text-center">
                No policies match your search query or filter.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSeverityFilter('all')
                  setStatusFilter('all')
                }}
                className="text-xs font-mono text-zinc-400 hover:text-white"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600 gap-3">
              <Shield className="w-10 h-10 stroke-1 text-zinc-700 mb-1" />
              <p className="font-mono text-xs uppercase tracking-wider text-center">
                No custom policies defined yet
              </p>
              <div className="flex items-center gap-2">
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
                <Button
                  size="sm"
                  onClick={() => setImportExportOpen(true)}
                  className="bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase"
                >
                  <FileCode className="w-3.5 h-3.5 mr-1.5" />
                  Import JSON
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IMPORT / EXPORT JSON MODAL */}
      <PolicyImportExportModal
        open={importExportOpen}
        onOpenChange={setImportExportOpen}
        policies={policies}
        onImport={handleImportBatch}
      />
    </div>
  )
}
