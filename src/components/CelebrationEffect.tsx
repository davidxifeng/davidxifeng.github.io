import { motion } from 'motion/react'
import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  delay: number
  size: number
}

interface CelebrationEffectProps {
  trigger: boolean
  triggerElement: HTMLElement | null
  onComplete?: () => void
}

const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function CelebrationEffect({ trigger, triggerElement, onComplete }: CelebrationEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [show, setShow] = useState(false)
  const [centerPosition, setCenterPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (trigger) {
      setShow(true)
      
      // Calculate center position relative to viewport
      if (triggerElement) {
        const rect = triggerElement.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        setCenterPosition({ x: centerX, y: centerY })
      } else {
        // Fallback to center of screen if no trigger element
        setCenterPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      }

      // Generate particles with more natural spread
      const newParticles = Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.8
        const velocity = 80 + Math.random() * 60 // 80-140px spread
        
        return {
          id: i,
          x: 0,
          y: 0,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.2,
          size: 2 + Math.random() * 3, // 2-5px
        }
      })
      setParticles(newParticles)

      // Auto cleanup
      const timer = setTimeout(() => {
        setShow(false)
        setParticles([])
        onComplete?.()
      }, 1200)

      return () => clearTimeout(timer)
    }
  }, [trigger, triggerElement, onComplete])

  if (!show) return null

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            left: centerPosition.x,
            top: centerPosition.y,
            boxShadow: `0 0 8px ${particle.color}40`,
          }}
          initial={{
            scale: 0,
            x: 0,
            y: 0,
            opacity: 0,
          }}
          animate={{
            scale: [0, 1.2, 1, 0.8, 0],
            x: [0, particle.vx * 0.3, particle.vx * 0.7, particle.vx],
            y: [0, particle.vy * 0.3, particle.vy * 0.7, particle.vy + 20], // Add gravity effect
            opacity: [0, 1, 1, 0.8, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 1.0,
            delay: particle.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      ))}
      
      {/* Center burst effect */}
      <motion.div
        className="absolute"
        style={{
          left: centerPosition.x,
          top: centerPosition.y,
          width: 40,
          height: 40,
          marginLeft: -20,
          marginTop: -20,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1.8, 0], 
          opacity: [0, 0.8, 0],
        }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0.1) 50%, transparent 100%)',
          }}
        />
      </motion.div>

      {/* Additional ring effect */}
      <motion.div
        className="absolute border-2 border-green-400 rounded-full"
        style={{
          left: centerPosition.x,
          top: centerPosition.y,
          width: 20,
          height: 20,
          marginLeft: -10,
          marginTop: -10,
        }}
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ 
          scale: [0, 3], 
          opacity: [0.8, 0],
        }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
      />
    </div>,
    document.body
  )
}