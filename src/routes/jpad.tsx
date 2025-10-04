import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/jpad')({
  component: RouteComponent,
})

interface VocabItem {
  word: string
  reading: string
  meaning: string
}

interface TextSegment {
  text: string
  ruby?: string
  translation?: string
}

interface ProcessedSentence {
  segments: TextSegment[]
  translation: string
}

function RouteComponent() {
  const [rawInput, setRawInput] = useState('')
  const [processedText, setProcessedText] = useState<ProcessedSentence[]>([])
  const [vocabulary, setVocabulary] = useState<VocabItem[]>([
    { word: '本当', reading: 'ほんとう', meaning: '真正的' },
    { word: '準備', reading: 'じゅんび', meaning: '准备' },
  ])
  const [showRuby, setShowRuby] = useState(true)
  const [showTranslation, setShowTranslation] = useState(false)
  const [selectedNote, setSelectedNote] = useState<VocabItem | null>(null)

  // 示例处理后的文本
  const exampleText: ProcessedSentence[] = [
    {
      segments: [
        { text: '日本語', ruby: 'にほんご' },
        { text: 'が' },
        { text: 'なり', ruby: 'なり' },
        { text: 'お', ruby: 'お' },
        { text: '上手', ruby: 'じょうず' },
        { text: 'ですね。' },
      ],
      translation: '你的日语相当不错呢。',
    },
    {
      segments: [
        { text: 'すいません、' },
        { text: '実', ruby: 'じつ' },
        { text: 'は' },
        { text: '先', ruby: 'さき' },
        { text: 'の' },
        { text: '自己紹介', ruby: 'じこしょうかい' },
        { text: 'は' },
        { text: '準備', ruby: 'じゅんび' },
        { text: 'した' },
        { text: '内容', ruby: 'ないよう' },
        { text: 'です。' },
      ],
      translation: '抱歉，其实刚才的自我介绍是准备好的内容。',
    },
    {
      segments: [
        { text: '私', ruby: 'わたし' },
        { text: 'の' },
        { text: '本当', ruby: 'ほんとう' },
        { text: 'の' },
        { text: '日本語力', ruby: 'にほんごりょく' },
        { text: 'はより' },
        { text: '高', ruby: 'たか' },
        { text: 'いです。' },
      ],
      translation: '我真正的日语水平更高一些。',
    },
  ]

  const handleProcess = () => {
    // 简单处理：使用示例文本
    if (rawInput) {
      setProcessedText(exampleText)
    }
  }

  const handleClear = () => {
    setRawInput('')
    setProcessedText([])
  }

  const handleAddToVocab = (word: string, reading: string, meaning: string) => {
    const exists = vocabulary.find((v) => v.word === word)
    if (!exists) {
      setVocabulary([...vocabulary, { word, reading, meaning }])
    }
  }

  const handleRemoveVocab = (word: string) => {
    setVocabulary(vocabulary.filter((v) => v.word !== word))
    if (selectedNote?.word === word) {
      setSelectedNote(null)
    }
  }

  const handleExportVocab = () => {
    const text = vocabulary.map((v) => `${v.word}\t${v.reading}\t${v.meaning}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vocabulary.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full bg-stone-100 dark:bg-stone-900 overflow-hidden">
      <div className="container mx-auto p-4 h-full">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* 左侧栏：输入和词汇表 */}
          <div className="col-span-3 flex flex-col gap-4">
            {/* Raw Input */}
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-sm font-medium">Raw ASR Input</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
                <Textarea
                  placeholder="日本語がひと上手ですね。すいません、実は先の自己紹介は準備した内容です。"
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  className="flex-1 resize-none text-sm min-h-0"
                />
                <div className="flex gap-2 flex-shrink-0">
                  <Button onClick={handleProcess} className="flex-1">
                    Process
                  </Button>
                  <Button onClick={handleClear} variant="outline" className="flex-1">
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* My Vocabulary */}
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">My Vocabulary</CardTitle>
                  <span className="text-xs bg-black text-white rounded-full px-2 py-0.5">
                    {vocabulary.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
                <ScrollArea className="flex-1 min-h-0">
                  <div className="space-y-2">
                    {vocabulary.map((item, index) => (
                      <div
                        key={index}
                        className={`group p-3 border rounded transition-colors relative ${
                          selectedNote?.word === item.word
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                            : 'hover:bg-stone-50 dark:hover:bg-stone-800'
                        }`}
                      >
                        <div onClick={() => setSelectedNote(item)} className="cursor-pointer">
                          <div className="font-medium text-base pr-6">{item.word}</div>
                          <div className="text-xs text-stone-500 mt-1">{item.reading}</div>
                          <div className="text-sm mt-1">{item.meaning}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveVocab(item.word)
                          }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button onClick={handleExportVocab} variant="outline" size="sm" className="w-full">
                  Export List
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 中间栏：阅读区域 */}
          <div className="col-span-6">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Reading Area</CardTitle>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="ruby-toggle"
                        checked={showRuby}
                        onCheckedChange={setShowRuby}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <Label
                        htmlFor="ruby-toggle"
                        className="text-sm font-medium cursor-pointer select-none w-12 transition-colors"
                        style={{ color: showRuby ? 'rgb(37 99 235)' : undefined }}
                      >
                        Ruby
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="translation-toggle"
                        checked={showTranslation}
                        onCheckedChange={setShowTranslation}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <Label
                        htmlFor="translation-toggle"
                        className="text-sm font-medium cursor-pointer select-none w-8 transition-colors"
                        style={{ color: showTranslation ? 'rgb(22 163 74)' : undefined }}
                      >
                        中文
                      </Label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="space-y-6 text-lg leading-relaxed pr-4">
                    {processedText.length > 0 ? (
                      <div className="space-y-6">
                        {processedText.map((sentence, sentenceIndex) => (
                          <div key={sentenceIndex} className="border-b pb-6">
                            <div className="text-xl font-medium mb-3 leading-loose">
                              {sentence.segments.map((segment, segmentIndex) => (
                                <span key={segmentIndex}>
                                  {segment.ruby && showRuby ? (
                                    <ruby className="cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900 px-0.5 rounded">
                                      {segment.text}
                                      <rt className="text-xs">{segment.ruby}</rt>
                                    </ruby>
                                  ) : (
                                    <span className="cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900 px-0.5 rounded">
                                      {segment.text}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                            {showTranslation && (
                              <p className="text-sm text-stone-600 dark:text-stone-400 mt-2">
                                {sentence.translation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-stone-400 mt-20">
                        <p>请在左侧输入日文文本并点击 Process</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* 右侧栏：语法和词汇注释 */}
          <div className="col-span-3">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-sm font-medium">Grammar & Vocab Notes</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="space-y-4 text-sm pr-4">
                    {selectedNote ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                          <div className="text-2xl font-bold mb-2">{selectedNote.word}</div>
                          <div className="text-lg text-blue-600 dark:text-blue-400 mb-3">
                            {selectedNote.reading}
                          </div>
                          <div className="text-base">{selectedNote.meaning}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded">
                        <p className="text-xs text-stone-500 mb-1">提示</p>
                        <p>点击词汇表中的单词查看详细注释</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
