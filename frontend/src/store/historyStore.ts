import { create } from 'zustand'
import type { AnalysisHistoryRecord } from '~/components/dashboard/analysisHistoryDialog'

interface HistoryState {
  selectedHistoryRecord: AnalysisHistoryRecord | null
  historyDialogOpen: boolean
  selectedRecordId: string | null
  severityFilter: 'all' | 'critical' | 'high' | 'medium' | 'low'

  openHistoryDialog: (record: AnalysisHistoryRecord) => void
  closeHistoryDialog: () => void
  setHistoryDialogOpen: (open: boolean) => void
  setSelectedRecordId: (id: string | null) => void
  setSeverityFilter: (filter: 'all' | 'critical' | 'high' | 'medium' | 'low') => void
  reset: () => void
}

export const useHistoryStore = create<HistoryState>((set) => ({
  selectedHistoryRecord: null,
  historyDialogOpen: false,
  selectedRecordId: null,
  severityFilter: 'all',

  openHistoryDialog: (record) =>
    set({
      selectedHistoryRecord: record,
      selectedRecordId: record._id,
      historyDialogOpen: true,
      severityFilter: 'all',
    }),

  closeHistoryDialog: () =>
    set({
      historyDialogOpen: false,
    }),

  setHistoryDialogOpen: (historyDialogOpen) => set({ historyDialogOpen }),
  setSelectedRecordId: (selectedRecordId) => set({ selectedRecordId }),
  setSeverityFilter: (severityFilter) => set({ severityFilter }),
  reset: () =>
    set({
      selectedHistoryRecord: null,
      historyDialogOpen: false,
      selectedRecordId: null,
      severityFilter: 'all',
    }),
}))
