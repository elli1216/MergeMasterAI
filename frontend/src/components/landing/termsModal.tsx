import { useState } from 'react'
import {
  Shield,
  Bot,
  Lock,
  User,
  Mail,
  FolderGit2,
  GitCommit,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

type TermsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccept: () => void
  actionLabel?: string
}

export function TermsModal({
  open,
  onOpenChange,
  onAccept,
  actionLabel = 'Connect GitHub & Launch Console',
}: TermsModalProps) {
  const [agreed, setAgreed] = useState(false)

  const handleConfirm = () => {
    if (!agreed) return
    onOpenChange(false)
    onAccept()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-zinc-950 border border-zinc-800 text-white rounded-none p-0 overflow-hidden flex flex-col font-sans">
        {/* HEADER */}
        <DialogHeader className="p-4 sm:p-6 bg-black border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={11} className="text-emerald-400" />
              Security & Data Disclosure
            </span>
            <Badge
              variant="outline"
              className="bg-zinc-900 text-zinc-400 border-zinc-800 font-mono text-[10px]"
            >
              OAuth & AI Scope
            </Badge>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold text-white tracking-tight mt-2">
            Terms of Service & AI Data Access Disclosure
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-zinc-400 mt-1">
            Please review how MergeMaster AI accesses, processes, and reads your
            GitHub account data before proceeding.
          </DialogDescription>
        </DialogHeader>

        {/* BODY - DATA ACCESS BREAKDOWN */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-zinc-950 text-xs sm:text-sm">
          {/* NOTICE BANNER */}
          <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs leading-relaxed space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5 font-mono uppercase text-[11px] tracking-wider">
              <Sparkles size={13} className="text-amber-400" />
              Autonomous AI Co-Worker Operation
            </p>
            <p className="text-zinc-400 text-xs">
              To evaluate risks, generate automated fixes, and route pull
              requests, MergeMaster AI will request read and authorized write
              access to your GitHub data via WorkOS OAuth and the MergeMaster
              GitHub App.
            </p>
          </div>

          {/* ITEM SPECIFICATIONS */}
          <div className="space-y-3">
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              Data Retrieved & AI Processing Scope
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. Profile & Email */}
              <div className="p-3 bg-black border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase">
                  <User size={13} className="text-blue-400" />
                  <span>GitHub Username</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  Retrieved to create your operator identity and display your
                  repository profile across the dashboard.
                </p>
              </div>

              {/* 2. Email Address */}
              <div className="p-3 bg-black border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase">
                  <Mail size={13} className="text-emerald-400" />
                  <span>Primary Email Address</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  Retrieved from your GitHub account for authentication
                  verification and critical review notifications.
                </p>
              </div>

              {/* 3. Repositories */}
              <div className="p-3 bg-black border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase">
                  <FolderGit2 size={13} className="text-purple-400" />
                  <span>Repositories & Branches</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  Read access to discover your active codebases, branches, and
                  manage autonomous merge gates.
                </p>
              </div>

              {/* 4. Commits & PR Diffs */}
              <div className="p-3 bg-black border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase">
                  <GitCommit size={13} className="text-orange-400" />
                  <span>Commits & PR Diffs</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  Fetched in real time to trace modifications, patch contents,
                  changed files, and code author history.
                </p>
              </div>
            </div>

            {/* 5. AI READING NOTICE (HIGHLIGHTED) */}
            <div className="p-3.5 bg-linear-to-r from-red-950/20 via-amber-950/20 to-zinc-900/40 border border-amber-900/50 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider">
                <Bot size={15} className="text-amber-400 shrink-0" />
                <span>AI Agent Analysis & Code Reading</span>
              </div>
              <p className="text-zinc-300 text-xs leading-relaxed font-sans">
                Our autonomous multi-agent pipeline will{' '}
                <strong>
                  actively read, parse, and analyze your pull request code diffs
                  and commits
                </strong>
                .
              </p>
              <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside font-sans">
                <li>
                  Assess code risk scores (0–100) and identify security
                  vulnerabilities.
                </li>
                <li>
                  Verify compliance with your custom organizational coding
                  policies.
                </li>
                <li>
                  Draft surgical remediation commits to fix detected security
                  flaws.
                </li>
                <li>
                  Synthesize automated unit tests tailored to your PR changes.
                </li>
              </ul>
            </div>

            {/* PRIVACY & DATA GUARANTEES */}
            <div className="flex items-start gap-2 pt-1 text-[11px] font-mono text-zinc-500">
              <Lock size={12} className="shrink-0 mt-0.5 text-zinc-400" />
              <span>
                Your source code is processed strictly for PR analysis and
                gatekeeping. Access tokens are encrypted and you can revoke
                permissions anytime via GitHub Settings.
              </span>
            </div>
          </div>

          {/* CHECKBOX AGREEMENT */}
          <div className="p-3 bg-black border border-zinc-800 flex items-start gap-3 mt-4">
            <input
              type="checkbox"
              id="terms-agree-checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded-none accent-white cursor-pointer"
            />
            <label
              htmlFor="terms-agree-checkbox"
              className="text-xs text-zinc-200 font-sans cursor-pointer select-none leading-relaxed"
            >
              I understand and agree that MergeMaster AI will access my{' '}
              <strong>GitHub username, email, repositories, commits</strong>,
              and authorize the{' '}
              <strong>AI agents to read and analyze my code diffs</strong> to
              perform automated reviews and risk scoring.
            </label>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 sm:p-6 bg-black border-t border-zinc-900 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white rounded-none font-mono text-xs uppercase h-9 px-4"
          >
            Decline & Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={!agreed}
            onClick={handleConfirm}
            className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-none font-mono text-xs uppercase tracking-wider font-bold h-9 px-6 flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <span>{actionLabel}</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
