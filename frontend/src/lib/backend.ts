export type Finding = {
  category: string
  severity: string
  file: string
  detail: string
}

export type AiReview = {
  repo_name: string | null
  pr_number: number | null
  status: string | null
  risk_score: number | null
  decision: string | null
  ai_summary: string | null
  reviewers: Array<string>
  findings: Array<Finding>
  head_sha: string | null
  remediation_note: string | null
  error: string | null
}

const BACKEND_URL: string = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

export async function requestAiReview(
  repoName: string,
  prNumber: number,
  signal?: AbortSignal
): Promise<AiReview> {
  const token = localStorage.getItem('github_oauth_access_token')

  const resp = await fetch(`${BACKEND_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo_name: repoName,
      pr_number: prNumber,
      github_token: token || null,
    }),
    signal,
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Backend review failed (${resp.status}): ${text.slice(0, 300)}`)
  }

  return (await resp.json()) as AiReview
}