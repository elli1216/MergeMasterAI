import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Shield } from 'lucide-react'

export const Route = createFileRoute('/callback')({
  component: CallbackPage,
})

function CallbackPage() {
  // If you are using the @workos-inc/authkit-react SDK, the <AuthKitProvider> 
  // will typically handle the code exchange automatically when it detects the /callback route.
  
  // If you are doing manual verification via FastAPI, you would extract the code like this:
  useEffect(() => {
    /*
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
       // Exchange code with your FastAPI backend here
    }
    */
  }, [])

  return (
    <div className="min-h-screen bg-black text-zinc-50 flex flex-col items-center justify-center font-sans selection:bg-white selection:text-black p-8">
      <div className="w-full max-w-md border border-zinc-800 bg-zinc-950 p-12 space-y-8 shadow-2xl flex flex-col items-center text-center">
        <div className="p-4 bg-white text-black rounded-none animate-pulse">
          <Shield className="w-10 h-10 stroke-[1.5]" />
        </div>
        <div className="space-y-3">
          <h1 className="text-xl font-extrabold tracking-tight text-white uppercase tracking-widest">
            Verifying Credentials
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
            Establishing secure connection...
          </p>
        </div>
      </div>
    </div>
  )
}
