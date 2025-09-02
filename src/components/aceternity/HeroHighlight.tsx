import { motion } from 'motion/react'
import { ReactNode } from 'react'

export interface HeroHighlightProps {
  children: ReactNode
  className?: string
}

export interface HighlightProps {
  children: ReactNode
  className?: string
}

export function HeroHighlight({ children, className }: HeroHighlightProps) {
  return (
    <div
      className={`relative bg-transparent overflow-hidden h-[40rem] flex flex-col items-center justify-center ${className}`}
    >
      <div className="absolute inset-0 bg-transparent" />
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: [20, -5, 0],
        }}
        transition={{
          duration: 0.5,
          ease: [0.4, 0.0, 0.2, 1],
        }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  )
}

export function Highlight({ children, className }: HighlightProps) {
  return (
    <motion.span
      initial={{
        backgroundSize: '0% 100%',
      }}
      animate={{
        backgroundSize: '100% 100%',
      }}
      transition={{
        duration: 2,
        ease: 'linear',
        delay: 0.5,
      }}
      style={{
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left center',
        display: 'inline',
      }}
      className={`relative inline-block pb-1 px-1 rounded-lg bg-gradient-to-r from-indigo-300 to-purple-300 dark:from-indigo-500 dark:to-purple-500 ${className}`}
    >
      {children}
    </motion.span>
  )
}