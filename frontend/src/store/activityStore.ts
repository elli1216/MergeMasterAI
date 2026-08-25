import { create } from 'zustand'

interface ActivityState {
  filterType: string
  setFilterType: (filter: string) => void
  reset: () => void
}

export const useActivityStore = create<ActivityState>((set) => ({
  filterType: 'all',
  setFilterType: (filterType) => set({ filterType }),
  reset: () => set({ filterType: 'all' }),
}))
