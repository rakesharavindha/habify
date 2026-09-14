import rawMenu from './mess-menu.json'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MealName = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner'

export interface MealMenu {
  meal: MealName
  items: string[]
  common: string
}

interface DaySchedule {
  Breakfast?: string[]
  Lunch?: string[]
  Snacks?: string[]
  Dinner?: string[]
}

interface WeekMenu {
  source?: string
  schedule: Record<string, DaySchedule>
}

interface CategoryMenu {
  common_items: Partial<Record<MealName, string>>
  A?: WeekMenu
  B?: WeekMenu
  C?: WeekMenu
  D?: WeekMenu
}

interface CycleMenu {
  Messmenu: {
    Categories: Record<string, CategoryMenu>
  }
}

const MENU = rawMenu as unknown as Record<string, CycleMenu>

// ---------------------------------------------------------------------------
// Mess options (the "messes" a student can pick)
// ---------------------------------------------------------------------------

export interface MessOption {
  value: string
  label: string
}

export const MESS_OPTIONS: MessOption[] = [
  { value: 'South_Veg', label: 'South Indian (Veg)' },
  { value: 'South_Non_Veg', label: 'South Indian (Non-Veg)' },
  { value: 'South_Pure_Veg', label: 'South Indian (Pure Veg)' },
  { value: 'North_Veg', label: 'North Indian (Veg)' },
  { value: 'North_Non_Veg', label: 'North Indian (Non-Veg)' },
  { value: 'North_Veg_No_Onion_Garlic', label: 'North Indian (No Onion/Garlic)' },
  { value: 'Unified_Veg', label: 'Unified (Veg)' },
  { value: 'Unified_Non_Veg', label: 'Unified (Non-Veg)' },
  { value: 'Protein_Veg', label: 'Protein (Veg)' },
  { value: 'Protein_Non_Veg', label: 'Protein (Non-Veg)' },
]

export function messLabel(value: string): string {
  return MESS_OPTIONS.find((m) => m.value === value)?.label ?? value
}

// ---------------------------------------------------------------------------
// Meal timing metadata
// ---------------------------------------------------------------------------

export interface MealMeta {
  name: MealName
  /** Reminder trigger time in 24h HH:mm — set near the start of each serving window. */
  time: string
  /** Human readable serving window. */
  window: string
}

export const MEALS: MealMeta[] = [
  { name: 'Breakfast', time: '07:30', window: '7:00 – 9:30 AM' },
  { name: 'Lunch', time: '12:15', window: '12:00 – 2:30 PM' },
  { name: 'Snacks', time: '16:45', window: '4:30 – 5:30 PM' },
  { name: 'Dinner', time: '19:30', window: '7:00 – 9:30 PM' },
]

export const MEAL_ORDER: MealName[] = ['Breakfast', 'Lunch', 'Snacks', 'Dinner']

// ---------------------------------------------------------------------------
// Cycle + week rotation resolution (ported from the DigiMess algorithm)
// ---------------------------------------------------------------------------

const WEEKS = ['A', 'B', 'C', 'D'] as const

// Reference dates → starting week letter per category.
const WEEK_REFERENCE: Record<string, Record<string, string>> = {
  South_Veg: { '2025-07-28': 'A', '2026-04-01': 'A', '2026-07-27': 'A' },
  South_Non_Veg: { '2025-07-28': 'A', '2026-04-01': 'A', '2026-07-27': 'A' },
  South_Pure_Veg: { '2025-07-28': 'A', '2026-04-01': 'A', '2026-07-27': 'A' },
  North_Veg: { '2025-07-28': 'A', '2026-04-01': 'A', '2026-07-27': 'A' },
  North_Non_Veg: { '2025-07-28': 'A', '2026-04-01': 'A', '2026-07-27': 'A' },
  North_Veg_No_Onion_Garlic: { '2025-07-28': 'A', '2026-04-01': 'A', '2026-07-27': 'A' },
  Unified_Veg: { '2025-07-28': 'A', '2026-04-01': 'A', '2026-07-27': 'A' },
  Unified_Non_Veg: { '2025-07-28': 'A', '2026-04-01': 'A', '2026-07-27': 'A' },
  Protein_Veg: { '2026-01-19': 'A', '2026-04-01': 'A', '2026-07-27': 'A' },
  Protein_Non_Veg: { '2026-01-19': 'A', '2026-04-01': 'A', '2026-07-27': 'A' },
  DEFAULT: { '2025-07-28': 'A', '2026-04-01': 'A', '2026-07-27': 'A' },
}

/** Latest menu cycle whose start date is on or before the given date. */
function resolveCycle(date: Date): string | null {
  const cycles = Object.keys(MENU).sort()
  let match: string | null = null
  for (const c of cycles) {
    if (new Date(`${c}T00:00:00+05:30`) <= date) match = c
  }
  return match ?? cycles[0] ?? null
}

/** Which rotating week (A–D) applies to the given date for a category. */
function resolveWeekLetter(date: Date, category: string): string {
  const cfg = WEEK_REFERENCE[category] ?? WEEK_REFERENCE.DEFAULT
  const entries = Object.entries(cfg)
    .map(([d, week]) => ({ date: new Date(`${d}T00:00:00+05:30`), week }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const target = new Date(date)
  target.setHours(0, 0, 0, 0)

  let base = entries[entries.length - 1]
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].date <= target) {
      base = entries[i]
      break
    }
  }
  if (!base) base = entries[0]

  // Snap the reference date back to the Monday of its week.
  const monday = new Date(base.date)
  const day = monday.getDay()
  const shift = day === 0 ? -6 : 1 - day
  monday.setDate(monday.getDate() + shift)

  const daysElapsed = Math.floor((target.getTime() - monday.getTime()) / 86_400_000)
  const weeksElapsed = Math.floor(daysElapsed / 7)
  const baseIndex = WEEKS.indexOf(base.week as (typeof WEEKS)[number])
  const idx = ((baseIndex + weeksElapsed) % WEEKS.length + WEEKS.length) % WEEKS.length
  return WEEKS[idx]
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

/**
 * Resolve the menu for a single meal on a given date + mess.
 * Cleans the DigiMess "*asterisk*" special-dish markers.
 */
export function getMealMenu(
  mess: string,
  meal: MealName,
  date = new Date(),
): MealMenu {
  const empty: MealMenu = { meal, items: [], common: '' }
  const cycle = resolveCycle(date)
  if (!cycle) return empty

  const category = MENU[cycle]?.Messmenu?.Categories?.[mess]
  if (!category) return empty

  const week = resolveWeekLetter(date, mess) as 'A' | 'B' | 'C' | 'D'
  const weekMenu = category[week]
  const dayName = DAY_NAMES[date.getDay()]
  const items = weekMenu?.schedule?.[dayName]?.[meal] ?? []

  return {
    meal,
    items: items.map(cleanDish),
    common: category.common_items?.[meal] ?? '',
  }
}

/** Full day's menu (all four meals) for a mess. */
export function getDayMenu(mess: string, date = new Date()): MealMenu[] {
  return MEAL_ORDER.map((meal) => getMealMenu(mess, meal, date))
}

/** DigiMess marks highlight dishes with surrounding asterisks. */
export function isSpecialDish(raw: string): boolean {
  return /^\*.*\*$/.test(raw.trim())
}

export function cleanDish(raw: string): string {
  return raw.replace(/\*/g, '').trim()
}
