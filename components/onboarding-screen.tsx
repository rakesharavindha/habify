'use client'

import { Check, ChevronRight, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { MESS_OPTIONS, getMealMenu, MEAL_ORDER } from '@/lib/mess-data'
import { useHabits } from '@/components/habits-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function OnboardingScreen() {
  const { setMess } = useHabits()
  const [selected, setSelected] = useState<string | null>(null)

  const previewCount = selected
    ? MEAL_ORDER.reduce(
        (n, meal) => n + getMealMenu(selected, meal).items.length,
        0,
      )
    : 0

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-32 pt-10 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-xl shadow-primary/30">
          <UtensilsCrossed className="size-8" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          Welcome to Mealify
        </h1>
        <p className="mt-2 max-w-sm text-balance text-muted-foreground">
          Pick your mess to get today&apos;s menu, meal-time alarms, and reminders
          for your favourite dishes.
        </p>
      </div>

      <h2 className="mt-10 text-sm font-medium text-muted-foreground">
        Choose your mess
      </h2>
      <div className="mt-3 flex flex-col gap-2.5">
        {MESS_OPTIONS.map((m) => {
          const active = selected === m.value
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setSelected(m.value)}
              aria-pressed={active}
              className={cn(
                'state-layer flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
                active
                  ? 'border-primary bg-primary-container'
                  : 'border-border bg-surface-container-high',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/40',
                )}
              >
                {active && <Check className="size-4" />}
              </span>
              <span
                className={cn(
                  'flex-1 text-base font-medium',
                  active && 'text-on-primary-container',
                )}
              >
                {m.label}
              </span>
            </button>
          )
        })}
      </div>

      {selected && previewCount > 0 && (
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Menu found for this mess. You can change it anytime in settings.
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl">
          <Button
            disabled={!selected}
            onClick={() => selected && setMess(selected)}
            className="h-14 w-full rounded-2xl text-base font-semibold"
          >
            Continue
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
