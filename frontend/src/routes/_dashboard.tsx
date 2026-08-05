import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@workos-inc/authkit-react'
import { AppLayout } from '~/components/appLayout'

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-mono uppercase tracking-widest text-xs animate-pulse">Loading System...</div>
      </div>
    )
  }

  // If there's no user, we don't render the dashboard layout (sidebar/header)
  // Instead, we just render the Outlet, which will render the LandingPage on the '/' route.
  if (!user) {
    return <Outlet />
  }

  // Authenticated users get the persistent AppLayout
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
