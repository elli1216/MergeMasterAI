import { create } from 'zustand'
import type { Id } from '../../convex/_generated/dataModel'

interface PolicyState {
  isAdding: boolean
  editingPolicyId: Id<'custom_policies'> | null
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  seeding: boolean
  importExportOpen: boolean
  searchQuery: string
  severityFilter: 'all' | 'critical' | 'high' | 'medium' | 'low'
  statusFilter: 'all' | 'active' | 'inactive'

  setIsAdding: (isAdding: boolean) => void
  setEditingPolicyId: (id: Id<'custom_policies'> | null) => void
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  setSeverity: (severity: 'critical' | 'high' | 'medium' | 'low') => void
  setSeeding: (seeding: boolean) => void
  setImportExportOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setSeverityFilter: (filter: 'all' | 'critical' | 'high' | 'medium' | 'low') => void
  setStatusFilter: (filter: 'all' | 'active' | 'inactive') => void

  startCreate: () => void
  startEdit: (policy: {
    _id: Id<'custom_policies'>
    title: string
    description: string
    severity: 'critical' | 'high' | 'medium' | 'low'
  }) => void
  cancelForm: () => void
  resetFilters: () => void
}

export const usePolicyStore = create<PolicyState>((set) => ({
  isAdding: false,
  editingPolicyId: null,
  title: '',
  description: '',
  severity: 'high',
  seeding: false,
  importExportOpen: false,
  searchQuery: '',
  severityFilter: 'all',
  statusFilter: 'all',

  setIsAdding: (isAdding) => set({ isAdding }),
  setEditingPolicyId: (editingPolicyId) => set({ editingPolicyId }),
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setSeverity: (severity) => set({ severity }),
  setSeeding: (seeding) => set({ seeding }),
  setImportExportOpen: (importExportOpen) => set({ importExportOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSeverityFilter: (severityFilter) => set({ severityFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),

  startCreate: () =>
    set({
      isAdding: true,
      editingPolicyId: null,
      title: '',
      description: '',
      severity: 'high',
    }),

  startEdit: (policy) =>
    set({
      isAdding: false,
      editingPolicyId: policy._id,
      title: policy.title,
      description: policy.description,
      severity: policy.severity,
    }),

  cancelForm: () =>
    set({
      isAdding: false,
      editingPolicyId: null,
      title: '',
      description: '',
      severity: 'high',
    }),

  resetFilters: () =>
    set({
      searchQuery: '',
      severityFilter: 'all',
      statusFilter: 'all',
    }),
}))
