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
import {
  MEALS,
  MEAL_ORDER,
  type MealName,
  getMealMenu,
} from '@/lib/mess-data'

const STORAGE_KEY = 'habit.habits.v1'
const FIRED_KEY = 'habit.fired.v1'
const MESS_KEY = 'mealify.mess.v1'
const FAV_KEY = 'mealify.favorites.v1'
const MEALCFG_KEY = 'mealify.mealconfig.v1'
const MEALDONE_KEY = 'mealify.mealsdone.v1'

export type MealConfig = Record<MealName, { enabled: boolean; time: string }>

export type ActiveReminder =
  | {
      kind: 'habit'
      habitId: string
      time: string
      occurrence: string
    }
  | {
      kind: 'meal'
      meal: MealName
      time: string
      occurrence: string
    }

type HabitsContextValue = {
  habits: Habit[]
  ready: boolean
  activeReminder: ActiveReminder | null
  // mess + meals
  mess: string | null
  onboarded: boolean
  favorites: string[]
  mealConfig: MealConfig
  setMess: (value: string) => void
  toggleFavorite: (dish: string) => void
  isFavorite: (dish: string) => boolean
  markMealEaten: (meal: MealName) => void
  isMealEaten: (meal: MealName) => boolean
  toggleMeal: (meal: MealName) => void
  setMealTime: (meal: MealName, time: string) => void
  previewMeal: (meal: MealName) => void
  // habits
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

function defaultMealConfig(): MealConfig {
  return MEALS.reduce((acc, m) => {
    acc[m.name] = { enabled: true, time: m.time }
    return acc
  }, {} as MealConfig)
}

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

function favKey(dish: string) {
  return dish.trim().toLowerCase()
}

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [ready, setReady] = useState(false)
  const [activeReminder, setActiveReminder] = useState<ActiveReminder | null>(
    null,
  )
  const [mess, setMessState] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [mealConfig, setMealConfig] = useState<MealConfig>(defaultMealConfig)
  const [mealsDone, setMealsDone] = useState<Record<string, MealName[]>>({})

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
    try {
      setMessState(localStorage.getItem(MESS_KEY))
    } catch {
      // ignore
    }
    try {
      const raw = localStorage.getItem(FAV_KEY)
      if (raw) setFavorites(JSON.parse(raw) as string[])
    } catch {
      // ignore
    }
    try {
      const raw = localStorage.getItem(MEALCFG_KEY)
      if (raw) setMealConfig({ ...defaultMealConfig(), ...JSON.parse(raw) })
    } catch {
      // ignore
    }
    try {
      const raw = localStorage.getItem(MEALDONE_KEY)
      if (raw) setMealsDone(JSON.parse(raw) as Record<string, MealName[]>)
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

  // ---- mess + meals --------------------------------------------------------

  const setMess = useCallback((value: string) => {
    setMessState(value)
    try {
      localStorage.setItem(MESS_KEY, value)
    } catch {
      // ignore
    }
  }, [])

  const toggleFavorite = useCallback((dish: string) => {
    setFavorites((prev) => {
      const key = favKey(dish)
      const exists = prev.some((d) => favKey(d) === key)
      const next = exists
        ? prev.filter((d) => favKey(d) !== key)
        : [...prev, dish.trim()]
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (dish: string) => favorites.some((d) => favKey(d) === favKey(dish)),
    [favorites],
  )

  const markMealEaten = useCallback((meal: MealName) => {
    const key = todayKey()
    setMealsDone((prev) => {
      const today = prev[key] ?? []
      if (today.includes(meal)) return prev
      const next = { ...prev, [key]: [...today, meal] }
      try {
        localStorage.setItem(MEALDONE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(18)
    }
  }, [])

  const isMealEaten = useCallback(
    (meal: MealName) => (mealsDone[todayKey()] ?? []).includes(meal),
    [mealsDone],
  )

  const toggleMeal = useCallback((meal: MealName) => {
    setMealConfig((prev) => {
      const next = {
        ...prev,
        [meal]: { ...prev[meal], enabled: !prev[meal].enabled },
      }
      try {
        localStorage.setItem(MEALCFG_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const setMealTime = useCallback((meal: MealName, time: string) => {
    setMealConfig((prev) => {
      const next = { ...prev, [meal]: { ...prev[meal], time } }
      try {
        localStorage.setItem(MEALCFG_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const previewMeal = useCallback((meal: MealName) => {
    setActiveReminder({
      kind: 'meal',
      meal,
      time: MEALS.find((m) => m.name === meal)?.time ?? '00:00',
      occurrence: `preview|meal|${meal}|${Date.now()}`,
    })
  }, [])

  // ---- habits --------------------------------------------------------------

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
        if (activeReminder.kind === 'habit') {
          markComplete(activeReminder.habitId)
        } else {
          markMealEaten(activeReminder.meal)
        }
      }
      setActiveReminder(null)
    },
    [activeReminder, markComplete, markMealEaten],
  )

  const snoozeReminder = useCallback<HabitsContextValue['snoozeReminder']>(
    (minutes) => {
      if (!activeReminder) return
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
        kind: 'habit',
        habitId: id,
        time: habit.times[0] ?? '00:00',
        occurrence: `preview|${id}|${Date.now()}`,
      })
    },
    [habits],
  )

  // ---- scheduler -----------------------------------------------------------

  useEffect(() => {
    if (!ready) return

    const check = () => {
      if (activeReminder) return
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const current = `${hh}:${mm}`
      const day = todayKey(now)

      // Meal reminders first.
      if (mess) {
        for (const meal of MEAL_ORDER) {
          const cfg = mealConfig[meal]
          if (!cfg?.enabled) continue
          const occurrence = `${day}|meal|${meal}`

          const snoozeUntil = snoozeRef.current.get(occurrence)
          if (snoozeUntil != null) {
            if (Date.now() >= snoozeUntil) {
              snoozeRef.current.delete(occurrence)
              firedRef.current.add(occurrence)
              persistFired()
              setActiveReminder({ kind: 'meal', meal, time: cfg.time, occurrence })
              return
            }
            continue
          }
          if (firedRef.current.has(occurrence)) continue
          if (cfg.time === current) {
            firedRef.current.add(occurrence)
            persistFired()
            setActiveReminder({ kind: 'meal', meal, time: cfg.time, occurrence })
            return
          }
        }
      }

      // Habit reminders.
      for (const habit of habits) {
        if (!habit.enabled) continue
        if (!scheduledToday(habit, now)) continue

        for (const time of habit.times) {
          const occurrence = `${day}|${habit.id}|${time}`

          const snoozeUntil = snoozeRef.current.get(occurrence)
          if (snoozeUntil != null) {
            if (Date.now() >= snoozeUntil) {
              snoozeRef.current.delete(occurrence)
              firedRef.current.add(occurrence)
              persistFired()
              setActiveReminder({
                kind: 'habit',
                habitId: habit.id,
                time,
                occurrence,
              })
              return
            }
            continue
          }

          if (firedRef.current.has(occurrence)) continue
          if (time === current) {
            firedRef.current.add(occurrence)
            persistFired()
            setActiveReminder({
              kind: 'habit',
              habitId: habit.id,
              time,
              occurrence,
            })
            return
          }
        }
      }
    }

    check()
    const interval = setInterval(check, 15_000)
    return () => clearInterval(interval)
  }, [ready, habits, activeReminder, persistFired, mess, mealConfig])

  const value = useMemo<HabitsContextValue>(
    () => ({
      habits,
      ready,
      activeReminder,
      mess,
      onboarded: mess != null,
      favorites,
      mealConfig,
      setMess,
      toggleFavorite,
      isFavorite,
      markMealEaten,
      isMealEaten,
      toggleMeal,
      setMealTime,
      previewMeal,
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
      mess,
      favorites,
      mealConfig,
      setMess,
      toggleFavorite,
      isFavorite,
      markMealEaten,
      isMealEaten,
      toggleMeal,
      setMealTime,
      previewMeal,
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

// convenience alias for meal-focused consumers
export const useMealify = useHabits

export { getMealMenu }
