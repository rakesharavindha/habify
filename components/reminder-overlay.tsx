'use client'

import { Check, Clock, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatTime } from '@/lib/habit-utils'
import { HabitIcon } from '@/components/habit-icon'
import { useHabits } from '@/components/habits-provider'
import { Button } from '@/components/ui/button'

const SNOOZE_OPTIONS = [5, 10, 30]

export function ReminderOverlay() {
  const { activeReminder, habits, dismissReminder, snoozeReminder } =
    useHabits()
  const [now, setNow] = useState(() => new Date())
  const [showSnooze, setShowSnooze] = useState(false)

  const habit = activeReminder
    ? habits.find((h) => h.id === activeReminder.habitId)
    : null

  useEffect(() => {
    if (!activeReminder) return
    setShowSnooze(false)
    const t = setInterval(() => setNow(new Date()), 1000)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([0, 220, 120, 220])
    }
    return () => clearInterval(t)
  }, [activeReminder])

  useEffect(() => {
    if (!activeReminder) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [activeReminder])

  if (!activeReminder || !habit) return null

  const clock = now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
  const dateLabel = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={`Reminder: ${habit.name}`}
      className="fixed inset-0 z-[100] flex animate-reminder-in flex-col overflow-hidden bg-background"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% -10%, var(--primary-container), transparent 60%)',
          opacity: 0.9,
        }}
      />

      <div className="relative flex items-center justify-between px-6 pt-8">
        <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Reminder
        </span>
        <button
          type="button"
          onClick={() => dismissReminder()}
          aria-label="Dismiss"
          className="state-layer flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-6" />
        </button>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="tabular-nums text-6xl font-extralight tracking-tight sm:text-7xl">
          {clock}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{dateLabel}</p>

        <div className="relative mt-12 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute size-32 animate-pulse-ring rounded-full bg-primary/30"
          />
          <span className="relative flex size-28 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30">
            <HabitIcon name={habit.icon} className="size-12" />
          </span>
        </div>

        <h1 className="mt-8 text-balance text-3xl font-semibold sm:text-4xl">
          {habit.name}
        </h1>
        {habit.note && (
          <p className="mt-2 max-w-sm text-balance text-base text-muted-foreground">
            {habit.note}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-sm font-medium text-muted-foreground">
          <Clock className="size-4" />
          Scheduled for {formatTime(activeReminder.time)}
        </span>
      </div>

      <div className="relative px-6 pb-10">
        {showSnooze ? (
          <div className="mx-auto flex max-w-md flex-col gap-3">
            <p className="text-center text-sm font-medium text-muted-foreground">
              Remind me again in
            </p>
            <div className="grid grid-cols-3 gap-3">
              {SNOOZE_OPTIONS.map((min) => (
                <Button
                  key={min}
                  variant="secondary"
                  onClick={() => snoozeReminder(min)}
                  className="h-14 rounded-2xl text-base font-semibold"
                >
                  {min} min
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowSnooze(false)}
              className="h-11 rounded-full"
            >
              Back
            </Button>
          </div>
        ) : (
          <div className="mx-auto flex max-w-md flex-col gap-3">
            <Button
              onClick={() => dismissReminder({ complete: true })}
              className="h-16 rounded-3xl text-lg font-semibold"
            >
              <Check className="size-6" />
              Mark done
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowSnooze(true)}
                className="h-14 rounded-2xl text-base font-medium"
              >
                Snooze
              </Button>
              <Button
                variant="ghost"
                onClick={() => dismissReminder()}
                className="h-14 rounded-2xl text-base font-medium"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
