import { useState } from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Volume2 } from 'lucide-react'

interface WordHoverPopoverProps {
  word: string
  reading?: string
  children: React.ReactNode
  onWordClick?: (word: string) => void
}

// 简单的词典数据 (后续可以接入真实 API)
const simpleDictionary: Record<string, { meanings: string[]; examples?: string[] }> = {
  当社: {
    meanings: ['our company', '本公司', '敝公司'],
    examples: ['当社の製品は世界中で愛用されています。'],
  },
  業務: {
    meanings: ['business', 'operations', '业务', '工作'],
    examples: ['業務を効率化する。'],
  },
  経営: {
    meanings: ['management', 'administration', '经营', '管理'],
    examples: ['会社を経営する。'],
  },
  会社: {
    meanings: ['company', 'corporation', '公司'],
    examples: ['会社員として働く。'],
  },
  募集: {
    meanings: ['recruitment', 'collection', '招募', '征集'],
    examples: ['社員を募集する。'],
  },
  疑問: {
    meanings: ['question', 'doubt', '疑问', '怀疑'],
    examples: ['疑問に思う。'],
  },
  合併: {
    meanings: ['merger', 'consolidation', '合并', '兼并'],
    examples: ['会社が合併する。'],
  },
}

export default function WordHoverPopover({ word, reading, children, onWordClick }: WordHoverPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dictEntry = simpleDictionary[word]

  const handleWordClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onWordClick) {
      onWordClick(word)
    }
  }

  // 如果没有词典条目，不显示悬停卡片
  if (!dictEntry) {
    return (
      <span onClick={handleWordClick} className="cursor-pointer hover:opacity-75 px-0.5 rounded transition-opacity">
        {children}
      </span>
    )
  }

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen} openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span
          onClick={handleWordClick}
          className="cursor-pointer hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30 px-0.5 rounded transition-colors underline decoration-dotted decoration-1 underline-offset-2"
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="top" align="start">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-bold">{word}</h4>
              {reading && <p className="text-sm text-muted-foreground">{reading}</p>}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onWordClick) onWordClick(word)
              }}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              title="发音"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">释义</p>
            <ul className="space-y-1">
              {dictEntry.meanings.map((meaning, index) => (
                <li key={index} className="text-sm pl-2 border-l-2 border-primary/30">
                  {meaning}
                </li>
              ))}
            </ul>
          </div>

          {dictEntry.examples && dictEntry.examples.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground">例句</p>
              <ul className="space-y-1">
                {dictEntry.examples.map((example, index) => (
                  <li key={index} className="text-sm text-muted-foreground italic">
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
