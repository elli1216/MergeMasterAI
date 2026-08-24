import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@workos-inc/authkit-react'
import { AppLayout } from '~/components/appLayout'
import Loading from '~/components/common/Loading'

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <Loading />
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
