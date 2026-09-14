'use client'

import { HomeScreen } from '@/components/home-screen'
import { OnboardingScreen } from '@/components/onboarding-screen'
import { useHabits } from '@/components/habits-provider'

export default function Page() {
  const { ready, onboarded } = useHabits()

  return (
    <main className="min-h-dvh bg-background text-foreground">
      {ready && (onboarded ? <HomeScreen /> : <OnboardingScreen />)}
    </main>
  )
}
