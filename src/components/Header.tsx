import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/blog', label: 'Blog' },
  { to: '/todo', label: 'Todo' },
  { to: '/showcase', label: 'Showcase' },
  { to: '/player', label: 'Player' },
  { to: '/about', label: 'About' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <nav className="flex h-14 items-center justify-between">
          <div className="mr-6 flex items-center space-x-2">
            <Link to="/" className="font-bold text-xl hover:text-primary transition-colors">
              Playground
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-medium transition-colors hover:text-primary relative group"
                activeProps={{
                  className: 'text-primary font-semibold',
                }}
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
            <ThemeToggle />
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="flex items-center space-x-3">
              {navItems.slice(0, 3).map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-xs font-medium transition-colors hover:text-primary px-2 py-1 rounded"
                  activeProps={{
                    className: 'text-primary font-semibold bg-primary/10',
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <ThemeToggle />
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}
