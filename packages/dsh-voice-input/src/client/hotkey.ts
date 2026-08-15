export interface KeyEventLike {
  readonly key: string
  readonly code: string
  readonly ctrlKey: boolean
  readonly altKey: boolean
  readonly metaKey: boolean
  readonly shiftKey: boolean
}

export interface HotkeySpec {
  readonly key: string
  readonly code: string
  readonly ctrl: boolean
  readonly alt: boolean
  readonly meta: boolean
  readonly shift: boolean
}

export const DEFAULT_HOTKEY: HotkeySpec = Object.freeze({
  key: 'v',
  code: 'KeyV',
  ctrl: true,
  alt: true,
  meta: false,
  shift: false,
})

const MODIFIER_KEYS = new Set(['Alt', 'Control', 'Meta', 'Shift', 'AltGraph'])
const FUNCTION_KEY = /^F(?:[1-9]|1\d|2[0-4])$/iu

/** Convert one keyboard event into a safe shortcut, or reject bare typing. */
export function hotkeyFromEvent(event: KeyEventLike): HotkeySpec | null {
  if (MODIFIER_KEYS.has(event.key)) return null
  const key = normalizeKey(event.key)
  const hasCommandModifier = event.ctrlKey || event.altKey || event.metaKey
  if (!hasCommandModifier && !FUNCTION_KEY.test(key)) return null
  return Object.freeze({
    key,
    code: event.code,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    meta: event.metaKey,
    shift: event.shiftKey,
  })
}

/** Match by physical code when available so custom keyboard layouts remain stable. */
export function matchesHotkey(event: KeyEventLike, hotkey: HotkeySpec): boolean {
  const sameKey = hotkey.code.length > 0 && event.code.length > 0
    ? event.code === hotkey.code
    : normalizeKey(event.key) === hotkey.key
  return sameKey
    && event.ctrlKey === hotkey.ctrl
    && event.altKey === hotkey.alt
    && event.metaKey === hotkey.meta
    && event.shiftKey === hotkey.shift
}

/** Human-readable label for tooltips and the settings panel. */
export function formatHotkey(hotkey: HotkeySpec, mac: boolean): string {
  const key = displayKey(hotkey)
  if (mac) {
    return `${hotkey.ctrl ? '⌃' : ''}${hotkey.alt ? '⌥' : ''}${hotkey.shift ? '⇧' : ''}${hotkey.meta ? '⌘' : ''}${key}`
  }
  return [
    hotkey.ctrl ? 'Ctrl' : '',
    hotkey.alt ? 'Alt' : '',
    hotkey.shift ? 'Shift' : '',
    hotkey.meta ? 'Meta' : '',
    key,
  ].filter(Boolean).join('+')
}

export function isHotkeySpec(value: unknown): value is HotkeySpec {
  if (value === null || typeof value !== 'object') return false
  const candidate = value as Partial<HotkeySpec>
  return typeof candidate.key === 'string'
    && candidate.key.length > 0
    && typeof candidate.code === 'string'
    && typeof candidate.ctrl === 'boolean'
    && typeof candidate.alt === 'boolean'
    && typeof candidate.meta === 'boolean'
    && typeof candidate.shift === 'boolean'
    && (candidate.ctrl || candidate.alt || candidate.meta || FUNCTION_KEY.test(candidate.key))
}

function normalizeKey(key: string): string {
  return key.length === 1 ? key.toLocaleLowerCase('en-US') : key
}

function displayKey(hotkey: HotkeySpec): string {
  if (/^Key[A-Z]$/u.test(hotkey.code)) return hotkey.code.slice(3)
  if (/^Digit\d$/u.test(hotkey.code)) return hotkey.code.slice(5)
  if (hotkey.key === ' ') return 'Space'
  return hotkey.key.length === 1 ? hotkey.key.toLocaleUpperCase('en-US') : hotkey.key
}
