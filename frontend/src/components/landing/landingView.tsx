import { useState } from 'react'
import {
  Shield,
  Bot,
  Cpu,
  GitPullRequest,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Code2,
  BarChart3,
  Users,
  ChevronDown,
  Flame,
  Check,
} from 'lucide-react'

type LandingViewProps = {
  onSignIn: () => void
  onSignUp?: () => void
}

export function LandingView({ onSignIn, onSignUp }: LandingViewProps) {
  const [activeTab, setActiveTab] = useState<'remediation' | 'copilot' | 'tests' | 'routing'>('remediation')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleAuth = onSignUp || onSignIn

  const faqs = [
    {
      q: 'How is MergeMaster AI different from GitHub Copilot or standard linters?',
      a: 'Standard tools only leave passive suggestions, forcing engineers to manually switch context and write the fixes. MergeMaster AI is an autonomous co-worker: it directly drafts and commits surgical vulnerability fixes to your branch, synthesizes unit tests, assigns domain-expert reviewers, and strictly enforces commit-status merge gates.',
    },
    {
      q: 'Can MergeMaster AI push code directly without human permission?',
      a: 'The Committer Agent acts as a peer contributor—it pushes fixes to the PR branch where they trigger standard CI/CD checks and are subject to normal human review, while the Gatekeeper autonomously sets commit status checks based on risk scoring.',
    },
    {
      q: 'How does the custom organizational policy engine work?',
      a: 'Engineering leaders can configure organization-wide coding constraints (e.g., "Always sanitize database inputs", "Require try/catch on external API calls") via our dashboard. These policies are dynamically retrieved and injected into the multi-agent reasoning prompt for all PR diffs.',
    },
    {
      q: 'What LLM models and agent frameworks power MergeMaster AI?',
      a: 'MergeMaster is built on LangGraph (Python) state graphs and uses Google Gemini models for structured JSON reasoning, with a deterministic heuristics fallback engine to ensure offline resilience and prompt-injection safety.',
    },
  ]

  return (
    <div className="min-h-screen bg-black text-zinc-50 font-sans selection:bg-white selection:text-black flex flex-col">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-zinc-950 border-b border-zinc-800/80 px-4 py-2 text-center text-xs font-mono flex items-center justify-center gap-2 text-zinc-400">
        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 text-[10px] uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
          IBM AI Builders Challenge
        </span>
        <span className="hidden sm:inline text-zinc-500">//</span>
        <span className="text-zinc-300">Wild Card Category: Autonomous Developer Productivity & Release Governance</span>
      </div>

      {/* 2. NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/mergemaster.png" alt="MergeMaster Logo" className="w-8 h-8 rounded-none border border-zinc-700 shadow-md" />
          <div className="flex flex-col">
            <span className="font-extrabold tracking-widest text-white uppercase text-base">MergeMaster</span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest -mt-1">Autonomous AI Co-Worker</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-widest text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#simulation" className="hover:text-white transition-colors">Live Simulation</a>
          <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onSignIn}
            className="bg-white text-black px-5 py-2.5 text-xs font-mono uppercase tracking-widest font-bold hover:bg-zinc-200 transition-all border border-white"
          >
            Launch Console
          </button>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-6 max-w-6xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Next-Gen PR Orchestration & Deployment Gatekeeper</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extralight tracking-tight text-white leading-tight">
          Your Autonomous <br />
          <span className="font-serif italic font-normal text-zinc-400">Engineering Co-Worker</span>
        </h1>

        <p className="text-zinc-400 font-mono text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
          MergeMaster AI evaluates pull requests in real time, autonomously pushes surgical remediation commits for critical vulnerabilities, synthesizes unit tests, enforces organizational policies, and routes domain-expert reviewers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={handleAuth}
            className="w-full sm:w-auto bg-white text-black px-8 py-4 text-xs font-mono uppercase tracking-widest font-bold hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            <GitPullRequest className="w-4 h-4" />
            <span>Connect GitHub & Start</span>
          </button>
          <a
            href="#simulation"
            className="w-full sm:w-auto border border-zinc-700 bg-zinc-950 text-zinc-300 px-8 py-4 text-xs font-mono uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <span>Explore Demo Workflow</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Quantifiable Impact Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-zinc-900 text-left">
          <div className="p-4 bg-zinc-950/60 border border-zinc-900">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white">85%</div>
            <div className="text-[11px] font-mono text-zinc-500 uppercase mt-1">Faster PR Turnaround</div>
          </div>
          <div className="p-4 bg-zinc-950/60 border border-zinc-900">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400">2.5 hrs</div>
            <div className="text-[11px] font-mono text-zinc-500 uppercase mt-1">Saved Per Remediated PR</div>
          </div>
          <div className="p-4 bg-zinc-950/60 border border-zinc-900">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-red-400">100%</div>
            <div className="text-[11px] font-mono text-zinc-500 uppercase mt-1">Secret Leakage Blocked</div>
          </div>
          <div className="p-4 bg-zinc-950/60 border border-zinc-900">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-blue-400">&lt; 3.5s</div>
            <div className="text-[11px] font-mono text-zinc-500 uppercase mt-1">AI Decision Latency</div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE LIVE SIMULATION MOCKUP */}
      <section id="simulation" className="py-16 px-6 bg-zinc-950/80 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">Autonomous Workflow Preview</p>
            <h2 className="text-2xl sm:text-4xl font-light text-white tracking-tight">
              Watch MergeMaster AI in Action
            </h2>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap justify-center gap-2 border-b border-zinc-900 pb-4">
            <button
              onClick={() => setActiveTab('remediation')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
                activeTab === 'remediation'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/60'
              }`}
            >
              1. Committer Agent Fix
            </button>
            <button
              onClick={() => setActiveTab('copilot')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
                activeTab === 'copilot'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/60'
              }`}
            >
              2. Interactive PR Copilot
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
                activeTab === 'tests'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/60'
              }`}
            >
              3. Test Synthesizer
            </button>
            <button
              onClick={() => setActiveTab('routing')}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
                activeTab === 'routing'
                  ? 'bg-white text-black font-bold'
                  : 'text-zinc-400 hover:text-white bg-zinc-900/60'
              }`}
            >
              4. Release Gate Enforcement
            </button>
          </div>

          {/* Interactive Showcase Box */}
          <div className="border border-zinc-800 bg-black p-6 md:p-8 font-mono text-xs shadow-2xl">
            {activeTab === 'remediation' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span className="text-white font-bold">PR #142: Fix Auth Token Expiry</span>
                    <span className="text-red-400 bg-red-950/40 border border-red-800/40 px-2 py-0.5 text-[10px]">
                      CRITICAL RISK (94%)
                    </span>
                  </div>
                  <span className="text-zinc-500 text-[10px]">committer_agent.py</span>
                </div>

                <div className="bg-zinc-950 p-4 border border-zinc-900 space-y-2">
                  <p className="text-zinc-500">// Detected vulnerable hardcoded secret in src/auth/token.ts:</p>
                  <p className="text-red-400 bg-red-950/20 p-2 border-l-2 border-red-500">
                    - const JWT_SECRET = "super_secret_production_key_12345"
                  </p>
                  <p className="text-emerald-400 bg-emerald-950/20 p-2 border-l-2 border-emerald-500">
                    + const JWT_SECRET = process.env.JWT_SECRET || ""
                  </p>
                </div>

                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/20 p-3 border border-emerald-900/40">
                  <Check className="w-4 h-4" />
                  <span>
                    <strong>Autonomous Action:</strong> Committer Agent pushed commit <code>a8f4c12</code> directly to <code>feat/auth-expiry</code> branch.
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'copilot' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-bold">Interactive PR Copilot Session</span>
                  </div>
                  <span className="text-zinc-500 text-[10px]">POST /api/chat</span>
                </div>

                <div className="space-y-3">
                  <div className="bg-zinc-900/50 p-3 border border-zinc-800 text-zinc-300">
                    <span className="text-zinc-500 uppercase text-[10px] block mb-1">Developer:</span>
                    "Why was this pull request flagged for medium SQL risk in user_service.py?"
                  </div>
                  <div className="bg-zinc-950 p-3 border border-blue-900/40 text-blue-200">
                    <span className="text-blue-400 uppercase text-[10px] block mb-1">MergeMaster Copilot:</span>
                    "Line 48 concatenates <code>user_id</code> directly into raw query string. Replace with parameterized SQL placeholders (e.g. <code>db.execute(..., (user_id,))</code>) to comply with organizational policy <strong>#POL-02 (SQL Sanitation)</strong>."
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span className="text-white font-bold">Synthesized Unit Test Suite</span>
                  </div>
                  <span className="text-zinc-500 text-[10px]">POST /api/generate-tests</span>
                </div>

                <pre className="bg-zinc-950 p-4 border border-zinc-900 text-zinc-300 overflow-x-auto text-[11px] leading-relaxed">
{`import { validateApiKey, sanitizeInput } from '../src/auth/validator'

describe('Auth Validation Suite (Synthesized by MergeMaster)', () => {
  it('should reject malformed API keys with 401', () => {
    expect(() => validateApiKey('invalid_key')).toThrow()
  })

  it('should sanitize SQL injection characters from username input', () => {
    const clean = sanitizeInput("admin' OR '1'='1")
    expect(clean).not.toContain("'")
  })
})`}
                </pre>

                <div className="flex justify-end">
                  <button className="bg-white text-black px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-zinc-200">
                    One-Click Push to Branch
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'routing' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-white font-bold">GitHub Commit Status Gate & Reviewer Routing</span>
                  </div>
                  <span className="text-zinc-500 text-[10px]">PyGithub API</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-950 border border-zinc-900 space-y-2">
                    <span className="text-zinc-500 text-[10px] uppercase">Commit Status Check</span>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>MergeMaster Gate: SUCCESS (Passed)</span>
                    </div>
                    <p className="text-zinc-500 text-[10px]">Risk Score: 12% // Policy Compliant</p>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-900 space-y-2">
                    <span className="text-zinc-500 text-[10px] uppercase">Reviewers Assigned</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-zinc-300 text-[10px]">
                        @DatabaseLead (rule: schema.prisma)
                      </span>
                      <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-zinc-300 text-[10px]">
                        @SecurityArchitect (rule: src/auth/*)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. SIX CORE CAPABILITIES */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">Autonomous Capabilities</p>
          <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
            Engineered for Modern Engineering Teams
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1 */}
          <div className="p-6 bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-all space-y-4">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Autonomous Remediation</h3>
            <p className="text-zinc-400 font-mono text-xs leading-relaxed">
              When high-risk vulnerabilities are found, the Committer Agent crafts surgical patches and commits them directly to the PR branch via PyGithub.
            </p>
          </div>

          {/* 2 */}
          <div className="p-6 bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-all space-y-4">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Interactive PR Copilot</h3>
            <p className="text-zinc-400 font-mono text-xs leading-relaxed">
              Developers can chat with the PR Copilot to inspect security findings, understand architectural risks, and receive immediate code advice.
            </p>
          </div>

          {/* 3 */}
          <div className="p-6 bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-all space-y-4">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Unit Test Synthesizer</h3>
            <p className="text-zinc-400 font-mono text-xs leading-relaxed">
              Automatically creates comprehensive test suites (PyTest, Jest, Vitest) covering edge cases and exception branches with a 1-click commit pusher.
            </p>
          </div>

          {/* 4 */}
          <div className="p-6 bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-all space-y-4">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Organizational Policies</h3>
            <p className="text-zinc-400 font-mono text-xs leading-relaxed">
              Enforce enterprise security and style guidelines dynamically. Custom organizational rules are injected into every automated PR diff analysis.
            </p>
          </div>

          {/* 5 */}
          <div className="p-6 bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-all space-y-4">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Smart Reviewer Routing</h3>
            <p className="text-zinc-400 font-mono text-xs leading-relaxed">
              Eliminate alert fatigue. Map file patterns like <code>*.sql</code>, <code>schema.prisma</code>, or <code>src/auth/*</code> to designated specialist reviewers.
            </p>
          </div>

          {/* 6 */}
          <div className="p-6 bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-all space-y-4">
            <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <BarChart3 className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Executive ROI Analytics</h3>
            <p className="text-zinc-400 font-mono text-xs leading-relaxed">
              Track real-time hours saved across all monitored repositories, review risk distribution brackets, and audit automated gate decisions.
            </p>
          </div>
        </div>
      </section>

      {/* 6. FOUR-STAGE MULTI-AGENT ARCHITECTURE */}
      <section id="architecture" className="py-20 px-6 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">Pipeline Engineering</p>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              Under the Hood: LangGraph Pipeline
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-black border border-zinc-800 space-y-3 relative">
              <div className="text-zinc-600 font-mono text-3xl font-bold">01</div>
              <h4 className="text-sm font-bold text-white uppercase font-mono">Webhook Ingestion</h4>
              <p className="text-zinc-500 text-xs font-mono leading-relaxed">
                FastAPI validates HMAC-SHA256 signatures on <code>pull_request</code> events and launches asynchronous background tasks.
              </p>
            </div>

            <div className="p-6 bg-black border border-zinc-800 space-y-3 relative">
              <div className="text-zinc-600 font-mono text-3xl font-bold">02</div>
              <h4 className="text-sm font-bold text-white uppercase font-mono">Diff & Semantic RAG</h4>
              <p className="text-zinc-500 text-xs font-mono leading-relaxed">
                Prunes lockfile noise and retrieves historical security learnings to construct token-optimized prompts for Gemini models.
              </p>
            </div>

            <div className="p-6 bg-black border border-zinc-800 space-y-3 relative">
              <div className="text-zinc-600 font-mono text-3xl font-bold">03</div>
              <h4 className="text-sm font-bold text-white uppercase font-mono">Autonomous Execution</h4>
              <p className="text-zinc-500 text-xs font-mono leading-relaxed">
                Branches to Committer Agent if vulnerabilities are critical; otherwise executes reviewer routing and commit status merge checks.
              </p>
            </div>

            <div className="p-6 bg-black border border-zinc-800 space-y-3 relative">
              <div className="text-zinc-600 font-mono text-3xl font-bold">04</div>
              <h4 className="text-sm font-bold text-white uppercase font-mono">Real-Time Sync</h4>
              <p className="text-zinc-500 text-xs font-mono leading-relaxed">
                Writes scores, Markdown reports, and decision logs to Convex Cloud, instantly rendering across the TanStack dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-20 px-6 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">Clarifications</p>
          <h2 className="text-2xl sm:text-4xl font-light text-white tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-zinc-800 bg-zinc-950">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between font-mono text-xs sm:text-sm text-zinc-200 hover:text-white"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === idx ? 'rotate-180 text-white' : 'text-zinc-500'}`} />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 font-mono text-xs text-zinc-400 leading-relaxed border-t border-zinc-900 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. BOTTOM CALL TO ACTION */}
      <section className="py-20 px-6 border-t border-zinc-900 bg-gradient-to-b from-black to-zinc-950 text-center space-y-6">
        <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
          Ready to Automate Your Deployment Gates?
        </h2>
        <p className="text-zinc-400 font-mono text-xs sm:text-sm max-w-xl mx-auto">
          Install the MergeMaster GitHub App on your repositories and start enjoying autonomous code reviews and remediation in minutes.
        </p>
        <button
          onClick={handleAuth}
          className="bg-white text-black px-10 py-4 text-xs font-mono uppercase tracking-widest font-bold hover:bg-zinc-200 transition-all inline-flex items-center gap-3 shadow-2xl"
        >
          <GitPullRequest className="w-4 h-4" />
          <span>Launch MergeMaster Console</span>
        </button>
      </section>

      {/* 9. FOOTER */}
      <footer className="border-t border-zinc-900 px-6 py-8 text-center text-xs font-mono text-zinc-600 flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto w-full gap-4">
        <div>
          © 2026 MergeMaster AI. Built for the <strong>IBM AI Builders Challenge</strong>.
        </div>
        <div className="flex items-center gap-6 text-zinc-500">
          <a href="https://github.com/elli1216/MergeMasterAI" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
            GitHub Repository
          </a>
          <span>//</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            System Operational
          </span>
        </div>
      </footer>
    </div>
  )
}
