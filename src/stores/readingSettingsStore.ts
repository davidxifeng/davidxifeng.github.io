import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 日文优化字体列表
export const JAPANESE_FONTS = [
  { value: 'system-ui', label: 'System Default', name: 'システム標準' },
  { value: '"Noto Sans JP", sans-serif', label: 'Noto Sans JP', name: 'ゴシック体' },
  { value: '"Noto Serif JP", serif', label: 'Noto Serif JP', name: '明朝体' },
  { value: '"Zen Kaku Gothic New", sans-serif', label: 'Zen Kaku Gothic', name: '角ゴシック' },
  { value: '"M PLUS Rounded 1c", sans-serif', label: 'M PLUS Rounded', name: '丸ゴシック' },
] as const

// 预设主题
export type ThemePreset = 'default' | 'eyecare' | 'night' | 'high-contrast' | 'custom'

export interface ReadingSettings {
  // 字体设置
  fontFamily: string
  fontSize: number
  lineHeight: number
  rubySize: number

  // 颜色设置
  textColor: string
  backgroundColor: string
  rubyColor: string
  translationColor: string

  // 布局设置
  paragraphSpacing: number
  maxWidth: number
  textAlign: 'left' | 'justify'

  // 显示选项
  showRuby: boolean
  showTranslation: boolean

  // 主题
  theme: ThemePreset

  // TTS 设置 (预留)
  ttsEnabled: boolean
  ttsSpeed: number
  ttsVolume: number
  ttsVoice: string
}

interface ReadingSettingsStore extends ReadingSettings {
  // Actions
  setFontFamily: (fontFamily: string) => void
  setFontSize: (fontSize: number) => void
  setLineHeight: (lineHeight: number) => void
  setRubySize: (rubySize: number) => void
  setTextColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  setRubyColor: (color: string) => void
  setTranslationColor: (color: string) => void
  setParagraphSpacing: (spacing: number) => void
  setMaxWidth: (width: number) => void
  setTextAlign: (align: 'left' | 'justify') => void
  setShowRuby: (show: boolean) => void
  setShowTranslation: (show: boolean) => void
  setTheme: (theme: ThemePreset) => void
  applyThemePreset: (theme: ThemePreset) => void
  resetToDefaults: () => void

  // TTS Actions (预留)
  setTtsEnabled: (enabled: boolean) => void
  setTtsSpeed: (speed: number) => void
  setTtsVolume: (volume: number) => void
  setTtsVoice: (voice: string) => void
}

// 默认设置
const DEFAULT_SETTINGS: ReadingSettings = {
  fontFamily: 'system-ui',
  fontSize: 20,
  lineHeight: 1.8,
  rubySize: 60,
  textColor: '#1a1a1a',
  backgroundColor: '#f5f5f5',
  rubyColor: '#666666',
  translationColor: '#737373',
  paragraphSpacing: 24,
  maxWidth: 800,
  textAlign: 'left',
  showRuby: true,
  showTranslation: false,
  theme: 'default',
  ttsEnabled: false,
  ttsSpeed: 1.0,
  ttsVolume: 1.0,
  ttsVoice: '',
}

// 主题预设配置
const THEME_PRESETS: Record<ThemePreset, Partial<ReadingSettings>> = {
  default: {
    textColor: '#1a1a1a',
    backgroundColor: '#f5f5f5',
    rubyColor: '#666666',
    translationColor: '#737373',
  },
  eyecare: {
    textColor: '#3d3026',
    backgroundColor: '#f5f1e8',
    rubyColor: '#8b7355',
    translationColor: '#9a8672',
  },
  night: {
    textColor: '#e5e5e5',
    backgroundColor: '#1a1a1a',
    rubyColor: '#a3a3a3',
    translationColor: '#8a8a8a',
  },
  'high-contrast': {
    textColor: '#000000',
    backgroundColor: '#ffffff',
    rubyColor: '#333333',
    translationColor: '#666666',
  },
  custom: {},
}

export const useReadingSettings = create<ReadingSettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setFontFamily: (fontFamily) => set({ fontFamily, theme: 'custom' }),
      setFontSize: (fontSize) => set({ fontSize, theme: 'custom' }),
      setLineHeight: (lineHeight) => set({ lineHeight, theme: 'custom' }),
      setRubySize: (rubySize) => set({ rubySize, theme: 'custom' }),
      setTextColor: (textColor) => set({ textColor, theme: 'custom' }),
      setBackgroundColor: (backgroundColor) => set({ backgroundColor, theme: 'custom' }),
      setRubyColor: (rubyColor) => set({ rubyColor, theme: 'custom' }),
      setTranslationColor: (translationColor) => set({ translationColor, theme: 'custom' }),
      setParagraphSpacing: (paragraphSpacing) => set({ paragraphSpacing, theme: 'custom' }),
      setMaxWidth: (maxWidth) => set({ maxWidth, theme: 'custom' }),
      setTextAlign: (textAlign) => set({ textAlign, theme: 'custom' }),
      setShowRuby: (showRuby) => set({ showRuby }),
      setShowTranslation: (showTranslation) => set({ showTranslation }),

      setTheme: (theme) => set({ theme }),

      applyThemePreset: (theme) => {
        const preset = THEME_PRESETS[theme]
        set({ ...preset, theme })
      },

      resetToDefaults: () => set(DEFAULT_SETTINGS),

      // TTS Actions
      setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),
      setTtsSpeed: (ttsSpeed) => set({ ttsSpeed }),
      setTtsVolume: (ttsVolume) => set({ ttsVolume }),
      setTtsVoice: (ttsVoice) => set({ ttsVoice }),
    }),
    {
      name: 'reading-settings-storage',
      // 只持久化核心设置，不持久化 actions
      partialize: (state) => ({
        fontFamily: state.fontFamily,
        fontSize: state.fontSize,
        lineHeight: state.lineHeight,
        rubySize: state.rubySize,
        textColor: state.textColor,
        backgroundColor: state.backgroundColor,
        rubyColor: state.rubyColor,
        translationColor: state.translationColor,
        paragraphSpacing: state.paragraphSpacing,
        maxWidth: state.maxWidth,
        textAlign: state.textAlign,
        showRuby: state.showRuby,
        showTranslation: state.showTranslation,
        theme: state.theme,
        ttsEnabled: state.ttsEnabled,
        ttsSpeed: state.ttsSpeed,
        ttsVolume: state.ttsVolume,
        ttsVoice: state.ttsVoice,
      }),
    }
  )
)
