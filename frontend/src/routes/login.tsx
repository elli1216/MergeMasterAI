import { createFileRoute } from '@tanstack/react-router'
import { Shield, Key } from 'lucide-react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  // Normally here you'd trigger WorkOS AuthKit's signIn()
  return (
    <div className="min-h-screen bg-black text-zinc-50 flex flex-col items-center justify-center font-sans selection:bg-white selection:text-black p-8">
      <div className="w-full max-w-md border border-zinc-800 bg-zinc-950 p-12 space-y-8 shadow-2xl rounded-none">
        <div className="flex flex-col items-center text-center space-y-6 border-b border-zinc-800 pb-8">
          <div className="p-4 bg-white text-black rounded-none">
            <Shield className="w-10 h-10 stroke-[1.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase tracking-widest">Authentication</h1>
            <p className="text-zinc-500 font-mono text-xs mt-2 uppercase">Secure Access Protocol</p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <button className="w-full bg-white text-black py-4 px-4 font-mono text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-3">
            <span>Sign in with GitHub (WorkOS)</span>
          </button>

          <button className="w-full bg-transparent border border-zinc-700 text-zinc-300 py-4 px-4 font-mono text-xs uppercase tracking-widest hover:bg-zinc-900 transition-all flex items-center justify-center gap-3">
            <Key className="w-4 h-4" />
            <span>Enterprise SSO</span>
          </button>
        </div>

        <div className="text-center pt-4">
          <p className="text-zinc-600 font-serif italic text-xs leading-relaxed">
            By authenticating, you agree to the MergeMaster <br /> automated deployment protocols.
          </p>
        </div>
      </div>
    </div>
  )
}
