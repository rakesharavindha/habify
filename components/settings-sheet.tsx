'use client'

import { Check, Moon, Smartphone, Sun, X } from 'lucide-react'
import { useEffect } from 'react'
import {
  ACCENT_PRESETS,
  useTheme,
  type ThemeMode,
} from '@/components/theme-provider'
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
        aria-label="Appearance settings"
        className="relative z-10 flex h-full w-full max-w-sm animate-scale-in flex-col overflow-y-auto bg-surface-container shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">
              Material You theming
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
            <p className="text-xs text-muted-foreground">
              The accent seeds the entire palette, just like Material You.
            </p>
          </section>
        </div>
      </aside>
    </div>
  )
}
