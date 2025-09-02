import { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'

interface GlowingCardProps {
  children: ReactNode
  className?: string
  glowColor?: string
}

export default function GlowingCard({
  children,
  className,
  glowColor = 'rgba(59, 130, 246, 0.5)', // blue-500
}: GlowingCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        'relative p-6 rounded-xl bg-black/20 backdrop-blur-lg border border-white/10 transition-all duration-300',
        isHovered ? 'scale-105' : '',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered
          ? `0 20px 40px ${glowColor}, 0 0 20px ${glowColor}`
          : '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="relative z-10">{children}</div>
      {isHovered && (
        <div
          className="absolute inset-0 rounded-xl opacity-20 blur-xl"
          style={{ backgroundColor: glowColor }}
        />
      )}
    </div>
  )
}