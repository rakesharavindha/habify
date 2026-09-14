'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type ThemeMode = 'light' | 'dark' | 'oled'

export type AccentPreset = {
  id: string
  name: string
  hue: number
  chroma: number
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'indigo', name: 'Indigo', hue: 268, chroma: 0.14 },
  { id: 'violet', name: 'Violet', hue: 300, chroma: 0.14 },
  { id: 'blue', name: 'Blue', hue: 245, chroma: 0.14 },
  { id: 'cyan', name: 'Cyan', hue: 215, chroma: 0.12 },
  { id: 'teal', name: 'Teal', hue: 180, chroma: 0.11 },
  { id: 'green', name: 'Green', hue: 150, chroma: 0.13 },
  { id: 'lime', name: 'Lime', hue: 130, chroma: 0.15 },
  { id: 'amber', name: 'Amber', hue: 75, chroma: 0.15 },
  { id: 'orange', name: 'Orange', hue: 55, chroma: 0.16 },
  { id: 'rose', name: 'Rose', hue: 12, chroma: 0.16 },
  { id: 'pink', name: 'Pink', hue: 350, chroma: 0.15 },
  { id: 'crimson', name: 'Crimson', hue: 25, chroma: 0.17 },
]

type ThemeContextValue = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  accent: string
  setAccent: (id: string) => void
  accentPreset: AccentPreset
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const MODE_KEY = 'habit.theme.mode'
const ACCENT_KEY = 'habit.theme.accent'

function applyTheme(mode: ThemeMode, preset: AccentPreset) {
  const root = document.documentElement
  root.classList.remove('light', 'dark', 'oled')
  root.classList.add(mode)
  root.style.setProperty('--seed-h', String(preset.hue))
  root.style.setProperty('--seed-c', String(preset.chroma))
  root.style.colorScheme = mode === 'light' ? 'light' : 'dark'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark')
  const [accent, setAccentState] = useState<string>('indigo')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedMode = (localStorage.getItem(MODE_KEY) as ThemeMode) || 'dark'
    const savedAccent = localStorage.getItem(ACCENT_KEY) || 'indigo'
    setModeState(savedMode)
    setAccentState(savedAccent)
    setMounted(true)
  }, [])

  const accentPreset = useMemo(
    () => ACCENT_PRESETS.find((p) => p.id === accent) ?? ACCENT_PRESETS[0],
    [accent],
  )

  useEffect(() => {
    if (!mounted) return
    applyTheme(mode, accentPreset)
  }, [mode, accentPreset, mounted])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    localStorage.setItem(MODE_KEY, next)
  }, [])

  const setAccent = useCallback((id: string) => {
    setAccentState(id)
    localStorage.setItem(ACCENT_KEY, id)
  }, [])

  const value = useMemo(
    () => ({ mode, setMode, accent, setAccent, accentPreset }),
    [mode, setMode, accent, setAccent, accentPreset],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

/** Inline script to set the theme before hydration and avoid a flash. */
export const themeInitScript = `
(function() {
  try {
    var presets = ${JSON.stringify(
      Object.fromEntries(ACCENT_PRESETS.map((p) => [p.id, p])),
    )};
    var mode = localStorage.getItem('${MODE_KEY}') || 'dark';
    var accent = localStorage.getItem('${ACCENT_KEY}') || 'indigo';
    var p = presets[accent] || presets['indigo'];
    var root = document.documentElement;
    root.classList.remove('light','dark','oled');
    root.classList.add(mode);
    root.style.setProperty('--seed-h', String(p.hue));
    root.style.setProperty('--seed-c', String(p.chroma));
    root.style.colorScheme = mode === 'light' ? 'light' : 'dark';
  } catch (e) {}
})();
`
