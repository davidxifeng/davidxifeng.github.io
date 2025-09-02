import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AuroraBackgroundProps {
  children: ReactNode
  className?: string
  showRadialGradient?: boolean
}

export default function AuroraBackground({
  children,
  className,
  showRadialGradient = true,
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col h-screen overflow-hidden bg-zinc-950',
        className
      )}
    >
      <div className="absolute inset-0">
        <div
          className={cn(
            'absolute inset-0 opacity-50',
            showRadialGradient &&
              'bg-gradient-to-r from-transparent via-blue-900/20 to-transparent'
          )}
        />
        {/* Aurora effect */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-pink-500 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-500 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
          <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-cyan-500 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '6s' }}></div>
        </div>
      </div>
      <div className="relative z-10 flex-1">{children}</div>
    </div>
  )
}