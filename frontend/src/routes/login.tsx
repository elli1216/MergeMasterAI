import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@workos-inc/authkit-react'
import { LandingView } from '~/components/landing/landingView'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { signIn, signUp } = useAuth()

  return (
    <LandingView
      onSignIn={() => signIn()}
      onSignUp={() => signUp()}
    />
  )
}
