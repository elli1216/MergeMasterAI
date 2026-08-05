import { create } from 'zustand'

interface SyncState {
  syncing: boolean
  syncMessage: string | null
  didAutoSync: boolean
  setSyncing: (syncing: boolean) => void
  setSyncMessage: (msg: string | null) => void
  setDidAutoSync: (done: boolean) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  syncing: false,
  syncMessage: null,
  didAutoSync: false,
  setSyncing: (syncing) => set({ syncing }),
  setSyncMessage: (syncMessage) => set({ syncMessage }),
  setDidAutoSync: (didAutoSync) => set({ didAutoSync }),
}))
