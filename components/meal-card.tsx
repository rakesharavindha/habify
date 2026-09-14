'use client'

import { Bell, Check, Coffee, Cookie, Heart, Moon, Sun } from 'lucide-react'
import { formatTime } from '@/lib/habit-utils'
import {
  MEALS,
  isSpecialDish,
  cleanDish,
  type MealMenu,
  type MealName,
} from '@/lib/mess-data'
import { useHabits } from '@/components/habits-provider'
import { cn } from '@/lib/utils'

const MEAL_ICON: Record<MealName, typeof Sun> = {
  Breakfast: Coffee,
  Lunch: Sun,
  Snacks: Cookie,
  Dinner: Moon,
}

function currentMeal(): MealName | null {
  const now = new Date().getHours() * 60 + new Date().getMinutes()
  const active = MEALS.filter((m) => {
    const [h, mm] = m.time.split(':').map(Number)
    return now >= h * 60 + mm - 30
  })
  return active.length ? active[active.length - 1].name : null
}

export function MealCard({ menu }: { menu: MealMenu }) {
  const { mealConfig, isMealEaten, markMealEaten, toggleFavorite, isFavorite } =
    useHabits()
  const meta = MEALS.find((m) => m.name === menu.meal)!
  const Icon = MEAL_ICON[menu.meal]
  const eaten = isMealEaten(menu.meal)
  const cfg = mealConfig[menu.meal]
  const isNow = currentMeal() === menu.meal
  const hasItems = menu.items.length > 0
  const hasFavorite = menu.items.some((d) => isFavorite(cleanDish(d)))

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-3xl border p-5 transition-colors',
        isNow
          ? 'border-primary bg-primary-container/40'
          : 'border-border bg-surface-container-high',
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-2xl',
            eaten
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary-container text-on-primary-container',
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{menu.meal}</h3>
            {isNow && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                Now
              </span>
            )}
            {hasFavorite && (
              <Heart className="size-4 fill-red-500 text-red-500" />
            )}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{meta.window}</span>
            {cfg?.enabled && (
              <span
                aria-hidden="true"
                className="size-1 rounded-full bg-muted-foreground/40"
              />
            )}
            {cfg?.enabled && (
              <span className="inline-flex items-center gap-0.5">
                <Bell className="size-3" />
                {formatTime(cfg.time)}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => markMealEaten(menu.meal)}
          disabled={eaten}
          aria-label={eaten ? `${menu.meal} eaten` : `Mark ${menu.meal} eaten`}
          className={cn(
            'state-layer flex size-10 items-center justify-center rounded-full border-2 transition-colors',
            eaten
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary',
          )}
        >
          <Check className="size-5" />
        </button>
      </div>

      {hasItems ? (
        <ul className="flex flex-col gap-1.5 pl-1">
          {menu.items.map((raw, i) => {
            const dish = cleanDish(raw)
            const special = isSpecialDish(raw)
            const fav = isFavorite(dish)
            return (
              <li
                key={`${dish}-${i}`}
                className="flex items-center justify-between gap-2"
              >
                <span
                  className={cn(
                    'flex items-center gap-2 text-sm',
                    special && 'font-semibold text-on-primary-container',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'size-1.5 rounded-full',
                      special ? 'bg-primary' : 'bg-muted-foreground/40',
                    )}
                  />
                  {dish}
                  {special && (
                    <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Special
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => toggleFavorite(dish)}
                  aria-label={
                    fav ? `Remove ${dish} from favourites` : `Favourite ${dish}`
                  }
                  aria-pressed={fav}
                  className="state-layer flex size-7 items-center justify-center rounded-full text-muted-foreground hover:text-red-500"
                >
                  <Heart
                    className={cn(
                      'size-4',
                      fav && 'fill-red-500 text-red-500',
                    )}
                  />
                </button>
              </li>
            )
          })}
          {menu.common && (
            <li className="mt-0.5 text-xs text-muted-foreground">
              + {menu.common}
            </li>
          )}
        </ul>
      ) : (
        <p className="pl-1 text-sm text-muted-foreground">
          No menu listed for this meal today.
        </p>
      )}
    </div>
  )
}
