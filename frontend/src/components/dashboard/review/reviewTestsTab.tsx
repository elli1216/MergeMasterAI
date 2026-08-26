import { useState } from 'react'
import {
  FlaskConical,
  Sparkles,
  CheckCircle2,
  GitCommit,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import type { GeneratedTestSuite } from '~/lib/backend'
import { generatePrTests, pushPrTests } from '~/lib/backend'
import type { ReviewTarget } from './types'

type ReviewTestsTabProps = {
  target: ReviewTarget | null
  testSuite: GeneratedTestSuite | null
  setTestSuite: React.Dispatch<React.SetStateAction<GeneratedTestSuite | null>>
}

export function ReviewTestsTab({
  target,
  testSuite,
  setTestSuite,
}: ReviewTestsTabProps) {
  const [generatingTests, setGeneratingTests] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)
  const [pushingTests, setPushingTests] = useState(false)
  const [pushResult, setPushResult] = useState<string | null>(null)
  const [copiedTestCode, setCopiedTestCode] = useState(false)

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedTestCode(true)
    setTimeout(() => setCopiedTestCode(false), 2000)
  }

  const handleGenerateTests = async () => {
    if (!target || generatingTests) return
    setGeneratingTests(true)
    setTestError(null)
    setPushResult(null)

    try {
      const suite = await generatePrTests(
        target.repoName,
        target.prNumber,
        target.title,
      )
      setTestSuite(suite)
    } catch (err) {
      setTestError(err instanceof Error ? err.message : String(err))
    } finally {
      setGeneratingTests(false)
    }
  }

  const handlePushTests = async () => {
    if (!target || !testSuite || pushingTests) return
    setPushingTests(true)
    setPushResult(null)

    try {
      const res = await pushPrTests(
        target.repoName,
        target.prNumber,
        testSuite.test_file_path,
        testSuite.test_code,
      )
      const sha = res.commit_sha ? ` (SHA: ${res.commit_sha.slice(0, 7)})` : ''
      setPushResult(`Tests committed successfully${sha}`)
    } catch (err) {
      setPushResult(
        `Failed to push tests: ${err instanceof Error ? err.message : String(err)}`,
      )
    } finally {
      setPushingTests(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-black/40 p-4 sm:p-5 border border-zinc-800">
        <div>
          <h3 className="font-bold text-white font-sans text-sm sm:text-base flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-400" />
            Autonomous Test Suite Synthesizer
          </h3>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Analyzes touched functions and drafts test suites with assertions
            and edge cases
          </p>
        </div>
        <Button
          onClick={handleGenerateTests}
          disabled={generatingTests}
          className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase tracking-wider shrink-0 font-bold px-4 py-2"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          {generatingTests
            ? 'Drafting Tests...'
            : testSuite
              ? 'Regenerate Tests'
              : 'Generate Tests'}
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
              <Badge
                variant="outline"
                className="font-mono text-[10px] uppercase border-zinc-700 bg-zinc-900 text-zinc-300 rounded-none"
              >
                {testSuite.framework}
              </Badge>
              <code className="text-xs font-mono text-zinc-400 truncate">
                {testSuite.test_file_path}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleCopyText(testSuite.test_code)}
                variant="outline"
                size="sm"
                className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white rounded-none font-mono text-xs uppercase h-8 px-3"
              >
                {copiedTestCode ? (
                  <>
                    <Check size={12} className="text-emerald-400 mr-1" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} className="mr-1" />
                    <span>Copy Code</span>
                  </>
                )}
              </Button>
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
          </div>

          {testSuite.explanation && (
            <p className="text-xs sm:text-sm font-sans text-zinc-400 bg-zinc-900/40 p-3.5 border-l-2 border-zinc-700">
              {testSuite.explanation}
            </p>
          )}

          <textarea
            readOnly
            value={testSuite.test_code}
            className="w-full h-75 sm:h-95 md:h-112.5 bg-black border border-zinc-800 p-4 font-mono text-xs sm:text-sm text-zinc-300 focus:outline-none rounded-none resize-none leading-relaxed"
          />
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-zinc-800 bg-zinc-950/50">
          <FlaskConical className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
          <p className="font-mono text-xs text-zinc-400">
            No test suite drafted for this PR yet.
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            Click "Generate Tests" above to draft unit tests tailored to this PR
            diff.
          </p>
        </div>
      )}
    </div>
  )
}
