'use client'

import { Bell, Check, Heart, Moon, Smartphone, Sun, X } from 'lucide-react'
import { useEffect } from 'react'
import {
  ACCENT_PRESETS,
  useTheme,
  type ThemeMode,
} from '@/components/theme-provider'
import { useHabits } from '@/components/habits-provider'
import { MEALS, MESS_OPTIONS } from '@/lib/mess-data'
import { cn } from '@/lib/utils'

const MODES: { id: ThemeMode; label: string; desc: string; icon: typeof Sun }[] =
  [
    { id: 'light', label: 'Light', desc: 'Bright surfaces', icon: Sun },
    { id: 'dark', label: 'Dark', desc: 'Dim Material dark', icon: Moon },
    {
      id: 'oled',
      label: 'OLED',
      desc: 'True black for AMOLED',
      icon: Smartphone,
    },
  ]

export function SettingsSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { mode, setMode, accent, setAccent } = useTheme()
  const {
    mess,
    setMess,
    mealConfig,
    toggleMeal,
    setMealTime,
    previewMeal,
    favorites,
    toggleFavorite,
  } = useHabits()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="relative z-10 flex h-full w-full max-w-sm animate-scale-in flex-col overflow-y-auto bg-surface-container shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">Settings</h2>
            <p className="text-sm text-muted-foreground">
              Mess, meal alarms &amp; theme
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="state-layer flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-8 px-6 pb-10">
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Your mess
            </h3>
            <div className="flex flex-col gap-2">
              {MESS_OPTIONS.map((m) => {
                const active = mess === m.value
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMess(m.value)}
                    aria-pressed={active}
                    className={cn(
                      'state-layer flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors',
                      active
                        ? 'border-primary bg-primary-container'
                        : 'border-border bg-surface-container-high',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/40',
                      )}
                    >
                      {active && <Check className="size-3.5" />}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        active && 'text-on-primary-container',
                      )}
                    >
                      {m.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Meal alarms
            </h3>
            <div className="flex flex-col gap-2">
              {MEALS.map((meal) => {
                const cfg = mealConfig[meal.name]
                return (
                  <div
                    key={meal.name}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-surface-container-high p-3"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMeal(meal.name)}
                      role="switch"
                      aria-checked={cfg.enabled}
                      aria-label={`Toggle ${meal.name} alarm`}
                      className={cn(
                        'relative h-6 w-10 shrink-0 rounded-full transition-colors',
                        cfg.enabled ? 'bg-primary' : 'bg-muted-foreground/30',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 size-5 rounded-full bg-white transition-transform',
                          cfg.enabled ? 'translate-x-4' : 'translate-x-0.5',
                        )}
                      />
                    </button>
                    <span className="flex-1 text-sm font-medium">
                      {meal.name}
                    </span>
                    <input
                      type="time"
                      value={cfg.time}
                      onChange={(e) => setMealTime(meal.name, e.target.value)}
                      aria-label={`${meal.name} alarm time`}
                      className="rounded-lg bg-background px-2 py-1 text-sm tabular-nums outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => previewMeal(meal.name)}
                      aria-label={`Preview ${meal.name} alarm`}
                      className="state-layer flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-primary"
                    >
                      <Bell className="size-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>

          {favorites.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Favourite dishes
              </h3>
              <div className="flex flex-wrap gap-2">
                {favorites.map((dish) => (
                  <button
                    key={dish}
                    type="button"
                    onClick={() => toggleFavorite(dish)}
                    aria-label={`Remove ${dish} from favourites`}
                    className="state-layer inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-500"
                  >
                    <Heart className="size-3.5 fill-red-500" />
                    {dish}
                    <X className="size-3.5" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground">Theme</h3>
            <div className="flex flex-col gap-2">
              {MODES.map((m) => {
                const Icon = m.icon
                const active = mode === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    aria-pressed={active}
                    className={cn(
                      'state-layer flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors',
                      active
                        ? 'border-primary bg-primary-container'
                        : 'border-border bg-surface-container-high',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-10 items-center justify-center rounded-xl',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground',
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="flex-1">
                      <span
                        className={cn(
                          'block text-sm font-semibold',
                          active && 'text-on-primary-container',
                        )}
                      >
                        {m.label}
                      </span>
                      <span
                        className={cn(
                          'block text-xs',
                          active
                            ? 'text-on-primary-container/80'
                            : 'text-muted-foreground',
                        )}
                      >
                        {m.desc}
                      </span>
                    </span>
                    {active && (
                      <Check className="size-5 text-on-primary-container" />
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Accent color
            </h3>
            <div className="grid grid-cols-6 gap-3">
              {ACCENT_PRESETS.map((p) => {
                const active = accent === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-label={p.name}
                    aria-pressed={active}
                    onClick={() => setAccent(p.id)}
                    className="flex aspect-square items-center justify-center rounded-full transition-transform active:scale-90"
                    style={{
                      background: `oklch(0.62 ${p.chroma} ${p.hue})`,
                      outline: active
                        ? '2px solid var(--foreground)'
                        : '2px solid transparent',
                      outlineOffset: 3,
                    }}
                  >
                    {active && (
                      <Check
                        className="size-5"
                        style={{ color: `oklch(0.98 0.02 ${p.hue})` }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}
