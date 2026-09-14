'use client'

import { Plus, Settings2, UtensilsCrossed } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Habit } from '@/lib/types'
import { getDayMenu, messLabel, MEAL_ORDER } from '@/lib/mess-data'
import { HabitCard } from '@/components/habit-card'
import { HabitDialog } from '@/components/habit-dialog'
import { useHabits } from '@/components/habits-provider'
import { MealCard } from '@/components/meal-card'
import { ReminderOverlay } from '@/components/reminder-overlay'
import { SettingsSheet } from '@/components/settings-sheet'
import { Button } from '@/components/ui/button'

export function HomeScreen() {
  const { habits, ready, mess, isMealEaten } = useHabits()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (habit: Habit) => {
    setEditing(habit)
    setDialogOpen(true)
  }

  const dayMenu = useMemo(
    () => (mess ? getDayMenu(mess) : []),
    [mess],
  )

  const eatenCount = MEAL_ORDER.filter((m) => isMealEaten(m)).length

  const greeting = useMemo(() => {
    if (!ready) return ''
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }, [ready])

  const dateLabel = useMemo(
    () =>
      ready
        ? new Date().toLocaleDateString([], {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })
        : '',
    [ready],
  )

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-28 sm:px-6">
      <header className="sticky top-0 z-30 -mx-4 flex items-center justify-between gap-3 bg-background/80 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <UtensilsCrossed className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Mealify</span>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
          className="state-layer flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="size-5" />
        </button>
      </header>

      <div className="mt-2">
        <p className="text-sm text-muted-foreground">
          {greeting} &middot; {dateLabel}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Today&apos;s meals
        </h1>
        {mess && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {messLabel(mess)} &middot;{' '}
            <span className="font-medium text-foreground">
              {eatenCount}/{MEAL_ORDER.length} eaten
            </span>
          </p>
        )}
      </div>

      {ready && (
        <section className="mt-5 flex flex-col gap-3">
          {dayMenu.map((menu) => (
            <MealCard key={menu.meal} menu={menu} />
          ))}
        </section>
      )}

      {ready && habits.length > 0 && (
        <section className="mt-8 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Water &amp; workout
            </h2>
          </div>
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onEdit={openEdit} />
          ))}
        </section>
      )}

      <button
        type="button"
        onClick={openNew}
        aria-label="Add reminder"
        className="state-layer fixed bottom-6 right-1/2 z-30 flex h-14 translate-x-1/2 items-center gap-2 rounded-2xl bg-primary px-5 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition-transform active:scale-95 sm:right-6 sm:translate-x-0"
      >
        <Plus className="size-6" />
        New
      </button>

      <HabitDialog
        open={dialogOpen}
        habit={editing}
        onClose={() => setDialogOpen(false)}
      />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ReminderOverlay />
    </div>
  )
}
