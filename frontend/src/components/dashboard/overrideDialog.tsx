import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { useState, useEffect } from 'react'
import type { Id } from '../../../convex/_generated/dataModel'

export type OverrideState = {
  prId: Id<'pull_requests'>
  status: 'approved' | 'blocked'
} | null

type OverrideDialogProps = {
  overrideState: OverrideState
  onClose: () => void
  onSubmit: (prId: Id<'pull_requests'>, status: 'approved' | 'blocked', reason: string) => void
}

export function OverrideDialog({ overrideState, onClose, onSubmit }: OverrideDialogProps) {
  const [reason, setReason] = useState('')

  // Reset reason when dialog opens
  useEffect(() => {
    if (overrideState) {
      setReason('')
    }
  }, [overrideState])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (overrideState && reason.trim()) {
      onSubmit(overrideState.prId, overrideState.status, reason.trim())
      onClose()
    }
  }

  return (
    <Dialog open={!!overrideState} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full md:min-w-3xl bg-[#0a0a0a] border-zinc-800 text-zinc-50 p-0 overflow-hidden shadow-2xl">
        <div className="bg-zinc-900/50 p-6 border-b border-zinc-800">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-sm ${overrideState?.status === 'blocked' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                {overrideState?.status === 'blocked' ? 'BLOCK MERGE' : 'APPROVE MERGE'}
              </span>
            </DialogTitle>
            <DialogDescription className="mt-2 text-zinc-400 font-sans text-sm">
              Please provide a justification for manually overriding the AI decision. This will be recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="reason" className="font-mono text-xs uppercase tracking-widest text-zinc-500">
              Override Reason
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 placeholder:text-zinc-700 rounded-none p-3 font-sans text-sm min-h-[100px] focus:outline-none focus:border-zinc-500 transition-colors"
              placeholder="E.g., False positive, urgent hotfix, etc."
              autoFocus
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white rounded-none hover:bg-zinc-800 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!reason.trim()}
              className={`text-xs font-mono uppercase tracking-widest rounded-none transition-all ${overrideState?.status === 'blocked'
                ? 'bg-red-950 text-red-400 hover:bg-red-900 border border-red-900'
                : 'bg-zinc-100 text-black hover:bg-white border border-transparent'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Confirm {overrideState?.status}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
