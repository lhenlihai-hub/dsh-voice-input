import { DEFAULT_HOTKEY, isHotkeySpec } from './hotkey.ts'
import type { HotkeySpec } from './hotkey.ts'

export const RECOGNITION_LANGUAGES = [
  'auto',
  'zh-CN',
  'zh-TW',
  'zh-HK',
  'en-US',
  'en-GB',
  'ja-JP',
  'ko-KR',
] as const

export type RecognitionLanguage = typeof RECOGNITION_LANGUAGES[number]

export interface VoiceInputSettings {
  readonly hotkey: HotkeySpec
  readonly language: RecognitionLanguage
}

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const STORAGE_KEY = 'dsh-voice-input.settings.v2'

export const DEFAULT_SETTINGS: VoiceInputSettings = Object.freeze({
  hotkey: DEFAULT_HOTKEY,
  language: 'auto',
})

export function loadSettings(storage: StorageLike | undefined): VoiceInputSettings {
  if (storage === undefined) return DEFAULT_SETTINGS
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return DEFAULT_SETTINGS
    const value = JSON.parse(raw) as { hotkey?: unknown; language?: unknown }
    if (!isHotkeySpec(value.hotkey) || !isLanguage(value.language)) return DEFAULT_SETTINGS
    return Object.freeze({ hotkey: Object.freeze({ ...value.hotkey }), language: value.language })
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(storage: StorageLike | undefined, settings: VoiceInputSettings): void {
  if (storage === undefined) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage can be unavailable in private/locked browser contexts. The live
    // setting still works for this page lifetime.
  }
}

export function clearSettings(storage: StorageLike | undefined): void {
  if (storage === undefined) return
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // Uninstall still succeeds when browser storage is unavailable.
  }
}

function isLanguage(value: unknown): value is RecognitionLanguage {
  return typeof value === 'string'
    && (RECOGNITION_LANGUAGES as readonly string[]).includes(value)
}
