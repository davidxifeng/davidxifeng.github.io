import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeStore {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  initializeTheme: () => void
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const updateDocumentClass = (theme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return
  
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(theme)
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',

      setTheme: (theme: Theme) => {
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
        
        set({ theme, resolvedTheme })
        updateDocumentClass(resolvedTheme)
      },

      initializeTheme: () => {
        const { theme } = get()
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
        
        set({ resolvedTheme })
        updateDocumentClass(resolvedTheme)

        // Listen for system theme changes
        if (typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handleChange = () => {
            const currentTheme = get().theme
            if (currentTheme === 'system') {
              const newResolvedTheme = getSystemTheme()
              set({ resolvedTheme: newResolvedTheme })
              updateDocumentClass(newResolvedTheme)
            }
          }

          mediaQuery.addEventListener('change', handleChange)
          return () => mediaQuery.removeEventListener('change', handleChange)
        }
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)