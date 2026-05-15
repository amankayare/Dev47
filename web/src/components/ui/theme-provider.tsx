import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  /** If true, saves/restores the previous documentElement classes on unmount */
  scoped?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  scoped = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    // Resolve the actual theme (handle 'system')
    const resolvedTheme = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme

    if (scoped) {
      // Admin mode: save the current portfolio theme class so we can restore it on unmount
      const prevLight = root.classList.contains("light")
      const prevDark = root.classList.contains("dark")

      root.classList.remove("light", "dark")
      root.classList.add(resolvedTheme)

      return () => {
        // Restore portfolio theme on admin unmount
        root.classList.remove("light", "dark")
        if (prevDark) root.classList.add("dark")
        else if (prevLight) root.classList.add("light")
      }
    } else {
      root.classList.remove("light", "dark")
      root.classList.add(resolvedTheme)
    }
  }, [theme, scoped])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
