'use client'

import { Bell, Check, Flame, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Habit } from '@/lib/types'
import { WEEKDAY_LABELS } from '@/lib/types'
import {
  completionsToday,
  computeStreak,
  formatTime,
  isCompletedToday,
} from '@/lib/habit-utils'
import { HabitIcon } from '@/components/habit-icon'
import { useHabits } from '@/components/habits-provider'
import { cn } from '@/lib/utils'

export function HabitCard({
  habit,
  onEdit,
}: {
  habit: Habit
  onEdit: (habit: Habit) => void
}) {
  const { markComplete, removeHabit, toggleEnabled, previewReminder } =
    useHabits()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  const done = isCompletedToday(habit)
  const doneCount = completionsToday(habit)
  const total = habit.times.length
  const streak = computeStreak(habit)

  const complete = () => {
    if (doneCount >= total) return
    markComplete(habit.id)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(18)
    }
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-5 transition-all',
        'hover:border-border hover:shadow-lg hover:shadow-black/5',
        !habit.enabled && 'opacity-55',
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-2xl transition-colors',
            done
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary-container text-on-primary-container',
          )}
        >
          <HabitIcon name={habit.icon} className="size-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold leading-tight">
              {habit.name}
            </h3>
            {streak > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                <Flame className="size-3" />
                {streak}
              </span>
            )}
          </div>
          {habit.note ? (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {habit.note}
            </p>
          ) : (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {total} reminder{total !== 1 ? 's' : ''} a day
            </p>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="Habit options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="state-layer flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <MoreVertical className="size-5" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-11 z-20 w-44 origin-top-right animate-scale-in overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-xl shadow-black/20"
            >
              <MenuItem
                onClick={() => {
                  setMenuOpen(false)
                  onEdit(habit)
                }}
              >
                <Pencil className="size-4" /> Edit
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMenuOpen(false)
                  previewReminder(habit.id)
                }}
              >
                <Bell className="size-4" /> Preview reminder
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMenuOpen(false)
                  toggleEnabled(habit.id)
                }}
              >
                <Bell className="size-4" />
                {habit.enabled ? 'Pause' : 'Resume'}
              </MenuItem>
              <MenuItem
                destructive
                onClick={() => {
                  setMenuOpen(false)
                  removeHabit(habit.id)
                }}
              >
                <Trash2 className="size-4" /> Delete
              </MenuItem>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {habit.times.map((t) => (
          <span
            key={t}
            className="rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground"
          >
            {formatTime(t)}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {WEEKDAY_LABELS.map((label, idx) => {
            const active = habit.days.length === 0 || habit.days.includes(idx)
            return (
              <span
                key={idx}
                className={cn(
                  'flex size-6 items-center justify-center rounded-full text-[11px] font-semibold',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground/40',
                )}
              >
                {label}
              </span>
            )
          })}
        </div>

        <button
          type="button"
          onClick={complete}
          disabled={done}
          aria-label={done ? 'Completed today' : 'Mark complete'}
          className={cn(
            'state-layer flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors',
            done
              ? 'bg-primary text-primary-foreground'
              : 'border border-outline/50 text-foreground',
          )}
        >
          <Check className="size-4" />
          {done ? 'Done' : total > 1 ? `${doneCount}/${total}` : 'Complete'}
        </button>
      </div>
    </div>
  )
}

function MenuItem({
  children,
  onClick,
  destructive,
}: {
  children: React.ReactNode
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'state-layer flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors',
        destructive ? 'text-destructive' : 'text-popover-foreground',
      )}
    >
      {children}
    </button>
  )
}
