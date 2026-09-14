'use client'

import { Bell, CalendarCheck, Plus, Settings2, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Habit } from '@/lib/types'
import {
  formatTime,
  isCompletedToday,
  nextTimeToday,
  scheduledToday,
} from '@/lib/habit-utils'
import { HabitCard } from '@/components/habit-card'
import { HabitDialog } from '@/components/habit-dialog'
import { useHabits } from '@/components/habits-provider'
import { ReminderOverlay } from '@/components/reminder-overlay'
import { SettingsSheet } from '@/components/settings-sheet'
import { Button } from '@/components/ui/button'

export function HomeScreen() {
  const { habits, ready } = useHabits()
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

  const stats = useMemo(() => {
    const active = habits.filter((h) => h.enabled)
    const scheduled = active.filter((h) => scheduledToday(h))
    const done = scheduled.filter((h) => isCompletedToday(h)).length
    const next = active
      .map((h) => ({ h, t: nextTimeToday(h) }))
      .filter((x) => x.t)
      .sort((a, b) => (a.t! < b.t! ? -1 : 1))[0]
    return {
      total: scheduled.length,
      done,
      pct: scheduled.length ? Math.round((done / scheduled.length) * 100) : 0,
      next: next ? { name: next.h.name, time: next.t! } : null,
    }
  }, [habits])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-28 sm:px-6">
      <header className="sticky top-0 z-30 -mx-4 flex items-center justify-between gap-3 bg-background/80 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Bell className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Remindly</span>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open appearance settings"
          className="state-layer flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="size-5" />
        </button>
      </header>

      <div className="mt-2">
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Today&apos;s reminders
        </h1>
      </div>

      {ready && habits.length > 0 && (
        <div className="mt-5 flex flex-col gap-3 rounded-3xl bg-primary-container p-5 text-on-primary-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="size-5" />
              <span className="text-sm font-medium">Daily progress</span>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {stats.done}/{stats.total}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Bell className="size-4" />
            {stats.next ? (
              <span>
                Next: <span className="font-semibold">{stats.next.name}</span>{' '}
                at {formatTime(stats.next.time)}
              </span>
            ) : (
              <span>All caught up for today</span>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {ready &&
          habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onEdit={openEdit} />
          ))}

        {ready && habits.length === 0 && (
          <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border px-6 py-16 text-center">
            <span className="flex size-16 items-center justify-center rounded-3xl bg-primary-container text-on-primary-container">
              <Sparkles className="size-8" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">No reminders yet</h2>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Add your first habit or favorite and Remindly will nudge you
                right on time.
              </p>
            </div>
            <Button onClick={openNew} className="h-11 rounded-full px-6">
              <Plus className="size-4" /> Create a reminder
            </Button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={openNew}
        aria-label="Add habit"
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
