import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@workos-inc/authkit-react'
import Loading from '~/components/common/Loading'
import { PoliciesPanel } from '~/components/dashboard'

export const Route = createFileRoute('/_dashboard/policies')({
  component: PoliciesPage,
})

function PoliciesPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <Loading />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p>Unauthorized. Please return to the homepage to log in.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      <PoliciesPanel showHero={true} />
    </div>
  )
}
