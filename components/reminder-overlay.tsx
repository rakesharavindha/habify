'use client'

import {
  Check,
  Clock,
  Coffee,
  Cookie,
  Heart,
  Moon,
  Sun,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatTime } from '@/lib/habit-utils'
import {
  getMealMenu,
  cleanDish,
  isSpecialDish,
  type MealName,
} from '@/lib/mess-data'
import { HabitIcon } from '@/components/habit-icon'
import { useHabits } from '@/components/habits-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SNOOZE_OPTIONS = [5, 10, 30]

const MEAL_ICON: Record<MealName, typeof Sun> = {
  Breakfast: Coffee,
  Lunch: Sun,
  Snacks: Cookie,
  Dinner: Moon,
}

export function ReminderOverlay() {
  const {
    activeReminder,
    habits,
    mess,
    isFavorite,
    dismissReminder,
    snoozeReminder,
  } = useHabits()
  const [now, setNow] = useState(() => new Date())
  const [showSnooze, setShowSnooze] = useState(false)

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

  if (!activeReminder) return null

  const isMeal = activeReminder.kind === 'meal'
  const habit =
    activeReminder.kind === 'habit'
      ? habits.find((h) => h.id === activeReminder.habitId)
      : null

  if (!isMeal && !habit) return null

  const clock = now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
  const dateLabel = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const mealMenu =
    isMeal && mess ? getMealMenu(mess, activeReminder.meal) : null
  const hasFavorite =
    mealMenu?.items.some((d) => isFavorite(cleanDish(d))) ?? false
  const MealIconCmp = isMeal ? MEAL_ICON[activeReminder.meal] : null

  const title = isMeal ? `${activeReminder.meal} time` : habit!.name
  const doneLabel = isMeal ? 'Ate it' : 'Mark done'

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={`Reminder: ${title}`}
      className="fixed inset-0 z-[100] flex animate-reminder-in flex-col overflow-y-auto bg-background"
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
          {isMeal ? 'Meal alarm' : 'Reminder'}
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

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-6 text-center">
        <div className="tabular-nums text-5xl font-extralight tracking-tight sm:text-6xl">
          {clock}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{dateLabel}</p>

        <div className="relative mt-8 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute size-28 animate-pulse-ring rounded-full bg-primary/30"
          />
          <span className="relative flex size-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30">
            {isMeal && MealIconCmp ? (
              <MealIconCmp className="size-11" />
            ) : (
              <HabitIcon name={habit!.icon} className="size-11" />
            )}
          </span>
        </div>

        <h1 className="mt-6 text-balance text-3xl font-semibold sm:text-4xl">
          {title}
        </h1>

        {!isMeal && habit!.note && (
          <p className="mt-2 max-w-sm text-balance text-base text-muted-foreground">
            {habit!.note}
          </p>
        )}

        {isMeal && hasFavorite && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-500">
            <Heart className="size-4 fill-red-500" />
            Your favourite is on the menu!
          </p>
        )}

        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-sm font-medium text-muted-foreground">
          <Clock className="size-4" />
          {formatTime(activeReminder.time)}
        </span>

        {isMeal && mealMenu && (
          <div className="mt-6 w-full max-w-sm rounded-3xl bg-surface-container-high p-5 text-left">
            {mealMenu.items.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {mealMenu.items.map((raw, i) => {
                  const dish = cleanDish(raw)
                  const special = isSpecialDish(raw)
                  const fav = isFavorite(dish)
                  return (
                    <li
                      key={`${dish}-${i}`}
                      className="flex items-center gap-2 text-base"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'size-1.5 rounded-full',
                          special ? 'bg-primary' : 'bg-muted-foreground/40',
                        )}
                      />
                      <span
                        className={cn(
                          special && 'font-semibold text-on-primary-container',
                        )}
                      >
                        {dish}
                      </span>
                      {fav && (
                        <Heart className="size-4 fill-red-500 text-red-500" />
                      )}
                    </li>
                  )
                })}
                {mealMenu.common && (
                  <li className="text-sm text-muted-foreground">
                    + {mealMenu.common}
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                No menu listed for this meal today.
              </p>
            )}
          </div>
        )}
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
              {doneLabel}
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
