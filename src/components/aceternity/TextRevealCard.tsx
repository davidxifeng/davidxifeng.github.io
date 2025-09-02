import { motion } from 'motion/react'
import { useState } from 'react'

interface TextRevealCardProps {
  text: string
  revealText: string
  className?: string
}

export function TextRevealCard({
  text,
  revealText,
  className = ''
}: TextRevealCardProps) {
  const [widthPercentage, setWidthPercentage] = useState(0)

  return (
    <div
      onMouseEnter={() => setWidthPercentage(100)}
      onMouseLeave={() => setWidthPercentage(0)}
      className={`bg-[#1d1c20] border border-white/[0.2] w-full relative overflow-hidden rounded-lg p-8 ${className}`}
    >
      <div className="h-40 relative flex items-center overflow-hidden">
        <motion.div
          style={{
            width: `${widthPercentage}%`,
          }}
          transition={{
            duration: 0.4,
            ease: 'easeInOut',
          }}
          className="absolute bg-[#323238] h-full will-change-transform"
        ></motion.div>

        <div className="relative flex items-center z-10">
          <div
            className={`absolute text-white text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-300`}
          >
            {text}
          </div>
          <motion.div
            style={{
              width: `${widthPercentage}%`,
            }}
            className="absolute bg-black h-full top-0 overflow-hidden text-white"
          >
            <div className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-300">
              {revealText}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}