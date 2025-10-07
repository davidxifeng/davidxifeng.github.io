import { Settings, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useReadingSettings, JAPANESE_FONTS, type ThemePreset } from '@/stores/readingSettingsStore'

export default function ReadingSettingsPanel() {
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
    theme,
    ttsSpeed,
    ttsVolume,
    setFontFamily,
    setFontSize,
    setLineHeight,
    setRubySize,
    setParagraphSpacing,
    setTextColor,
    setBackgroundColor,
    setRubyColor,
    setTranslationColor,
    setTtsSpeed,
    setTtsVolume,
    applyThemePreset,
    resetToDefaults,
  } = useReadingSettings()

  const themeButtons: { value: ThemePreset; label: string; desc: string }[] = [
    { value: 'default', label: '默认', desc: '浅灰背景' },
    { value: 'eyecare', label: '护眼', desc: '米黄背景' },
    { value: 'night', label: '夜间', desc: '深色背景' },
    { value: 'high-contrast', label: '高对比', desc: '黑白' },
  ]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">阅读设置</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="h-8 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              重置
            </Button>
          </div>

          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="text">文字</TabsTrigger>
              <TabsTrigger value="color">颜色</TabsTrigger>
              <TabsTrigger value="tts">朗读</TabsTrigger>
              <TabsTrigger value="theme">主题</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4 mt-4">
              {/* 字体选择 */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">字体</Label>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JAPANESE_FONTS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.value }}>
                          {font.label} <span className="text-xs text-muted-foreground">({font.name})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 字号 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">字号</Label>
                  <span className="text-xs text-muted-foreground">{fontSize}px</span>
                </div>
                <Slider
                  value={[fontSize]}
                  onValueChange={([value]) => setFontSize(value)}
                  min={14}
                  max={32}
                  step={2}
                  className="w-full"
                />
              </div>

              {/* 行高 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">行高</Label>
                  <span className="text-xs text-muted-foreground">{lineHeight.toFixed(1)}</span>
                </div>
                <Slider
                  value={[lineHeight]}
                  onValueChange={([value]) => setLineHeight(value)}
                  min={1.5}
                  max={2.5}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Ruby 注音大小 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">注音大小</Label>
                  <span className="text-xs text-muted-foreground">{rubySize}%</span>
                </div>
                <Slider
                  value={[rubySize]}
                  onValueChange={([value]) => setRubySize(value)}
                  min={50}
                  max={80}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* 段落间距 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">段落间距</Label>
                  <span className="text-xs text-muted-foreground">{paragraphSpacing}px</span>
                </div>
                <Slider
                  value={[paragraphSpacing]}
                  onValueChange={([value]) => setParagraphSpacing(value)}
                  min={12}
                  max={48}
                  step={4}
                  className="w-full"
                />
              </div>
            </TabsContent>

            <TabsContent value="color" className="space-y-4 mt-4">
              {/* 文字颜色 */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">文字颜色</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-12 h-9 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-md border text-sm"
                    placeholder="#1a1a1a"
                  />
                </div>
              </div>

              {/* 背景颜色 */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">背景颜色</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-12 h-9 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-md border text-sm"
                    placeholder="#f5f5f5"
                  />
                </div>
              </div>

              {/* Ruby 注音颜色 */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">注音颜色</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={rubyColor}
                    onChange={(e) => setRubyColor(e.target.value)}
                    className="w-12 h-9 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={rubyColor}
                    onChange={(e) => setRubyColor(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-md border text-sm"
                    placeholder="#666666"
                  />
                </div>
              </div>

              {/* 翻译颜色 */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">翻译颜色</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={translationColor}
                    onChange={(e) => setTranslationColor(e.target.value)}
                    className="w-12 h-9 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={translationColor}
                    onChange={(e) => setTranslationColor(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-md border text-sm"
                    placeholder="#737373"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tts" className="space-y-4 mt-4">
              {/* 语速 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">语速</Label>
                  <span className="text-xs text-muted-foreground">{ttsSpeed.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[ttsSpeed]}
                  onValueChange={([value]) => setTtsSpeed(value)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">调整朗读速度（0.5x - 2.0x）</p>
              </div>

              {/* 音量 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">音量</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(ttsVolume * 100)}%</span>
                </div>
                <Slider
                  value={[ttsVolume]}
                  onValueChange={([value]) => setTtsVolume(value)}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground space-y-1">
                  <span className="block">💡 提示：</span>
                  <span className="block">• 点击单词/句子即可朗读</span>
                  <span className="block">• 使用"朗读全文"按钮播放全部内容</span>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="theme" className="space-y-3 mt-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">预设主题</Label>
                <div className="grid grid-cols-2 gap-2">
                  {themeButtons.map((btn) => (
                    <button
                      key={btn.value}
                      onClick={() => applyThemePreset(btn.value)}
                      className={`
                        p-3 rounded-lg border-2 text-left transition-all
                        ${
                          theme === btn.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <div className="font-medium text-sm">{btn.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{btn.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-xs text-muted-foreground">
                {theme === 'custom' && (
                  <p className="text-amber-600 dark:text-amber-500">
                    ✨ 当前使用自定义设置
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  )
}
