import { AlertCircle, AlertTriangle, ShieldAlert } from 'lucide-react'

export type ReviewTarget = {
  repoName: string
  prNumber: number
  title: string
}

export type ChatMessage = {
  sender: 'user' | 'ai'
  text: string
  time: string
}

export const SEVERITY_STYLES: Record<
  string,
  { badge: string; icon: any; color: string }
> = {
  critical: {
    badge: 'border-red-900 bg-red-950/50 text-red-400',
    icon: ShieldAlert,
    color: 'text-red-500',
  },
  high: {
    badge: 'border-orange-900 bg-orange-950/50 text-orange-400',
    icon: AlertCircle,
    color: 'text-orange-500',
  },
  medium: {
    badge: 'border-amber-900 bg-amber-950/50 text-amber-400',
    icon: AlertTriangle,
    color: 'text-amber-500',
  },
  low: {
    badge: 'border-zinc-800 bg-zinc-900/50 text-zinc-400',
    icon: AlertCircle,
    color: 'text-zinc-400',
  },
}

export const QUICK_PROMPTS = [
  {
    label: '⚡ Explain security findings',
    prompt: 'Can you explain the main security findings in this PR?',
  },
  {
    label: '⚡ How to resolve issues?',
    prompt: 'How should I resolve the flagged issues cleanly?',
  },
  {
    label: '⚡ Justify risk score',
    prompt: 'Why did this change receive this risk score?',
  },
]

export const STATUS_STYLES: Record<string, string> = {
  blocked: 'border-red-500/50 text-red-400 bg-red-950/20',
  approved: 'border-green-500/50 text-green-400 bg-green-950/20',
  pending: 'border-amber-500/50 text-amber-400 bg-amber-950/20 border-dashed',
  merged: 'border-purple-500/50 text-purple-400 bg-purple-950/20',
  closed: 'border-zinc-700 text-zinc-500 bg-zinc-900/50',
}

export function getRiskColor(score: number | null | undefined) {
  if (score == null) return 'text-zinc-500'
  if (score <= 25) return 'text-emerald-400'
  if (score <= 75) return 'text-amber-400'
  return 'text-red-400'
}

export function formatCopilotMessage(raw: string): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('```json') && trimmed.endsWith('```'))
  ) {
    try {
      const cleanJson = trimmed
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/, '')
        .trim()
      const parsed = JSON.parse(cleanJson)
      if (typeof parsed === 'string') return parsed
      if (parsed.answer && typeof parsed.answer === 'string')
        return parsed.answer
      if (parsed.response && typeof parsed.response === 'string')
        return parsed.response
      if (parsed.message && typeof parsed.message === 'string')
        return parsed.message
      if (parsed.explanation && typeof parsed.explanation === 'string')
        return parsed.explanation
      if (parsed.content && typeof parsed.content === 'string')
        return parsed.content
      return Object.entries(parsed)
        .map(
          ([k, v]) =>
            `**${k}**: ${typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}`,
        )
        .join('\n\n')
    } catch {
      // Not valid JSON, keep as raw string
    }
  }
  return raw
}
