import type { Habit } from './types'

export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function scheduledToday(habit: Habit, d = new Date()): boolean {
  if (habit.days.length === 0) return true
  return habit.days.includes(d.getDay())
}

/** Next upcoming "HH:MM" today after the given date, or null. */
export function nextTimeToday(habit: Habit, d = new Date()): string | null {
  if (!scheduledToday(habit, d)) return null
  const now = d.getHours() * 60 + d.getMinutes()
  const upcoming = habit.times
    .map((t) => {
      const [h, m] = t.split(':').map(Number)
      return { t, mins: h * 60 + m }
    })
    .filter((x) => x.mins > now)
    .sort((a, b) => a.mins - b.mins)
  return upcoming[0]?.t ?? null
}

export function isCompletedToday(habit: Habit, d = new Date()): boolean {
  const key = todayKey(d)
  return (habit.completions[key] ?? 0) >= habit.times.length
}

export function completionsToday(habit: Habit, d = new Date()): number {
  return habit.completions[todayKey(d)] ?? 0
}

/** Consecutive-day streak counting back from today (or yesterday). */
export function computeStreak(habit: Habit): number {
  const cursor = new Date()
  let streak = 0
  // If today isn't complete yet, streak still counts from yesterday.
  if (!wasDayComplete(habit, cursor)) {
    cursor.setDate(cursor.getDate() - 1)
  }
  for (let i = 0; i < 730; i++) {
    if (wasDayComplete(habit, cursor)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

function wasDayComplete(habit: Habit, d: Date): boolean {
  if (!scheduledToday(habit, d)) {
    // Not scheduled that day, treat as neutral (keeps the chain alive).
    return true
  }
  const key = todayKey(d)
  return (habit.completions[key] ?? 0) >= Math.max(1, habit.times.length)
}

export function seedHabits(): Habit[] {
  const now = Date.now()
  return [
    {
      id: crypto.randomUUID(),
      name: 'Morning coffee & plan',
      note: 'Skip the extra sugar today',
      icon: 'coffee',
      times: ['08:00'],
      days: [],
      enabled: true,
      createdAt: now,
      completions: {},
    },
    {
      id: crypto.randomUUID(),
      name: 'Drink water',
      note: 'Stay hydrated through the day',
      icon: 'droplet',
      times: ['11:00', '15:00', '19:00'],
      days: [],
      enabled: true,
      createdAt: now,
      completions: {},
    },
    {
      id: crypto.randomUUID(),
      name: 'Evening workout',
      note: 'Your favorite: 30 min mobility',
      icon: 'dumbbell',
      times: ['18:30'],
      days: [1, 2, 3, 4, 5],
      enabled: true,
      createdAt: now,
      completions: {},
    },
  ]
}
