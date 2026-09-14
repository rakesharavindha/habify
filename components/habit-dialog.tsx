'use client'

import { Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Habit, HabitIcon as HabitIconName } from '@/lib/types'
import { WEEKDAY_LABELS } from '@/lib/types'
import { HABIT_ICON_LIST, HabitIcon } from '@/components/habit-icon'
import { useHabits } from '@/components/habits-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DraftState = {
  name: string
  note: string
  icon: HabitIconName
  times: string[]
  days: number[]
}

function emptyDraft(): DraftState {
  return { name: '', note: '', icon: 'sparkles', times: ['08:00'], days: [] }
}

export function HabitDialog({
  open,
  habit,
  onClose,
}: {
  open: boolean
  habit: Habit | null
  onClose: () => void
}) {
  const { addHabit, updateHabit } = useHabits()
  const [draft, setDraft] = useState<DraftState>(emptyDraft)
  const [newTime, setNewTime] = useState('12:00')

  useEffect(() => {
    if (!open) return
    if (habit) {
      setDraft({
        name: habit.name,
        note: habit.note ?? '',
        icon: habit.icon,
        times: [...habit.times],
        days: [...habit.days],
      })
    } else {
      setDraft(emptyDraft())
    }
  }, [open, habit])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const canSave = draft.name.trim().length > 0 && draft.times.length > 0

  const save = () => {
    if (!canSave) return
    const times = [...draft.times].sort()
    const payload = {
      name: draft.name.trim(),
      note: draft.note.trim() || undefined,
      icon: draft.icon,
      times,
      days: draft.days,
      enabled: true,
    }
    if (habit) {
      updateHabit(habit.id, payload)
    } else {
      addHabit(payload)
    }
    onClose()
  }

  const addTime = () => {
    if (draft.times.includes(newTime)) return
    setDraft((d) => ({ ...d, times: [...d.times, newTime].sort() }))
  }

  const toggleDay = (idx: number) => {
    setDraft((d) => ({
      ...d,
      days: d.days.includes(idx)
        ? d.days.filter((x) => x !== idx)
        : [...d.days, idx].sort(),
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={habit ? 'Edit habit' : 'New habit'}
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg animate-sheet-up flex-col overflow-hidden rounded-t-4xl bg-surface-container shadow-2xl sm:animate-scale-in sm:rounded-4xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-6 py-4">
          <h2 className="text-lg font-semibold">
            {habit ? 'Edit habit' : 'New habit'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="state-layer flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-5">
          <Field label="Name">
            <input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="e.g. Evening walk"
              className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-base outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </Field>

          <Field label="Note (optional)">
            <input
              value={draft.note}
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              placeholder="Your favorite pick, a tip, anything"
              className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-base outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </Field>

          <Field label="Icon">
            <div className="grid grid-cols-6 gap-2">
              {HABIT_ICON_LIST.map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-label={name}
                  aria-pressed={draft.icon === name}
                  onClick={() => setDraft((d) => ({ ...d, icon: name }))}
                  className={cn(
                    'state-layer flex aspect-square items-center justify-center rounded-2xl transition-colors',
                    draft.icon === name
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface-container-high text-muted-foreground',
                  )}
                >
                  <HabitIcon name={name} className="size-5" />
                </button>
              ))}
            </div>
          </Field>

          <Field label="Reminder times">
            <div className="flex flex-wrap items-center gap-2">
              {draft.times.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-container py-1.5 pl-3 pr-1.5 text-sm font-medium text-on-primary-container"
                >
                  <span className="tabular-nums">{t}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${t}`}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        times: d.times.filter((x) => x !== t),
                      }))
                    }
                    className="flex size-5 items-center justify-center rounded-full hover:bg-black/10"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="h-11 rounded-2xl border border-input bg-background px-3 text-base tabular-nums outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addTime}
                className="h-11 gap-1.5 rounded-2xl px-4"
              >
                <Plus className="size-4" /> Add time
              </Button>
            </div>
          </Field>

          <Field label="Repeat">
            <div className="flex items-center gap-1.5">
              {WEEKDAY_LABELS.map((label, idx) => {
                const active =
                  draft.days.length === 0 || draft.days.includes(idx)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    aria-pressed={draft.days.includes(idx)}
                    className={cn(
                      'flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-container-high text-muted-foreground',
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {draft.days.length === 0
                ? 'Every day'
                : 'Selected days only. Clear all for every day.'}
            </p>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 px-6 py-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-11 rounded-full px-5"
          >
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={!canSave}
            className="h-11 rounded-full px-6"
          >
            {habit ? 'Save changes' : 'Add habit'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
