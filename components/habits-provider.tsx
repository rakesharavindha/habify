'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Habit } from '@/lib/types'
import { scheduledToday, seedHabits, todayKey } from '@/lib/habit-utils'

const STORAGE_KEY = 'habit.habits.v1'
const FIRED_KEY = 'habit.fired.v1'

export type ActiveReminder = {
  habitId: string
  time: string
  /** unique key for this occurrence, e.g. "2026-09-14|08:00" */
  occurrence: string
}

type HabitsContextValue = {
  habits: Habit[]
  ready: boolean
  activeReminder: ActiveReminder | null
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => void
  updateHabit: (id: string, patch: Partial<Habit>) => void
  removeHabit: (id: string) => void
  toggleEnabled: (id: string) => void
  markComplete: (id: string) => void
  dismissReminder: (opts?: { complete?: boolean }) => void
  snoozeReminder: (minutes: number) => void
  previewReminder: (id: string) => void
}

const HabitsContext = createContext<HabitsContextValue | null>(null)

function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedHabits()
    const parsed = JSON.parse(raw) as Habit[]
    if (!Array.isArray(parsed)) return seedHabits()
    return parsed
  } catch {
    return seedHabits()
  }
}

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [ready, setReady] = useState(false)
  const [activeReminder, setActiveReminder] = useState<ActiveReminder | null>(
    null,
  )
  // occurrences already shown today, so we never double-fire.
  const firedRef = useRef<Set<string>>(new Set())
  // occurrences delayed via snooze -> timestamp when they should fire.
  const snoozeRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    setHabits(loadHabits())
    try {
      const raw = localStorage.getItem(FIRED_KEY)
      if (raw) {
        const { day, keys } = JSON.parse(raw) as { day: string; keys: string[] }
        if (day === todayKey()) firedRef.current = new Set(keys)
      }
    } catch {
      // ignore
    }
    setReady(true)
  }, [])

  const persist = useCallback((next: Habit[]) => {
    setHabits(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }, [])

  const persistFired = useCallback(() => {
    try {
      localStorage.setItem(
        FIRED_KEY,
        JSON.stringify({
          day: todayKey(),
          keys: Array.from(firedRef.current),
        }),
      )
    } catch {
      // ignore
    }
  }, [])

  const addHabit = useCallback<HabitsContextValue['addHabit']>(
    (habit) => {
      const next: Habit = {
        ...habit,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        completions: {},
      }
      persist([...habits, next])
    },
    [habits, persist],
  )

  const updateHabit = useCallback<HabitsContextValue['updateHabit']>(
    (id, patch) => {
      persist(habits.map((h) => (h.id === id ? { ...h, ...patch } : h)))
    },
    [habits, persist],
  )

  const removeHabit = useCallback<HabitsContextValue['removeHabit']>(
    (id) => {
      persist(habits.filter((h) => h.id !== id))
    },
    [habits, persist],
  )

  const toggleEnabled = useCallback<HabitsContextValue['toggleEnabled']>(
    (id) => {
      persist(
        habits.map((h) => (h.id === id ? { ...h, enabled: !h.enabled } : h)),
      )
    },
    [habits, persist],
  )

  const markComplete = useCallback<HabitsContextValue['markComplete']>(
    (id) => {
      const key = todayKey()
      persist(
        habits.map((h) =>
          h.id === id
            ? {
                ...h,
                completions: {
                  ...h.completions,
                  [key]: (h.completions[key] ?? 0) + 1,
                },
              }
            : h,
        ),
      )
    },
    [habits, persist],
  )

  const dismissReminder = useCallback<HabitsContextValue['dismissReminder']>(
    (opts) => {
      if (activeReminder && opts?.complete) {
        markComplete(activeReminder.habitId)
      }
      setActiveReminder(null)
    },
    [activeReminder, markComplete],
  )

  const snoozeReminder = useCallback<HabitsContextValue['snoozeReminder']>(
    (minutes) => {
      if (!activeReminder) return
      // Remove from fired so scheduler can re-trigger, then delay it.
      firedRef.current.delete(activeReminder.occurrence)
      snoozeRef.current.set(
        activeReminder.occurrence,
        Date.now() + minutes * 60_000,
      )
      persistFired()
      setActiveReminder(null)
    },
    [activeReminder, persistFired],
  )

  const previewReminder = useCallback<HabitsContextValue['previewReminder']>(
    (id) => {
      const habit = habits.find((h) => h.id === id)
      if (!habit) return
      setActiveReminder({
        habitId: id,
        time: habit.times[0] ?? '00:00',
        occurrence: `preview|${id}|${Date.now()}`,
      })
    },
    [habits],
  )

  // Scheduler: check every 15s for due reminders.
  useEffect(() => {
    if (!ready) return

    const check = () => {
      if (activeReminder) return
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const current = `${hh}:${mm}`
      const day = todayKey(now)

      for (const habit of habits) {
        if (!habit.enabled) continue
        if (!scheduledToday(habit, now)) continue

        for (const time of habit.times) {
          const occurrence = `${day}|${habit.id}|${time}`

          // Snoozed occurrence that is now due again.
          const snoozeUntil = snoozeRef.current.get(occurrence)
          if (snoozeUntil != null) {
            if (Date.now() >= snoozeUntil) {
              snoozeRef.current.delete(occurrence)
              firedRef.current.add(occurrence)
              persistFired()
              setActiveReminder({ habitId: habit.id, time, occurrence })
              return
            }
            continue
          }

          if (firedRef.current.has(occurrence)) continue
          if (time === current) {
            firedRef.current.add(occurrence)
            persistFired()
            setActiveReminder({ habitId: habit.id, time, occurrence })
            return
          }
        }
      }
    }

    check()
    const interval = setInterval(check, 15_000)
    return () => clearInterval(interval)
  }, [ready, habits, activeReminder, persistFired])

  const value = useMemo<HabitsContextValue>(
    () => ({
      habits,
      ready,
      activeReminder,
      addHabit,
      updateHabit,
      removeHabit,
      toggleEnabled,
      markComplete,
      dismissReminder,
      snoozeReminder,
      previewReminder,
    }),
    [
      habits,
      ready,
      activeReminder,
      addHabit,
      updateHabit,
      removeHabit,
      toggleEnabled,
      markComplete,
      dismissReminder,
      snoozeReminder,
      previewReminder,
    ],
  )

  return (
    <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
  )
}

export function useHabits() {
  const ctx = useContext(HabitsContext)
  if (!ctx) throw new Error('useHabits must be used within HabitsProvider')
  return ctx
}
