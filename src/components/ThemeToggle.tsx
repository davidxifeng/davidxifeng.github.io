import { useThemeStore, type Theme } from '@/stores/themeStore'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sun, Moon, Monitor, Check } from 'lucide-react'

const themeConfigs = [
  {
    value: 'light' as Theme,
    icon: Sun,
    label: 'Light',
    description: 'Light mode',
  },
  {
    value: 'dark' as Theme,
    icon: Moon,
    label: 'Dark', 
    description: 'Dark mode',
  },
  {
    value: 'system' as Theme,
    icon: Monitor,
    label: 'System',
    description: 'System preference',
  },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()

  const currentConfig = themeConfigs.find(config => config.value === theme)
  const CurrentIcon = currentConfig?.icon || Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 p-0 transition-all duration-200 hover:bg-accent data-[state=open]:bg-accent"
        >
          <CurrentIcon className="h-4 w-4 transition-all duration-200 data-[state=open]:rotate-90" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="min-w-[180px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-gray-200 dark:border-slate-700"
        sideOffset={8}
      >
        {themeConfigs.map((config) => {
          const IconComponent = config.icon
          const isSelected = theme === config.value
          
          return (
            <DropdownMenuItem
              key={config.value}
              onClick={() => setTheme(config.value)}
              className={`
                flex items-center gap-3 px-3 py-3 cursor-pointer
                transition-all duration-200
                hover:bg-accent hover:text-accent-foreground
                focus:bg-accent focus:text-accent-foreground
                ${isSelected ? 'bg-accent/50' : ''}
                group
              `}
            >
              <div className="relative flex items-center justify-center w-4 h-4">
                <IconComponent className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                {isSelected && (
                  <Check className="h-3 w-3 absolute -top-1 -right-2 text-primary animate-in zoom-in-75 duration-200" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{config.label}</div>
                <div className="text-xs text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity">
                  {config.description}
                </div>
              </div>
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}