import { useThemeStore, type Theme } from '@/core/stores/themeStore'

export interface UseThemeReturn {
  theme: Theme
  isDark: boolean
  setTheme: (theme: Theme) => void
  toggle: () => void
}

export function useTheme(): UseThemeReturn {
  const { theme, setTheme } = useThemeStore()

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  const toggle = () => setTheme(isDark ? 'light' : 'dark')

  return { theme, isDark, setTheme, toggle }
}
