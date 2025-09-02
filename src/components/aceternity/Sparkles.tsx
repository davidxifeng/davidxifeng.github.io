import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

interface SparklesProps {
  className?: string
  particleCount?: number
  particleColor?: string
}

export default function Sparkles({
  className = '',
  particleCount = 50,
  particleColor = '#ffffff',
}: SparklesProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const newParticles: Particle[] = []
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 5,
      })
    }
    setParticles(newParticles)
  }, [particleCount])

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particleColor,
            borderRadius: '50%',
            boxShadow: `0 0 ${particle.size * 2}px ${particleColor}`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  )
}