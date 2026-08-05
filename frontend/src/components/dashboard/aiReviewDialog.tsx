'use client'

import { useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, FileCode2, UserCircle2, RefreshCcw } from 'lucide-react'
import type { AiReview } from '~/lib/backend'
import { Badge } from '~/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

const SEVERITY_STYLES: Record<string, { badge: string, icon: any, color: string }> = {
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
    if (score <= 25) return 'text-white'
    if (score <= 75) return 'text-orange-500'
    return 'text-red-500'
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
    onSaveMarkdown?: (md: string) => Promise<void>
}

export function AiReviewDialog({
    open,
    onOpenChange,
    target,
    review,
    loading,
    error,
    onReanalyze,
    onSaveMarkdown,
}: AiReviewDialogProps) {
    const [copied, setCopied] = useState(false)
    const [showMarkdown, setShowMarkdown] = useState(false)
    const [saving, setSaving] = useState(false)

    const generateMarkdown = () => {
        if (!review) return ''
        return [
            `## 🤖 MergeMaster AI Review`,
            `**Risk Score:** ${review.risk_score}% | **Status:** ${review.status?.toUpperCase()}`,
            `> ${review.ai_summary}`,
            ``,
            ...(review.reviewers.length > 0 ? [`**Recommended Reviewers:** ${review.reviewers.join(', ')}`, ``] : []),
            ...(review.findings.length > 0 ? [
                `### 🔍 Findings`,
                ...review.findings.map(f => `- **[${f.severity.toUpperCase()}]** \`${f.file}\`: ${f.detail}`),
                ``
            ] : []),
        ].join('\n')
    }

    const handleCopyMarkdown = () => {
        navigator.clipboard.writeText(generateMarkdown())
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSaveMarkdown = async () => {
        if (!onSaveMarkdown) return
        setSaving(true)
        try {
            await onSaveMarkdown(generateMarkdown())
        } finally {
            setSaving(false)
            setShowMarkdown(false)
        }
    }

    // Reset view when dialog closes or opens
    if (!open && showMarkdown) {
        setTimeout(() => setShowMarkdown(false), 200)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full md:min-w-3xl bg-[#0a0a0a] border-zinc-800 text-zinc-50 p-0 overflow-hidden shadow-2xl">
                <div className="border-b border-zinc-800 p-6 relative">
                    <DialogHeader>
                        <DialogTitle className="font-mono text-sm uppercase tracking-widest text-zinc-500">
                            AI Analysis Report
                        </DialogTitle>
                        <DialogDescription asChild>
                            {target ? (
                                <div className="flex flex-col gap-1 mt-2">
                                    <span className="text-white text-lg font-sans">{target.title}</span>
                                    <div className="flex items-center gap-3 font-mono text-xs">
                                        <span className="text-zinc-500">{target.repoName}</span>
                                        <span className="text-zinc-700">•</span>
                                        <span className="text-zinc-400">PR #{target.prNumber}</span>
                                    </div>
                                </div>
                            ) : (
                                'Pull request review'
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    {review && !loading && (
                        <div className="absolute top-6 right-6 flex items-center gap-2">
                            {!showMarkdown ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowMarkdown(true)}
                                    className="font-mono text-xs uppercase tracking-widest bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-none transition-all flex items-center gap-2"
                                >
                                    <FileCode2 size={12} />
                                    Format Markdown
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowMarkdown(false)}
                                    className="font-mono text-xs uppercase tracking-widest bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-none transition-all flex items-center gap-2"
                                >
                                    Close Preview
                                </Button>
                            )}
                            {onReanalyze && !showMarkdown && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onReanalyze}
                                    className="font-mono text-xs uppercase tracking-widest bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-none transition-all flex items-center gap-2"
                                >
                                    <RefreshCcw size={12} />
                                    Re-analyze
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-24">
                            <div className="relative flex items-center justify-center">
                                <div className="h-16 w-16 rounded-full border-2 border-zinc-800"></div>
                                <div className="absolute h-16 w-16 rounded-full border-2 border-transparent border-t-white animate-spin"></div>
                                <div className="absolute h-10 w-10 bg-zinc-900 rounded-full animate-pulse"></div>
                            </div>
                            <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 animate-pulse">
                                Analyzing Changes...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="space-y-4 py-16 text-center">
                            <ShieldAlert className="mx-auto h-12 w-12 text-red-500/50" />
                            <div>
                                <p className="font-mono text-sm uppercase tracking-widest text-red-400">Review Failed</p>
                                <p className="font-sans text-sm text-zinc-500 mt-2 max-w-md mx-auto">{error}</p>
                            </div>
                        </div>
                    ) : review ? (
                        review.error ? (
                            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-center">
                                <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-4" />
                                <p className="font-mono text-sm text-red-400">{review.error}</p>
                                <p className="mt-2 font-sans text-xs text-zinc-500">
                                    Ensure the backend can reach GitHub for this repository (App installed or valid tokens provided).
                                </p>
                            </div>
                        ) : showMarkdown ? (
                            <div className="space-y-4">
                                <textarea
                                    readOnly
                                    value={generateMarkdown()}
                                    className="w-full h-[400px] bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 rounded-none resize-none"
                                />
                                <div className="flex justify-end gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={handleCopyMarkdown}
                                        className="font-mono text-xs uppercase tracking-widest bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-none transition-all flex items-center gap-2"
                                    >
                                        {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <FileCode2 size={14} />}
                                        {copied ? 'Copied to Clipboard' : 'Copy to Clipboard'}
                                    </Button>
                                    {onSaveMarkdown && (
                                        <Button
                                            onClick={handleSaveMarkdown}
                                            disabled={saving}
                                            className="font-mono text-xs uppercase tracking-widest bg-white text-black hover:bg-zinc-200 rounded-none transition-all"
                                        >
                                            {saving ? 'Saving...' : 'Save to Convex DB'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Top Metrics Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/20 flex flex-col items-center justify-center text-center">
                                        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Risk Score</p>
                                        <div className={`font-mono text-5xl font-light tracking-tighter ${getRiskColor(review.risk_score)}`}>
                                            {review.risk_score ?? '--'}
                                            <span className="text-2xl text-zinc-600">%</span>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/20 flex flex-col items-center justify-center text-center">
                                        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Status</p>
                                        <Badge
                                            variant="outline"
                                            className={`px-4 py-1.5 font-mono text-xs uppercase tracking-widest rounded-full ${STATUS_STYLES[review.status ?? ''] ?? 'border-zinc-800 text-zinc-600'
                                                }`}
                                        >
                                            {review.status ?? 'unknown'}
                                        </Badge>
                                        {review.decision && (
                                            <p className="mt-3 text-[10px] font-mono text-zinc-600">
                                                AI Decision: <span className="text-zinc-400">{review.decision}</span>
                                            </p>
                                        )}
                                    </div>

                                    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/20 flex flex-col items-center justify-center text-center">
                                        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Routing</p>
                                        {review.reviewers.length > 0 ? (
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                {review.reviewers.map(r => (
                                                    <div key={r} className="flex items-center gap-1.5 bg-zinc-800/50 px-2.5 py-1 rounded-full text-xs text-zinc-300 font-mono">
                                                        <UserCircle2 size={12} className="text-zinc-500" />
                                                        {r}
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
                                    <div className="relative">
                                        <div className="absolute -left-3 top-0 bottom-0 w-1 bg-zinc-800 rounded-full"></div>
                                        <p className="font-sans text-sm leading-relaxed text-zinc-300 pl-4">
                                            {review.ai_summary}
                                        </p>
                                    </div>
                                )}

                                {/* Remediation */}
                                {review.remediation_note && (
                                    <div className="flex gap-4 p-4 rounded-lg border border-amber-900/50 bg-amber-950/20">
                                        <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-mono text-xs uppercase tracking-widest text-amber-500 mb-1">Autonomous Remediation</p>
                                            <p className="font-sans text-sm text-amber-200/80">{review.remediation_note}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Findings Section */}
                                <div className="space-y-4 pt-4 border-t border-zinc-900">
                                    <div className="flex items-center justify-between">
                                        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                                            Detailed Findings
                                        </p>
                                        <Badge variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-800 font-mono">
                                            {review.findings.length}
                                        </Badge>
                                    </div>

                                    {review.findings.length === 0 ? (
                                        <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg">
                                            <CheckCircle2 className="mx-auto h-8 w-8 text-green-500/50 mb-2" />
                                            <p className="font-mono text-xs text-zinc-500">Code looks solid. No risks detected.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {review.findings.map((finding, i) => {
                                                const style = SEVERITY_STYLES[finding.severity.toLowerCase()] || SEVERITY_STYLES.low;
                                                const Icon = style.icon;
                                                return (
                                                    <div key={`${finding.file}-${i}`} className="group relative rounded-lg border border-zinc-800/50 bg-zinc-900/20 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-800/30">
                                                        <div className="flex items-start justify-between gap-4 mb-2">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <Badge variant="outline" className={`font-mono text-[9px] uppercase tracking-wider ${style.badge}`}>
                                                                    <Icon className="w-3 h-3 mr-1 inline" />
                                                                    {finding.severity}
                                                                </Badge>
                                                                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                                                                    {finding.category}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-black/50 rounded text-zinc-500 max-w-[50%]">
                                                                <FileCode2 size={12} className="shrink-0" />
                                                                <span className="truncate font-mono text-[10px]">{finding.file}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-zinc-300 font-sans leading-relaxed">
                                                            {finding.detail}
                                                        </p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    ) : (
                        <p className="py-12 text-center font-mono text-xs text-zinc-600">No review data available.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}