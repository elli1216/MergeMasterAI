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

export type GeneratedTestSuite = {
  test_file_path: string
  framework: string
  test_code: string
  explanation: string
}

const BACKEND_URL: string = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

export async function requestAiReview(
  repoName: string,
  prNumber: number,
  signal?: AbortSignal,
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

export async function askPrCopilot(
  repoName: string,
  prNumber: number,
  question: string,
  signal?: AbortSignal,
): Promise<string> {
  const token = localStorage.getItem('github_oauth_access_token')

  const resp = await fetch(`${BACKEND_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo_name: repoName,
      pr_number: prNumber,
      question,
      github_token: token || null,
    }),
    signal,
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`AI Copilot query failed (${resp.status}): ${text.slice(0, 300)}`)
  }

  const data = (await resp.json()) as { answer: string }
  return data.answer
}

export async function generatePrTests(
  repoName: string,
  prNumber: number,
  title?: string,
  signal?: AbortSignal,
): Promise<GeneratedTestSuite> {
  const token = localStorage.getItem('github_oauth_access_token')

  const resp = await fetch(`${BACKEND_URL}/api/generate-tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo_name: repoName,
      pr_number: prNumber,
      title: title || '',
      github_token: token || null,
    }),
    signal,
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Test generation failed (${resp.status}): ${text.slice(0, 300)}`)
  }

  return (await resp.json()) as GeneratedTestSuite
}

export async function pushPrTests(
  repoName: string,
  prNumber: number,
  testFilePath: string,
  testCode: string,
  signal?: AbortSignal,
): Promise<{ commit_sha: string | null; message: string }> {
  const token = localStorage.getItem('github_oauth_access_token')

  const resp = await fetch(`${BACKEND_URL}/api/push-tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo_name: repoName,
      pr_number: prNumber,
      test_file_path: testFilePath,
      test_code: testCode,
      github_token: token || null,
    }),
    signal,
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Failed to push tests (${resp.status}): ${text.slice(0, 300)}`)
  }

  return (await resp.json()) as { commit_sha: string | null; message: string }
}