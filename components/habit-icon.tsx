import {
  Book,
  Brain,
  Coffee,
  Droplet,
  Dumbbell,
  Heart,
  Leaf,
  Moon,
  Pill,
  Sparkles,
  Sun,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import type { HabitIcon as HabitIconName } from '@/lib/types'

export const HABIT_ICONS: Record<HabitIconName, LucideIcon> = {
  utensils: Utensils,
  coffee: Coffee,
  dumbbell: Dumbbell,
  book: Book,
  droplet: Droplet,
  pill: Pill,
  moon: Moon,
  sun: Sun,
  heart: Heart,
  sparkles: Sparkles,
  brain: Brain,
  leaf: Leaf,
}

export const HABIT_ICON_LIST = Object.keys(HABIT_ICONS) as HabitIconName[]

export function HabitIcon({
  name,
  className,
}: {
  name: HabitIconName
  className?: string
}) {
  const Icon = HABIT_ICONS[name] ?? Sparkles
  return <Icon className={className} aria-hidden="true" />
}
