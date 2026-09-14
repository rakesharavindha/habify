export type HabitIcon =
  | 'utensils'
  | 'coffee'
  | 'dumbbell'
  | 'book'
  | 'droplet'
  | 'pill'
  | 'moon'
  | 'sun'
  | 'heart'
  | 'sparkles'
  | 'brain'
  | 'leaf'

export type Habit = {
  id: string
  name: string
  note?: string
  icon: HabitIcon
  /** "HH:MM" 24h times the reminder should fire */
  times: string[]
  /** 0 = Sunday ... 6 = Saturday. Empty = every day */
  days: number[]
  enabled: boolean
  createdAt: number
  /** ISO date (YYYY-MM-DD) -> number of times completed that day */
  completions: Record<string, number>
}

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
