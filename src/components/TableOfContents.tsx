import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

export interface TOCItem {
  id: string
  text: string
  level: number
}

export function TableOfContents() {
  const [toc, setToc] = useState<TOCItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  // Extract headings from DOM after component mounts
  useEffect(() => {
    const extractHeadings = () => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const headings: TOCItem[] = []

      headingElements.forEach((heading) => {
        const id = heading.id || heading.textContent?.toLowerCase().replace(/[^\w\s\u4e00-\u9fff-]/g, '').replace(/\s+/g, '-') || ''
        const text = heading.textContent || ''
        const level = parseInt(heading.tagName.charAt(1))

        if (id && text) {
          // Ensure heading has an ID
          if (!heading.id) {
            heading.id = id
          }

          headings.push({
            id,
            text,
            level,
          })
        }
      })

      setToc(headings)
    }

    // Wait a bit for MDX content to render
    const timer = setTimeout(extractHeadings, 100)
    return () => clearTimeout(timer)
  }, [])

  // Handle scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const headings = toc.map(item => {
        const element = document.getElementById(item.id)
        if (element) {
          const rect = element.getBoundingClientRect()
          return {
            id: item.id,
            top: rect.top,
          }
        }
        return { id: item.id, top: Infinity }
      })

      // Find the heading that's currently visible
      const current = headings
        .filter(h => h.top <= 150) // Account for header height
        .sort((a, b) => b.top - a.top)[0]

      if (current) {
        setActiveId(current.id)
      }
    }

    if (toc.length > 0) {
      window.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll() // Initial call

      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [toc])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -120 // Account for fixed header and some padding
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  if (toc.length === 0) return null

  return (
    <div className="sticky top-24">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          目录
        </h3>
      </div>
      <nav className="space-y-1">
        {toc.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => scrollToHeading(item.id)}
            className={`
              block w-full text-left text-sm transition-colors duration-200 py-1 px-2 rounded
              ${activeId === item.id 
                ? 'text-primary bg-primary/10 border-l-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }
            `}
            style={{
              paddingLeft: `${(item.level - 1) * 12 + 8}px`,
            }}
          >
            <span className="block truncate">
              {item.text}
            </span>
          </motion.button>
        ))}
      </nav>
    </div>
  )
}