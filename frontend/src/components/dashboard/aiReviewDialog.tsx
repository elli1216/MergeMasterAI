'use client'

import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  FileCode2,
  UserCircle2,
  RefreshCcw,
  MessageSquare,
  FlaskConical,
  Send,
  GitCommit,
  Bot,
  User,
  Sparkles,
} from 'lucide-react'
import type { AiReview, GeneratedTestSuite } from '~/lib/backend'
import { askPrCopilot, generatePrTests, pushPrTests } from '~/lib/backend'
import { Badge } from '~/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

const SEVERITY_STYLES: Record<string, { badge: string; icon: any; color: string }> = {
  critical: { badge: 'border-red-900 bg-red-950/50 text-red-400', icon: ShieldAlert, color: 'text-red-500' },
  high: { badge: 'border-orange-900 bg-orange-950/50 text-orange-400', icon: AlertCircle, color: 'text-orange-500' },
  medium: { badge: 'border-amber-900 bg-amber-950/50 text-amber-400', icon: AlertTriangle, color: 'text-amber-500' },
  low: { badge: 'border-zinc-800 bg-zinc-900/50 text-zinc-400', icon: AlertCircle, color: 'text-zinc-400' },
}

const STATUS_STYLES: Record<string, string> = {
  blocked: 'border-red-500/50 text-red-400 bg-red-950/20',
  approved: 'border-green-500/50 text-green-400 bg-green-950/20',
  pending: 'border-amber-500/50 text-amber-400 bg-amber-950/20 border-dashed',
  merged: 'border-purple-500/50 text-purple-400 bg-purple-950/20',
  closed: 'border-zinc-700 text-zinc-500 bg-zinc-900/50',
}

function getRiskColor(score: number | null | undefined) {
  if (score == null) return 'text-zinc-500'
  if (score <= 25) return 'text-emerald-400'
  if (score <= 75) return 'text-amber-400'
  return 'text-red-400'
}

export type ReviewTarget = { repoName: string; prNumber: number; title: string }

type AiReviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: ReviewTarget | null
  review: AiReview | null
  loading: boolean
  error: string | null
  onReanalyze?: () => void
}

type ChatMessage = {
  sender: 'user' | 'ai'
  text: string
  time: string
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
  const [activeTab, setActiveTab] = useState<'report' | 'chat' | 'tests'>('report')

  // Chat State
  const [messages, setMessages] = useState<Array<ChatMessage>>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Test Generator State
  const [testSuite, setTestSuite] = useState<GeneratedTestSuite | null>(null)
  const [generatingTests, setGeneratingTests] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)
  const [pushingTests, setPushingTests] = useState(false)
  const [pushResult, setPushResult] = useState<string | null>(null)

  // Send a chat message to PR Copilot
  const handleSendMessage = async (customPrompt?: string) => {
    const text = customPrompt || chatInput.trim()
    if (!text || !target) return

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages((prev) => [...prev, { sender: 'user', text, time: now }])
    if (!customPrompt) setChatInput('')
    setChatLoading(true)

    try {
      const answer = await askPrCopilot(target.repoName, target.prNumber, text)
      setMessages((prev) => [...prev, { sender: 'ai', text: answer, time: now }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Error: ${err instanceof Error ? err.message : String(err)}`, time: now },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  // Generate unit tests for PR
  const handleGenerateTests = async () => {
    if (!target) return
    setGeneratingTests(true)
    setTestError(null)
    setPushResult(null)
    try {
      const result = await generatePrTests(target.repoName, target.prNumber, target.title)
      setTestSuite(result)
    } catch (err) {
      setTestError(err instanceof Error ? err.message : String(err))
    } finally {
      setGeneratingTests(false)
    }
  }

  // Push generated tests directly to PR branch
  const handlePushTests = async () => {
    if (!target || !testSuite) return
    setPushingTests(true)
    setPushResult(null)
    try {
      const res = await pushPrTests(target.repoName, target.prNumber, testSuite.test_file_path, testSuite.test_code)
      setPushResult(res.message)
    } catch (err) {
      setPushResult(`Push failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setPushingTests(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:w-[92vw] md:w-[88vw] lg:w-[84vw] xl:w-[80vw] 2xl:w-[74vw] sm:max-w-none md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl max-h-[94vh] sm:max-h-[90vh] bg-zinc-950 border border-zinc-800 text-zinc-50 p-0 rounded-none shadow-2xl flex flex-col overflow-hidden">
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

              {/* Re-analyze Action in Header */}
              {review && !loading && onReanalyze && (
                <div className="flex items-center gap-2 pt-1 sm:pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onReanalyze}
                    className="font-mono text-[10px] sm:text-xs uppercase tracking-wider bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-none transition-all flex items-center gap-1.5 h-8 px-3"
                  >
                    <RefreshCcw size={11} />
                    <span>Re-analyze</span>
                  </Button>
                </div>
              )}
            </div>

            {target && (
              <div className="flex flex-col gap-0.5 mt-3 text-left">
                <span className="text-white text-base sm:text-lg md:text-xl font-sans font-bold tracking-tight line-clamp-1">
                  {target.title}
                </span>
                <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs">
                  <span className="text-zinc-500">{target.repoName}</span>
                  <span className="text-zinc-700">•</span>
                  <span className="text-zinc-300 font-bold">PR #{target.prNumber}</span>
                </div>
              </div>
            )}
          </DialogHeader>

          {/* Action Tabs Bar with Horizontal Scroll */}
          <div className="flex items-center gap-2 mt-4 border-t border-zinc-900 pt-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 shrink-0 rounded-none ${
                activeTab === 'report' ? 'bg-white text-black font-bold shadow' : 'text-zinc-400 hover:text-white bg-zinc-900/60'
              }`}
            >
              <FileCode2 size={13} />
              <span>Review Report</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 shrink-0 rounded-none ${
                activeTab === 'chat' ? 'bg-white text-black font-bold shadow' : 'text-zinc-400 hover:text-white bg-zinc-900/60'
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
              className={`px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 shrink-0 rounded-none ${
                activeTab === 'tests' ? 'bg-white text-black font-bold shadow' : 'text-zinc-400 hover:text-white bg-zinc-900/60'
              }`}
            >
              <FlaskConical size={13} />
              <span>Unit Tests</span>
              {testSuite && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />}
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto min-h-0 bg-zinc-950">
          {/* TAB 1: REVIEW REPORT */}
          {activeTab === 'report' && (
            <>
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24">
                  <div className="relative flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full border-2 border-zinc-800"></div>
                    <div className="absolute h-16 w-16 rounded-full border-2 border-transparent border-t-white animate-spin"></div>
                    <div className="absolute h-10 w-10 bg-zinc-900 rounded-full animate-pulse"></div>
                  </div>
                  <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 animate-pulse text-center">
                    Analyzing Changes, RAG Memory & Enforcing Policies...
                  </p>
                </div>
              ) : error ? (
                <div className="space-y-4 py-16 text-center">
                  <ShieldAlert className="mx-auto h-12 w-12 text-red-500/50" />
                  <div>
                    <p className="font-mono text-sm uppercase tracking-widest text-red-400">Review Failed</p>
                    <p className="font-sans text-xs text-zinc-500 mt-2 max-w-md mx-auto">{error}</p>
                  </div>
                </div>
              ) : review ? (
                review.error ? (
                  <div className="border border-red-900/50 bg-red-950/20 p-6 text-center">
                    <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-3" />
                    <p className="font-mono text-sm text-red-400">{review.error}</p>
                    <p className="mt-2 font-sans text-xs text-zinc-500">
                      Ensure the backend can reach GitHub for this repository (App installed or valid tokens provided).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 sm:space-y-8">
                    {/* Top Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="p-5 border border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center text-center">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Risk Score</p>
                        <div className={`font-mono text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter ${getRiskColor(review.risk_score)}`}>
                          {review.risk_score ?? '--'}
                          <span className="text-xl lg:text-2xl text-zinc-600">%</span>
                        </div>
                      </div>

                      <div className="p-5 border border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center text-center">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Gate Status</p>
                        <Badge
                          variant="outline"
                          className={`px-3 py-1 font-mono text-xs uppercase tracking-widest rounded-none ${
                            STATUS_STYLES[review.status ?? ''] ?? 'border-zinc-800 text-zinc-600'
                          }`}
                        >
                          {review.status ?? 'unknown'}
                        </Badge>
                        {review.decision && (
                          <p className="mt-2 text-[10px] font-mono text-zinc-500">
                            Decision: <span className="text-zinc-300 uppercase">{review.decision}</span>
                          </p>
                        )}
                      </div>

                      <div className="p-5 border border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center text-center">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Reviewer Routing</p>
                        {review.reviewers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {review.reviewers.map((r) => (
                              <div
                                key={r}
                                className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-300 font-mono"
                              >
                                <UserCircle2 size={11} className="text-zinc-500" />
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-600 font-mono italic">No human review required</p>
                        )}
                      </div>
                    </div>

                    {/* AI Summary */}
                    {review.ai_summary && (
                      <div className="border-l-2 border-zinc-700 bg-black/40 p-4 sm:p-5">
                        <p className="font-sans text-xs sm:text-sm md:text-base leading-relaxed text-zinc-300">{review.ai_summary}</p>
                      </div>
                    )}

                    {/* Remediation Note if present */}
                    {review.remediation_note && (
                      <div className="flex gap-3 p-4 border border-amber-900/50 bg-amber-950/20">
                        <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-mono text-xs uppercase tracking-widest text-amber-400 mb-1">
                            Autonomous Remediation Pushed
                          </p>
                          <p className="font-sans text-xs sm:text-sm text-amber-200/90 leading-relaxed">{review.remediation_note}</p>
                        </div>
                      </div>
                    )}

                    {/* Findings Section - Responsive 2-column on large displays */}
                    <div className="space-y-4 pt-4 border-t border-zinc-900">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                          Detailed Findings & Violations
                        </p>
                        <Badge variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-800 font-mono text-[10px]">
                          {review.findings.length} Flagged
                        </Badge>
                      </div>

                      {review.findings.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-zinc-800 bg-zinc-950/50">
                          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400/60 mb-2" />
                          <p className="font-mono text-xs text-zinc-400">Clean code! Zero vulnerabilities or blockers detected.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {review.findings.map((finding, i) => {
                            const style = SEVERITY_STYLES[finding.severity.toLowerCase()] || SEVERITY_STYLES.low
                            const Icon = style.icon
                            return (
                              <div
                                key={`${finding.file}-${i}`}
                                className="border border-zinc-800/80 bg-zinc-900/30 p-4 space-y-2.5 hover:border-zinc-700 transition-colors flex flex-col justify-between"
                              >
                                <div className="space-y-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className={`font-mono text-[9px] uppercase tracking-wider ${style.badge} rounded-none`}
                                      >
                                        <Icon className="w-3 h-3 mr-1 inline" />
                                        {finding.severity}
                                      </Badge>
                                      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                                        {finding.category}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/60 border border-zinc-900 text-zinc-400 max-w-full sm:max-w-[240px]">
                                      <FileCode2 size={11} className="shrink-0" />
                                      <span className="truncate font-mono text-[10px]" title={finding.file}>
                                        {finding.file}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">{finding.detail}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : (
                <p className="py-16 text-center font-mono text-xs text-zinc-600">No review data available.</p>
              )}
            </>
          )}

          {/* TAB 2: PR COPILOT CHAT */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[54vh] sm:h-[60vh] md:h-[64vh] space-y-3">
              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-black/40 border border-zinc-800 rounded-none">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-600 space-y-4">
                    <Bot className="w-10 h-10 text-zinc-500" />
                    <div>
                      <p className="font-mono text-xs uppercase tracking-widest text-zinc-300">
                        Interactive PR Copilot
                      </p>
                      <p className="text-xs text-zinc-500 mt-1 max-w-md">
                        Ask questions about code changes, security risks, logic bugs, or proposed remediations.
                      </p>
                    </div>
                    {/* Suggested Quick Prompts */}
                    <div className="flex flex-wrap gap-2 justify-center pt-2 max-w-lg">
                      <button
                        onClick={() => handleSendMessage('Can you explain the main security findings in this PR?')}
                        className="text-[11px] font-mono bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white px-3 py-1.5 transition-colors"
                      >
                        ⚡ Explain security findings
                      </button>
                      <button
                        onClick={() => handleSendMessage('How should I resolve the flagged issues cleanly?')}
                        className="text-[11px] font-mono bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white px-3 py-1.5 transition-colors"
                      >
                        ⚡ How to resolve issues?
                      </button>
                      <button
                        onClick={() => handleSendMessage('Why did this change receive this risk score?')}
                        className="text-[11px] font-mono bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white px-3 py-1.5 transition-colors"
                      >
                        ⚡ Justify risk score
                      </button>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 text-xs sm:text-sm leading-relaxed ${
                        msg.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.sender === 'ai' && (
                        <div className="w-7 h-7 rounded-none bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-4 h-4 text-zinc-300" />
                        </div>
                      )}
                      <div
                        className={`p-3.5 max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-none ${
                          msg.sender === 'user'
                            ? 'bg-white text-black font-sans font-medium'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-200 font-sans'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <span
                          className={`text-[9px] font-mono block mt-1.5 ${
                            msg.sender === 'user' ? 'text-zinc-600 text-right' : 'text-zinc-500'
                          }`}
                        >
                          {msg.time}
                        </span>
                      </div>
                      {msg.sender === 'user' && (
                        <div className="w-7 h-7 rounded-none bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-zinc-400" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex gap-2 items-center text-xs font-mono text-zinc-400 animate-pulse p-2">
                    <Bot className="w-4 h-4 text-blue-400" />
                    <span>MergeMaster Copilot is thinking...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex gap-2 shrink-0"
              >
                <input
                  type="text"
                  placeholder="Ask a question about this PR..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  className="flex-1 bg-black border border-zinc-800 text-white font-sans text-xs sm:text-sm p-3.5 rounded-none focus:outline-none focus:border-zinc-500"
                />
                <Button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase px-5 h-auto"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          )}

          {/* TAB 3: AUTONOMOUS UNIT TESTS */}
          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-black/40 p-4 sm:p-5 border border-zinc-800">
                <div>
                  <h3 className="font-bold text-white font-sans text-sm sm:text-base flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-purple-400" />
                    Autonomous Test Suite Synthesizer
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Analyzes touched functions and drafts test suites with assertions and edge cases
                  </p>
                </div>
                <Button
                  onClick={handleGenerateTests}
                  disabled={generatingTests}
                  className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase tracking-wider shrink-0 font-bold px-4 py-2"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  {generatingTests ? 'Drafting Tests...' : testSuite ? 'Regenerate Tests' : 'Generate Tests'}
                </Button>
              </div>

              {testError && (
                <div className="p-3.5 bg-red-950/20 border border-red-900 text-red-400 text-xs font-mono">
                  {testError}
                </div>
              )}

              {pushResult && (
                <div className="p-3.5 bg-green-950/20 border border-green-900 text-green-400 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{pushResult}</span>
                </div>
              )}

              {generatingTests ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="h-12 w-12 rounded-full border-2 border-zinc-800 border-t-white animate-spin"></div>
                  <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 animate-pulse">
                    Synthesizing Test Scenarios & Assertions...
                  </p>
                </div>
              ) : testSuite ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] uppercase border-zinc-700 bg-zinc-900 text-zinc-300 rounded-none">
                        {testSuite.framework}
                      </Badge>
                      <code className="text-xs font-mono text-zinc-400 truncate">{testSuite.test_file_path}</code>
                    </div>
                    <Button
                      onClick={handlePushTests}
                      disabled={pushingTests}
                      size="sm"
                      className="bg-emerald-400 text-black hover:bg-emerald-300 rounded-none font-mono text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 h-8 px-3"
                    >
                      <GitCommit size={13} />
                      {pushingTests ? 'Pushing Commit...' : 'Push to PR Branch'}
                    </Button>
                  </div>

                  {testSuite.explanation && (
                    <p className="text-xs sm:text-sm font-sans text-zinc-400 bg-zinc-900/40 p-3.5 border-l-2 border-zinc-700">
                      {testSuite.explanation}
                    </p>
                  )}

                  <textarea
                    readOnly
                    value={testSuite.test_code}
                    className="w-full h-[300px] sm:h-[380px] md:h-[450px] bg-black border border-zinc-800 p-4 font-mono text-xs sm:text-sm text-zinc-300 focus:outline-none rounded-none resize-none leading-relaxed"
                  />
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-zinc-800 bg-zinc-950/50">
                  <FlaskConical className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                  <p className="font-mono text-xs text-zinc-400">No test suite drafted for this PR yet.</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Click "Generate Tests" above to draft unit tests tailored to this PR diff.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}