import { useState } from 'react'
import {
  CheckCircle2,
  FileCode2,
  RefreshCcw,
  MessageSquare,
  FlaskConical,
} from 'lucide-react'
import type { AiReview, GeneratedTestSuite } from '~/lib/backend'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { useReviewStore, PIPELINE_STAGES } from '~/store/reviewStore'
import type { ReviewTarget, ChatMessage } from './review'
import {
  ReviewPipelineProgress,
  ReviewReportTab,
  ReviewCopilotTab,
  ReviewTestsTab,
} from './review'

export type { ReviewTarget } from './review'

type AiReviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: ReviewTarget | null
  review: AiReview | null
  loading: boolean
  error: string | null
  onReanalyze?: () => void
}

export function AiReviewDialog({
  open,
  onOpenChange,
  target,
  review,
  loading,
  error,
  onReanalyze,
}: AiReviewDialogProps) {
  const activeTab = useReviewStore((state) => state.activeTab)
  const setActiveTab = useReviewStore((state) => state.setActiveTab)
  const currentStageIndex = useReviewStore((state) => state.currentStageIndex)

  // Local Chat & Test Suite State
  const [messages, setMessages] = useState<Array<ChatMessage>>([])
  const [testSuite, setTestSuite] = useState<GeneratedTestSuite | null>(null)

  const handleOpenChange = (newOpen: boolean) => {
    if (loading) {
      // Prevent user from closing modal while AI pipeline is running
      return
    }
    onOpenChange(newOpen)
  }

  const currentStage = PIPELINE_STAGES[currentStageIndex]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!loading}
        className="w-[96vw] sm:w-[92vw] md:w-[88vw] lg:w-[84vw] xl:w-[80vw] 2xl:w-[74vw] sm:max-w-none md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl max-h-[94vh] sm:max-h-[90vh] bg-zinc-950 border border-zinc-800 text-zinc-50 p-0 rounded-none shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header Area */}
        <div className="border-b border-zinc-800 p-4 sm:p-6 shrink-0 bg-black/40">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <div>
                <DialogTitle className="font-mono text-xs uppercase tracking-widest text-zinc-500">
                  AI Analysis & Autonomous Copilot
                </DialogTitle>
                <DialogDescription className="text-[11px] text-zinc-600 font-mono">
                  Pull Request Evaluation & Decision Engine
                </DialogDescription>
              </div>

              {/* Status or Actions in Header */}
              {loading ? (
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2.5 py-1 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>
                    Stage {currentStageIndex + 1}/{PIPELINE_STAGES.length}:{' '}
                    {currentStage?.name.slice(0, 32)}... (Locked)
                  </span>
                </div>
              ) : review ? (
                <div className="flex items-center gap-2 pt-1 sm:pt-0">
                  {review.status === 'approved' ? (
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 uppercase tracking-wider">
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      <span>Approved Gate</span>
                    </div>
                  ) : onReanalyze ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onReanalyze}
                      className="font-mono text-[10px] sm:text-xs uppercase tracking-wider bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-none transition-all flex items-center gap-1.5 h-8 px-3"
                    >
                      <RefreshCcw size={11} />
                      <span>Re-analyze</span>
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {target && (
              <div className="flex flex-col gap-0.5 mt-3 text-left">
                <span className="text-white text-base sm:text-lg md:text-xl font-sans font-bold tracking-tight line-clamp-1">
                  {target.title}
                </span>
                <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs">
                  <span className="text-zinc-500">{target.repoName}</span>
                  <span className="text-zinc-700">•</span>
                  <span className="text-zinc-300 font-bold">
                    PR #{target.prNumber}
                  </span>
                </div>
              </div>
            )}
          </DialogHeader>

          {/* Action Tabs Bar with Horizontal Scroll */}
          <div className="flex items-center gap-2 mt-4 border-t border-zinc-900 pt-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('report')}
              disabled={loading}
              className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 shrink-0 rounded-none disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'report'
                  ? 'bg-white text-black font-bold shadow'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/60'
              }`}
            >
              <FileCode2 size={13} />
              <span>Review Report</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              disabled={loading}
              className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 shrink-0 rounded-none disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'chat'
                  ? 'bg-white text-black font-bold shadow'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/60'
              }`}
            >
              <MessageSquare size={13} />
              <span>PR Copilot Chat</span>
              {messages.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-zinc-800 text-[10px] text-zinc-300 rounded-full font-mono">
                  {messages.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('tests')}
              disabled={loading}
              className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 shrink-0 rounded-none disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'tests'
                  ? 'bg-white text-black font-bold shadow'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/60'
              }`}
            >
              <FlaskConical size={13} />
              <span>Unit Tests</span>
              {testSuite && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto min-h-0 bg-zinc-950">
          {loading ? (
            <ReviewPipelineProgress currentStageIndex={currentStageIndex} />
          ) : (
            <>
              {activeTab === 'report' && (
                <ReviewReportTab review={review} error={error} />
              )}

              {activeTab === 'chat' && (
                <ReviewCopilotTab
                  target={target}
                  messages={messages}
                  setMessages={setMessages}
                />
              )}

              {activeTab === 'tests' && (
                <ReviewTestsTab
                  target={target}
                  testSuite={testSuite}
                  setTestSuite={setTestSuite}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
