import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import ReadingSettingsPanel from '@/components/ReadingSettingsPanel'
import WordHoverPopover from '@/components/WordHoverPopover'
import { useReadingSettings } from '@/stores/readingSettingsStore'
import { useTTS } from '@/hooks/useTTS'
import { Play, Square } from 'lucide-react'

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

// 示例处理后的文本
const exampleText: ProcessedSentence[] = [
  {
    segments: [
      { text: 'はい、' },
      { text: 'まず' },
      { text: '当社', ruby: 'とうしゃ' },
      { text: 'ですね、' },
      { text: 'すごい株式会社', ruby: 'すごいかぶしきがいしゃ' },
      { text: 'なんですけど、' },
      { text: 'メイン', ruby: 'めいん' },
      { text: 'の' },
      { text: '業務', ruby: 'ぎょうむ' },
      { text: 'いったところで' },
      { text: '言', ruby: 'い' },
      { text: 'うと、' },
      { text: '実', ruby: 'じつ' },
      { text: 'は' },
      { text: '経営', ruby: 'けいえい' },
      { text: 'コンサルティング' },
      { text: 'を' },
      { text: 'やってる' },
      { text: '会社', ruby: 'かいしゃ' },
      { text: 'になっております。' },
    ],
    translation: '好的，首先我们公司，超棒株式会社，主要业务其实是做经营咨询的公司。',
  },
  {
    segments: [
      { text: 'はい、' },
      { text: 'で' },
      { text: 'えっと' },
      { text: 'じゃあ' },
      { text: 'なんで' },
      { text: 'そんな' },
      { text: 'コンサル' },
      { text: 'の' },
      { text: '会社', ruby: 'かいしゃ' },
      { text: 'が' },
      { text: 'エンジニア', ruby: 'えんじにあ' },
      { text: 'の' },
      { text: '募集', ruby: 'ぼしゅう' },
      { text: 'してるんだろう' },
      { text: 'って' },
      { text: 'いう' },
      { text: '疑問', ruby: 'ぎもん' },
      { text: 'があるかなとは' },
      { text: '思', ruby: 'おも' },
      { text: 'うんですけど。' },
    ],
    translation: '那么，可能会有疑问，为什么这样一个咨询公司要招聘工程师呢。',
  },
  {
    segments: [
      { text: '実際', ruby: 'じっさい' },
      { text: 'ですね、' },
      { text: 'ちょっと' },
      { text: '去年', ruby: 'きょねん' },
      { text: 'の' },
      { text: '4月', ruby: 'しがつ' },
      { text: 'にですね、' },
      { text: 'この' },
      { text: '本体', ruby: 'ほんたい' },
      { text: 'である' },
      { text: 'すごい株式会社', ruby: 'すごいかぶしきがいしゃ' },
      { text: 'と' },
      { text: '同', ruby: 'おな' },
      { text: 'じ' },
      { text: 'グループ' },
      { text: '内', ruby: 'ない' },
      { text: 'に' },
      { text: 'あった' },
      { text: 'すごいデジタル', ruby: 'すごいでじたる' },
      { text: 'っていう' },
      { text: '会社', ruby: 'かいしゃ' },
      { text: 'が' },
      { text: '合併', ruby: 'がっぺい' },
      { text: 'しました。' },
    ],
    translation: '实际上，去年四月，这个主体公司超棒株式会社，和同一集团内的超棒数字公司合并了。',
  },
  {
    segments: [
      { text: 'その' },
      { text: 'デジタル', ruby: 'でじたる' },
      { text: 'っていう' },
      { text: '会社', ruby: 'かいしゃ' },
      { text: 'は、' },
      { text: 'その' },
      { text: '名前', ruby: 'なまえ' },
      { text: 'の' },
      { text: '通', ruby: 'とお' },
      { text: 'り' },
      { text: 'デジタル' },
      { text: 'マーケティング' },
      { text: 'とか、' },
      { text: 'あとは' },
      { text: 'システム', ruby: 'しすてむ' },
      { text: '開発', ruby: 'かいはつ' },
      { text: 'を' },
      { text: '専門', ruby: 'せんもん' },
      { text: 'に' },
      { text: 'やってた' },
      { text: '会社', ruby: 'かいしゃ' },
      { text: 'なんですね。' },
    ],
    translation: '那个数字公司，顾名思义，是专门做数字营销和系统开发的公司。',
  },
  {
    segments: [
      { text: 'で、' },
      { text: '今回', ruby: 'こんかい' },
      { text: 'の' },
      { text: '合併', ruby: 'がっぺい' },
      { text: 'によって、' },
      { text: '本体', ruby: 'ほんたい' },
      { text: 'の' },
      { text: 'コンサルティング' },
      { text: '機能', ruby: 'きのう' },
      { text: 'と、' },
      { text: 'デジタル' },
      { text: 'の' },
      { text: '技術', ruby: 'ぎじゅつ' },
      { text: '開発', ruby: 'かいはつ' },
      { text: '機能', ruby: 'きのう' },
      { text: 'が' },
      { text: '一緒', ruby: 'いっしょ' },
      { text: 'に' },
      { text: 'なった' },
      { text: 'という' },
      { text: '形', ruby: 'かたち' },
      { text: 'ですね。' },
    ],
    translation: '通过这次合并，主体公司的咨询功能和数字公司的技术开发功能结合在一起了。',
  },
  {
    segments: [
      { text: 'これによって、' },
      { text: '私', ruby: 'わたし' },
      { text: 'たちは' },
      { text: '顧客', ruby: 'こきゃく' },
      { text: 'に' },
      { text: '対', ruby: 'たい' },
      { text: 'して' },
      { text: 'より' },
      { text: '包括的', ruby: 'ほうかつてき' },
      { text: 'な' },
      { text: 'ソリューション' },
      { text: 'を' },
      { text: '提供', ruby: 'ていきょう' },
      { text: 'できる' },
      { text: 'ように' },
      { text: 'なりました。' },
    ],
    translation: '通过这个，我们能够为客户提供更加全面的解决方案。',
  },
  {
    segments: [
      { text: '具体的', ruby: 'ぐたいてき' },
      { text: 'には、' },
      { text: '経営', ruby: 'けいえい' },
      { text: '課題', ruby: 'かだい' },
      { text: 'を' },
      { text: '分析', ruby: 'ぶんせき' },
      { text: 'して、' },
      { text: 'それを' },
      { text: '解決', ruby: 'かいけつ' },
      { text: 'する' },
      { text: 'ための' },
      { text: 'デジタル' },
      { text: 'ツール' },
      { text: 'を' },
      { text: '開発', ruby: 'かいはつ' },
      { text: 'したり、' },
      { text: 'あるいは' },
      { text: '既存', ruby: 'きそん' },
      { text: 'の' },
      { text: 'システム', ruby: 'しすてむ' },
      { text: 'を' },
      { text: '改善', ruby: 'かいぜん' },
      { text: 'したり' },
      { text: 'できます。' },
    ],
    translation: '具体来说，我们可以分析经营课题，为了解决这些问题开发数字工具，或者改善现有系统。',
  },
  {
    segments: [
      { text: 'また、' },
      { text: '最近', ruby: 'さいきん' },
      { text: 'では' },
      { text: 'AI' },
      { text: 'や' },
      { text: '機械', ruby: 'きかい' },
      { text: '学習', ruby: 'がくしゅう' },
      { text: 'の' },
      { text: '技術', ruby: 'ぎじゅつ' },
      { text: 'も' },
      { text: '活用', ruby: 'かつよう' },
      { text: 'して、' },
      { text: 'ビジネス' },
      { text: 'の' },
      { text: '自動化', ruby: 'じどうか' },
      { text: 'や' },
      { text: '効率化', ruby: 'こうりつか' },
      { text: 'を' },
      { text: '進', ruby: 'すす' },
      { text: 'めています。' },
    ],
    translation: '另外，最近我们也利用 AI 和机器学习技术，推进业务的自动化和效率化。',
  },
  {
    segments: [
      { text: 'そのため、' },
      { text: '様々', ruby: 'さまざま' },
      { text: 'な' },
      { text: '分野', ruby: 'ぶんや' },
      { text: 'の' },
      { text: 'エンジニア', ruby: 'えんじにあ' },
      { text: 'を' },
      { text: '募集', ruby: 'ぼしゅう' },
      { text: 'しています。' },
      { text: 'フロントエンド' },
      { text: '、' },
      { text: 'バックエンド' },
      { text: '、' },
      { text: 'データ' },
      { text: 'サイエンティスト' },
      { text: 'など、' },
      { text: '幅広', ruby: 'はばひろ' },
      { text: 'い' },
      { text: '職種', ruby: 'しょくしゅ' },
      { text: 'で' },
      { text: '人材', ruby: 'じんざい' },
      { text: 'を' },
      { text: '求', ruby: 'もと' },
      { text: 'めています。' },
    ],
    translation: '因此，我们招聘各个领域的工程师。前端、后端、数据科学家等，在广泛的职位上寻求人才。',
  },
  {
    segments: [
      { text: '私', ruby: 'わたし' },
      { text: '自身', ruby: 'じしん' },
      { text: 'も' },
      { text: 'この' },
      { text: '会社', ruby: 'かいしゃ' },
      { text: 'に' },
      { text: '入', ruby: 'はい' },
      { text: 'って' },
      { text: '3年目', ruby: 'さんねんめ' },
      { text: 'になります。' },
      { text: '元々', ruby: 'もともと' },
      { text: 'は' },
      { text: 'Web' },
      { text: '開発', ruby: 'かいはつ' },
      { text: 'を' },
      { text: 'やっていました' },
      { text: 'が、' },
      { text: '今', ruby: 'いま' },
      { text: 'は' },
      { text: 'プロジェクト' },
      { text: 'マネージャー' },
      { text: 'として' },
      { text: '働', ruby: 'はたら' },
      { text: 'いています。' },
    ],
    translation: '我自己也是进入这家公司第三年了。原本是做 Web 开发的，现在作为项目经理工作。',
  },
  {
    segments: [
      { text: 'チーム' },
      { text: 'の' },
      { text: '雰囲気', ruby: 'ふんいき' },
      { text: 'は' },
      { text: 'とても' },
      { text: '良', ruby: 'よ' },
      { text: 'くて、' },
      { text: '若手', ruby: 'わかて' },
      { text: 'からも' },
      { text: '意見', ruby: 'いけん' },
      { text: 'が' },
      { text: '言', ruby: 'い' },
      { text: 'いやすい' },
      { text: '環境', ruby: 'かんきょう' },
      { text: 'です。' },
      { text: 'また、' },
      { text: 'リモート' },
      { text: 'ワーク' },
      { text: 'も' },
      { text: '積極的', ruby: 'せっきょくてき' },
      { text: 'に' },
      { text: '導入', ruby: 'どうにゅう' },
      { text: 'していて、' },
      { text: '柔軟', ruby: 'じゅうなん' },
      { text: 'な' },
      { text: '働', ruby: 'はたら' },
      { text: 'き' },
      { text: '方', ruby: 'かた' },
      { text: 'が' },
      { text: 'できます。' },
    ],
    translation: '团队氛围非常好，年轻人也很容易发表意见。另外，我们积极导入远程工作，可以灵活工作。',
  },
  {
    segments: [
      { text: '技術的', ruby: 'ぎじゅつてき' },
      { text: 'な' },
      { text: '面', ruby: 'めん' },
      { text: 'では、' },
      { text: '最新', ruby: 'さいしん' },
      { text: 'の' },
      { text: 'フレームワーク' },
      { text: 'や' },
      { text: 'ツール' },
      { text: 'を' },
      { text: '使', ruby: 'つか' },
      { text: 'うことを' },
      { text: '推奨', ruby: 'すいしょう' },
      { text: 'していて、' },
      { text: '常', ruby: 'つね' },
      { text: 'に' },
      { text: '新', ruby: 'あたら' },
      { text: 'しい' },
      { text: '技術', ruby: 'ぎじゅつ' },
      { text: 'を' },
      { text: '学', ruby: 'まな' },
      { text: 'べる' },
      { text: '機会', ruby: 'きかい' },
      { text: 'があります。' },
    ],
    translation: '在技术方面，我们推荐使用最新的框架和工具，有很多学习新技术的机会。',
  },
  {
    segments: [
      { text: '例', ruby: 'たと' },
      { text: 'えば、' },
      { text: 'React' },
      { text: 'や' },
      { text: 'Vue.js' },
      { text: 'などの' },
      { text: 'モダン' },
      { text: 'な' },
      { text: 'フロントエンド' },
      { text: 'フレームワーク、' },
      { text: 'Node.js' },
      { text: 'や' },
      { text: 'Python' },
      { text: 'などの' },
      { text: 'バックエンド' },
      { text: '技術', ruby: 'ぎじゅつ' },
      { text: '、' },
      { text: 'そして' },
      { text: 'AWS' },
      { text: 'や' },
      { text: 'Azure' },
      { text: 'などの' },
      { text: 'クラウド' },
      { text: 'プラットフォーム' },
      { text: 'を' },
      { text: '活用', ruby: 'かつよう' },
      { text: 'しています。' },
    ],
    translation: '例如，我们使用 React 和 Vue.js 等现代前端框架、Node.js 和 Python 等后端技术，以及 AWS 和 Azure 等云平台。',
  },
  {
    segments: [
      { text: 'また、' },
      { text: '定期的', ruby: 'ていきてき' },
      { text: 'に' },
      { text: '社内', ruby: 'しゃない' },
      { text: 'の' },
      { text: '勉強会', ruby: 'べんきょうかい' },
      { text: 'や' },
      { text: 'ハッカソン' },
      { text: 'も' },
      { text: '開催', ruby: 'かいさい' },
      { text: 'されていて、' },
      { text: 'エンジニア', ruby: 'えんじにあ' },
      { text: '同士', ruby: 'どうし' },
      { text: 'で' },
      { text: '知識', ruby: 'ちしき' },
      { text: 'を' },
      { text: '共有', ruby: 'きょうゆう' },
      { text: 'したり、' },
      { text: '新', ruby: 'あたら' },
      { text: 'しい' },
      { text: 'アイデア' },
      { text: 'を' },
      { text: '試', ruby: 'ため' },
      { text: 'したり' },
      { text: 'する' },
      { text: '場', ruby: 'ば' },
      { text: 'があります。' },
    ],
    translation: '另外，我们定期举办内部学习会和黑客马拉松，为工程师之间分享知识、尝试新想法提供场所。',
  },
  {
    segments: [
      { text: '給与', ruby: 'きゅうよ' },
      { text: 'や' },
      { text: '福利厚生', ruby: 'ふくりこうせい' },
      { text: 'についても、' },
      { text: '業界', ruby: 'ぎょうかい' },
      { text: '平均', ruby: 'へいきん' },
      { text: 'を' },
      { text: '上回', ruby: 'うわまわ' },
      { text: 'る' },
      { text: '水準', ruby: 'すいじゅん' },
      { text: 'を' },
      { text: '提供', ruby: 'ていきょう' },
      { text: 'しています。' },
      { text: '健康保険', ruby: 'けんこうほけん' },
      { text: 'や' },
      { text: '年金', ruby: 'ねんきん' },
      { text: 'は' },
      { text: 'もちろん、' },
      { text: '資格', ruby: 'しかく' },
      { text: '取得', ruby: 'しゅとく' },
      { text: '支援', ruby: 'しえん' },
      { text: 'や' },
      { text: '書籍', ruby: 'しょせき' },
      { text: '購入', ruby: 'こうにゅう' },
      { text: '費', ruby: 'ひ' },
      { text: 'の' },
      { text: '補助', ruby: 'ほじょ' },
      { text: 'なども' },
      { text: 'あります。' },
    ],
    translation: '关于薪资和福利待遇，我们提供超过行业平均水平的标准。除了健康保险和养老金，还有资格考试支援和图书购买费补助等。',
  },
  {
    segments: [
      { text: 'もし' },
      { text: '興味', ruby: 'きょうみ' },
      { text: 'が' },
      { text: 'あれば、' },
      { text: 'ぜひ' },
      { text: '一度', ruby: 'いちど' },
      { text: 'オフィス' },
      { text: 'に' },
      { text: '見学', ruby: 'けんがく' },
      { text: 'に' },
      { text: '来', ruby: 'き' },
      { text: 'てください。' },
      { text: '実際', ruby: 'じっさい' },
      { text: 'の' },
      { text: '職場', ruby: 'しょくば' },
      { text: 'の' },
      { text: '雰囲気', ruby: 'ふんいき' },
      { text: 'を' },
      { text: '感', ruby: 'かん' },
      { text: 'じて' },
      { text: 'いただけると' },
      { text: '思', ruby: 'おも' },
      { text: 'います。' },
    ],
    translation: '如果有興趣的话，请务必来参观一下我们的办公室。您可以感受到实际职场的氛围。',
  },
]

function RouteComponent() {
  const [rawInput, setRawInput] = useState('')
  const [processedText, setProcessedText] = useState<ProcessedSentence[]>(exampleText)
  const [vocabulary, setVocabulary] = useState<VocabItem[]>([
    { word: '本当', reading: 'ほんとう', meaning: '真正的' },
    { word: '準備', reading: 'じゅんび', meaning: '准备' },
  ])
  const [selectedNote, setSelectedNote] = useState<VocabItem | null>(null)

  // 阅读设置
  const {
    fontFamily,
    fontSize,
    lineHeight,
    rubySize,
    paragraphSpacing,
    textColor,
    backgroundColor,
    rubyColor,
    translationColor,
    showRuby,
    showTranslation,
    setShowRuby,
    setShowTranslation,
    ttsSpeed,
    ttsVolume,
  } = useReadingSettings()

  // TTS 功能
  const { speak, isSpeaking, currentText, stop } = useTTS()

  const handleWordClick = (word: string) => {
    speak(word, { rate: ttsSpeed, volume: ttsVolume })
  }

  const handleSentenceClick = (sentence: ProcessedSentence) => {
    const sentenceText = sentence.segments.map((s) => s.text).join('')
    speak(sentenceText, { rate: ttsSpeed, volume: ttsVolume })
  }

  const handleSpeakAll = () => {
    const allText = processedText.map((s) => s.segments.map((seg) => seg.text).join('')).join('。')
    speak(allText, { rate: ttsSpeed, volume: ttsVolume })
  }

  const handleStopSpeaking = () => {
    stop()
  }

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
          <div className="col-span-3 h-full min-h-0 flex flex-col gap-4">
            {/* Raw Input */}
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-sm font-medium">Raw ASR Input</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
                <Textarea
                  placeholder="日本語がひと上手ですね。すいません、実は先の自己紹介は準備した内容です。"
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  className="flex-1 resize-none text-sm min-h-0 overflow-auto"
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
              <CardContent className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden p-6 pt-0">
                <ScrollArea className="flex-1 min-h-0 w-full">
                  <div className="space-y-2 pr-4">
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
          <div className="col-span-6 h-full min-h-0 flex flex-col">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Reading Area</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4">
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
                    <div className="flex items-center gap-2">
                      {isSpeaking ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleStopSpeaking}
                          className="gap-2"
                        >
                          <Square className="h-4 w-4" />
                          停止
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSpeakAll}
                          className="gap-2"
                          disabled={processedText.length === 0}
                        >
                          <Play className="h-4 w-4" />
                          朗读全文
                        </Button>
                      )}
                    </div>
                    <ReadingSettingsPanel />
                  </div>
                </div>
              </CardHeader>
              <CardContent
                className="flex-1 min-h-0 overflow-hidden p-0"
                style={{ backgroundColor }}
              >
                <ScrollArea className="h-full w-full">
                  <div
                    className="pr-4 p-6"
                    style={{
                      fontFamily,
                      fontSize: `${fontSize}px`,
                      lineHeight,
                      color: textColor,
                    }}
                  >
                    {processedText.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: `${paragraphSpacing}px` }}>
                        {processedText.map((sentence, sentenceIndex) => {
                          const sentenceText = sentence.segments.map((s) => s.text).join('')
                          const isCurrentSentence = isSpeaking && currentText === sentenceText

                          return (
                          <div
                            key={sentenceIndex}
                            className={`border-b pb-6 border-current/10 cursor-pointer rounded-lg px-2 -mx-2 transition-all ${
                              isCurrentSentence ? 'bg-blue-100/50 dark:bg-blue-900/20 ring-2 ring-blue-400/50' : 'hover:bg-stone-100/50 dark:hover:bg-stone-800/50'
                            }`}
                            onClick={() => handleSentenceClick(sentence)}
                            title="点击朗读整句"
                          >
                            <div className="font-medium mb-3">
                              {sentence.segments.map((segment, segmentIndex) => (
                                <WordHoverPopover
                                  key={segmentIndex}
                                  word={segment.text}
                                  reading={segment.ruby}
                                  onWordClick={handleWordClick}
                                >
                                  {segment.ruby && showRuby ? (
                                    <ruby>
                                      {segment.text}
                                      <rt
                                        style={{
                                          fontSize: `${rubySize}%`,
                                          color: rubyColor,
                                        }}
                                      >
                                        {segment.ruby}
                                      </rt>
                                    </ruby>
                                  ) : (
                                    <span>{segment.text}</span>
                                  )}
                                </WordHoverPopover>
                              ))}
                            </div>
                            {showTranslation && (
                              <p
                                className="text-sm mt-2"
                                style={{ color: translationColor }}
                              >
                                {sentence.translation}
                              </p>
                            )}
                          </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center mt-20" style={{ color: translationColor }}>
                        <p>请在左侧输入日文文本并点击 Process</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* 右侧栏：语法和词汇注释 */}
          <div className="col-span-3 h-full min-h-0 flex flex-col">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-sm font-medium">Grammar & Vocab Notes</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 overflow-hidden p-0">
                <ScrollArea className="h-full w-full">
                  <div className="space-y-4 text-sm pr-4 p-6">
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
