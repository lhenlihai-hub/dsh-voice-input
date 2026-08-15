import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type {
  ChangeEvent,
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import {
  DEFAULT_HOTKEY,
  formatHotkey,
  hotkeyFromEvent,
  matchesHotkey,
} from './hotkey.ts'
import {
  DEFAULT_SETTINGS,
  RECOGNITION_LANGUAGES,
  loadSettings,
  saveSettings,
} from './settings.ts'
import type { RecognitionLanguage, VoiceInputSettings } from './settings.ts'
import {
  collectRecognitionText,
  speechRecognitionConstructor,
} from './speech.ts'
import type { BrowserSpeechRecognition } from './speech.ts'
import {
  appendTranscript,
  diffText,
  insertTranscript,
  replaceObservedInsertion,
} from './text.ts'

export interface CleanupOutcome {
  readonly text: string
  readonly modelLabel: string
}

export interface VoiceInputInjected {
  readonly cleanupTranscript: (text: string, signal: AbortSignal) => Promise<CleanupOutcome>
}

type VoiceInputProps = PropsRuntime<'conversation.input.left'> & VoiceInputInjected
type Phase = 'idle' | 'listening' | 'armed' | 'capturing' | 'cleaning'

interface InsertionSnapshot {
  readonly draft: string
  readonly start: number
  readonly end: number
}

interface DirectRun {
  readonly run: number
  readonly snapshot: InsertionSnapshot
  finalText: string
  interimText: string
  done: boolean
}

interface FallbackRun {
  readonly run: number
  readonly baseline: string
  lastDraft: string
  quietTimer: number | null
  readonly expireTimer: number
}

interface ResolvedCleanup {
  readonly text: string
  readonly modelLabel: string | null
  readonly warning: string | null
}

interface Copy {
  readonly title: string
  readonly start: string
  readonly stop: string
  readonly settings: string
  readonly ready: string
  readonly listening: string
  readonly cleaning: string
  readonly noSpeech: string
  readonly canceled: string
  readonly blocked: string
  readonly status: string
  readonly shortcut: string
  readonly language: string
  readonly method: string
  readonly browserMethod: string
  readonly systemMethod: string
  readonly captureShortcut: string
  readonly invalidShortcut: string
  readonly reset: string
  readonly auto: string
  readonly privacy: string
  readonly close: string
  readonly fallback: (gesture: string) => string
  readonly browserFailed: (gesture: string) => string
  readonly rawFallback: (reason: string) => string
  readonly cleaned: (model: string) => string
  readonly concurrentEdit: string
}

const ZH: Copy = {
  title: '语音输入',
  start: '开始语音输入',
  stop: '结束语音输入',
  settings: '语音输入设置',
  ready: '点击麦克风或按快捷键开始。',
  listening: '正在听写；再次点击或按快捷键结束。',
  cleaning: '正在使用当前会话模型整理文字…',
  noSpeech: '没有识别到语音。',
  canceled: '已取消语音输入。',
  blocked: '当前输入框正忙，暂时不能开始听写。',
  status: '状态',
  shortcut: '快捷键',
  language: '识别语言',
  method: '输入方式',
  browserMethod: '浏览器语音识别（不可用时自动回退系统听写）',
  systemMethod: '系统听写回退',
  captureShortcut: '请按新的组合键（需 Ctrl、Alt、⌘，或 F1–F24）',
  invalidShortcut: '不能使用普通字母或数字单键，请加 Ctrl、Alt、⌘，或使用 F 键。',
  reset: '恢复默认设置',
  auto: '自动（浏览器语言）',
  privacy: '音频由浏览器或操作系统听写处理；只有转写文字会通过 Harness 当前会话模型做整理。插件不保存 API 密钥。',
  close: '关闭',
  fallback: gesture => `系统听写已待命：输入框已聚焦，请按 ${gesture} 开始；停顿约 1.2 秒后自动整理。`,
  browserFailed: gesture => `浏览器语音识别不可用，已回退系统听写。请按 ${gesture} 开始。`,
  rawFallback: reason => `模型整理失败，已保留识别原文：${reason}`,
  cleaned: model => `已用当前会话模型 ${model} 整理并写入。`,
  concurrentEdit: '整理期间输入内容发生变化；为避免覆盖你的编辑，已保留识别原文。',
}

const EN: Copy = {
  title: 'Voice input',
  start: 'Start voice input',
  stop: 'Stop voice input',
  settings: 'Voice input settings',
  ready: 'Click the microphone or press the shortcut to start.',
  listening: 'Listening; click or press the shortcut again to stop.',
  cleaning: 'Cleaning the transcript with the current Session model…',
  noSpeech: 'No speech was recognized.',
  canceled: 'Voice input canceled.',
  blocked: 'The composer is busy, so dictation cannot start yet.',
  status: 'Status',
  shortcut: 'Shortcut',
  language: 'Language',
  method: 'Input method',
  browserMethod: 'Browser speech recognition (system dictation fallback)',
  systemMethod: 'System dictation fallback',
  captureShortcut: 'Press a new shortcut (Ctrl, Alt, Meta, or F1–F24 required)',
  invalidShortcut: 'Bare letters and digits are not allowed. Add Ctrl, Alt, or Meta, or use an F key.',
  reset: 'Reset defaults',
  auto: 'Automatic (browser language)',
  privacy: 'Audio is handled by browser or OS dictation. Only transcript text is cleaned through the current Harness Session model. No API key is stored.',
  close: 'Close',
  fallback: gesture => `System dictation is armed. The composer is focused; press ${gesture} to begin. Cleanup starts after about 1.2 seconds of quiet.`,
  browserFailed: gesture => `Browser speech recognition is unavailable. Falling back to system dictation; press ${gesture} to begin.`,
  rawFallback: reason => `Model cleanup failed; the raw transcript was kept: ${reason}`,
  cleaned: model => `Cleaned and inserted with the current Session model ${model}.`,
  concurrentEdit: 'The draft changed during cleanup. The raw transcript was kept to avoid overwriting your edit.',
}

export function VoiceInput({ input, inputActions, cleanupTranscript }: VoiceInputProps) {
  const copy = useMemo(() => browserLanguage().startsWith('zh') ? ZH : EN, [])
  const mac = useMemo(() => platformKind() === 'mac', [])
  const gesture = useMemo(() => systemDictationGesture(), [])
  const [phase, setPhaseState] = useState<Phase>('idle')
  const phaseRef = useRef<Phase>('idle')
  const [message, setMessage] = useState(copy.ready)
  const [interim, setInterim] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [capturingHotkey, setCapturingHotkey] = useState(false)
  const capturingHotkeyRef = useRef(false)
  const [settings, setSettingsState] = useState<VoiceInputSettings>(() =>
    loadSettings(typeof window === 'undefined' ? undefined : window.localStorage))
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({ left: 8, bottom: 8 })

  const draftRef = useRef(input.draft)
  draftRef.current = input.draft
  const inputPhaseRef = useRef(input.phase)
  inputPhaseRef.current = input.phase
  const inputActionsRef = useRef(inputActions)
  inputActionsRef.current = inputActions
  const runRef = useRef(0)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const directRef = useRef<DirectRun | null>(null)
  const fallbackRef = useRef<FallbackRun | null>(null)
  const cleanupAbortRef = useRef<AbortController | null>(null)
  const toggleRef = useRef<() => void>(() => undefined)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const shortcutButtonRef = useRef<HTMLButtonElement>(null)

  const transition = useCallback((next: Phase) => {
    phaseRef.current = next
    setPhaseState(next)
  }, [])

  const clearFallback = useCallback(() => {
    const fallback = fallbackRef.current
    if (fallback === null) return
    if (fallback.quietTimer !== null) window.clearTimeout(fallback.quietTimer)
    window.clearTimeout(fallback.expireTimer)
    fallbackRef.current = null
  }, [])

  const commitSettings = useCallback((next: VoiceInputSettings) => {
    setSettingsState(next)
    saveSettings(typeof window === 'undefined' ? undefined : window.localStorage, next)
  }, [])

  const cleanupSafely = useCallback(async (
    raw: string,
    signal: AbortSignal,
  ): Promise<ResolvedCleanup> => {
    try {
      const outcome = await cleanupTranscript(raw, signal)
      const text = outcome.text.trim()
      return Object.freeze({
        text: text.length === 0 ? raw : text,
        modelLabel: outcome.modelLabel,
        warning: null,
      })
    } catch (error) {
      return Object.freeze({
        text: raw,
        modelLabel: null,
        warning: describeError(error),
      })
    }
  }, [cleanupTranscript])

  const finalizeDirect = useCallback(async (run: number) => {
    const direct = directRef.current
    if (direct === null || direct.run !== run || direct.done || runRef.current !== run) return
    direct.done = true
    recognitionRef.current = null
    const raw = (direct.finalText.length > 0 ? direct.finalText : direct.interimText).trim()
    setInterim('')
    if (raw.length === 0) {
      directRef.current = null
      transition('idle')
      setMessage(copy.noSpeech)
      return
    }

    transition('cleaning')
    setMessage(copy.cleaning)
    const controller = new AbortController()
    cleanupAbortRef.current = controller
    const resolved = await cleanupSafely(raw, controller.signal)
    if (runRef.current !== run) return
    cleanupAbortRef.current = null
    directRef.current = null
    const current = draftRef.current
    const next = current === direct.snapshot.draft
      ? insertTranscript(current, direct.snapshot.start, direct.snapshot.end, resolved.text)
      : appendTranscript(current, resolved.text)
    inputActionsRef.current.setDraft(next)
    transition('idle')
    setMessage(resolved.warning === null
      ? copy.cleaned(resolved.modelLabel ?? '')
      : copy.rawFallback(resolved.warning))
  }, [cleanupSafely, copy, transition])

  const finalizeFallback = useCallback(async (run: number) => {
    const fallback = fallbackRef.current
    if (fallback === null || fallback.run !== run || runRef.current !== run) return
    const observed = draftRef.current
    clearFallback()
    const change = diffText(fallback.baseline, observed)
    const raw = change?.inserted.trim() ?? ''
    if (change === null || raw.length === 0) {
      transition('idle')
      setMessage(copy.noSpeech)
      return
    }

    transition('cleaning')
    setMessage(copy.cleaning)
    const controller = new AbortController()
    cleanupAbortRef.current = controller
    const resolved = await cleanupSafely(raw, controller.signal)
    if (runRef.current !== run) return
    cleanupAbortRef.current = null
    const replacement = replaceObservedInsertion(draftRef.current, observed, change, resolved.text)
    if (replacement.replaced && replacement.text !== draftRef.current) {
      inputActionsRef.current.setDraft(replacement.text)
    }
    transition('idle')
    if (!replacement.replaced) setMessage(copy.concurrentEdit)
    else if (resolved.warning !== null) setMessage(copy.rawFallback(resolved.warning))
    else setMessage(copy.cleaned(resolved.modelLabel ?? ''))
  }, [cleanupSafely, clearFallback, copy, transition])

  const armFallback = useCallback((run: number, browserFailed: boolean) => {
    const baseline = draftRef.current
    const textarea = composerTextarea(baseline)
    textarea?.focus()
    const expireTimer = window.setTimeout(() => {
      const live = fallbackRef.current
      if (live === null || live.run !== run || runRef.current !== run) return
      clearFallback()
      transition('idle')
      setMessage(copy.canceled)
    }, 45_000)
    fallbackRef.current = {
      run,
      baseline,
      lastDraft: baseline,
      quietTimer: null,
      expireTimer,
    }
    transition('armed')
    setMessage(browserFailed ? copy.browserFailed(gesture) : copy.fallback(gesture))
  }, [clearFallback, copy, gesture, transition])

  const startListening = useCallback(() => {
    if (inputPhaseRef.current !== 'plain') {
      setMessage(copy.blocked)
      return
    }
    const run = ++runRef.current
    clearFallback()
    setInterim('')
    const SpeechRecognition = speechRecognitionConstructor()
    if (SpeechRecognition === null) {
      armFallback(run, false)
      return
    }

    const snapshot = captureInsertion(draftRef.current)
    let recognition: BrowserSpeechRecognition
    try {
      recognition = new SpeechRecognition()
    } catch {
      armFallback(run, true)
      return
    }
    const direct: DirectRun = {
      run,
      snapshot,
      finalText: '',
      interimText: '',
      done: false,
    }
    directRef.current = direct
    recognitionRef.current = recognition
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.lang = settings.language === 'auto' ? browserLanguage() : settings.language
    recognition.onresult = (event) => {
      if (runRef.current !== run || direct.done) return
      const result = collectRecognitionText(event.results)
      direct.finalText = result.finalText
      direct.interimText = result.interimText
      setInterim(result.interimText)
    }
    recognition.onerror = () => {
      if (runRef.current !== run || direct.done) return
      direct.done = true
      directRef.current = null
      recognitionRef.current = null
      try { recognition.abort() } catch { /* browser already ended */ }
      armFallback(run, true)
    }
    recognition.onend = () => { void finalizeDirect(run) }

    try {
      recognition.start()
      transition('listening')
      setMessage(copy.listening)
    } catch {
      direct.done = true
      directRef.current = null
      recognitionRef.current = null
      armFallback(run, true)
    }
  }, [armFallback, clearFallback, copy, finalizeDirect, settings.language, transition])

  const cancelActive = useCallback(() => {
    ++runRef.current
    const recognition = recognitionRef.current
    recognitionRef.current = null
    directRef.current = null
    clearFallback()
    cleanupAbortRef.current?.abort()
    cleanupAbortRef.current = null
    if (recognition !== null) {
      try { recognition.abort() } catch { /* browser already ended */ }
    }
    setInterim('')
    transition('idle')
    setMessage(copy.canceled)
  }, [clearFallback, copy, transition])

  const toggle = useCallback(() => {
    const current = phaseRef.current
    if (current === 'cleaning') return
    if (current === 'listening') {
      setMessage(copy.cleaning)
      try { recognitionRef.current?.stop() } catch { cancelActive() }
      return
    }
    if (current === 'capturing') {
      const run = fallbackRef.current?.run
      if (run !== undefined) void finalizeFallback(run)
      return
    }
    if (current === 'armed') {
      cancelActive()
      return
    }
    startListening()
  }, [cancelActive, copy, finalizeFallback, startListening])
  toggleRef.current = toggle
  capturingHotkeyRef.current = capturingHotkey

  useEffect(() => {
    const fallback = fallbackRef.current
    if (fallback === null || fallback.run !== runRef.current) return
    if (phaseRef.current !== 'armed' && phaseRef.current !== 'capturing') return
    if (input.draft === fallback.lastDraft) return
    fallback.lastDraft = input.draft
    if (fallback.quietTimer !== null) window.clearTimeout(fallback.quietTimer)
    if (input.draft === fallback.baseline) {
      fallback.quietTimer = null
      transition('armed')
      return
    }
    transition('capturing')
    fallback.quietTimer = window.setTimeout(() => {
      void finalizeFallback(fallback.run)
    }, 1_200)
  }, [finalizeFallback, input.draft, transition])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (capturingHotkeyRef.current || event.repeat || event.isComposing) return
      if (!matchesHotkey(event, settings.hotkey)) return
      event.preventDefault()
      event.stopPropagation()
      toggleRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown) }
  }, [settings.hotkey])

  useEffect(() => () => {
    ++runRef.current
    cleanupAbortRef.current?.abort()
    clearFallback()
    const recognition = recognitionRef.current
    recognitionRef.current = null
    if (recognition !== null) {
      try { recognition.abort() } catch { /* browser already ended */ }
    }
  }, [clearFallback])

  const updatePanelPosition = useCallback(() => {
    const anchor = settingsButtonRef.current
    if (anchor === null) return
    const rect = anchor.getBoundingClientRect()
    const width = Math.min(340, window.innerWidth - 16)
    const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))
    if (rect.top > 360) {
      setPanelStyle({ left, bottom: window.innerHeight - rect.top + 8 })
    } else {
      setPanelStyle({ left, top: rect.bottom + 8 })
    }
  }, [])

  useLayoutEffect(() => {
    if (!panelOpen) return
    updatePanelPosition()
    window.addEventListener('resize', updatePanelPosition)
    window.addEventListener('scroll', updatePanelPosition, true)
    return () => {
      window.removeEventListener('resize', updatePanelPosition)
      window.removeEventListener('scroll', updatePanelPosition, true)
    }
  }, [panelOpen, updatePanelPosition])

  useEffect(() => {
    if (!panelOpen) return
    const onPointer = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (panelRef.current?.contains(target) || settingsButtonRef.current?.contains(target)) return
      setPanelOpen(false)
      setCapturingHotkey(false)
    }
    window.addEventListener('mousedown', onPointer)
    return () => { window.removeEventListener('mousedown', onPointer) }
  }, [panelOpen])

  useEffect(() => {
    if (capturingHotkey) shortcutButtonRef.current?.focus()
  }, [capturingHotkey])

  const onShortcutKey = useCallback((event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!capturingHotkey) return
    if (event.key === 'Tab') {
      setCapturingHotkey(false)
      return
    }
    event.preventDefault()
    event.stopPropagation()
    if (event.key === 'Escape') {
      setCapturingHotkey(false)
      return
    }
    const next = hotkeyFromEvent(event.nativeEvent)
    if (next === null) {
      if (!['Alt', 'Control', 'Meta', 'Shift', 'AltGraph'].includes(event.key)) {
        setMessage(copy.invalidShortcut)
      }
      return
    }
    commitSettings(Object.freeze({ ...settings, hotkey: next }))
    setCapturingHotkey(false)
    setMessage(copy.ready)
  }, [capturingHotkey, commitSettings, copy, settings])

  const onLanguage = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const language = event.target.value as RecognitionLanguage
    commitSettings(Object.freeze({ ...settings, language }))
  }, [commitSettings, settings])

  const resetSettings = useCallback(() => {
    commitSettings(Object.freeze({
      hotkey: Object.freeze({ ...DEFAULT_HOTKEY }),
      language: DEFAULT_SETTINGS.language,
    }))
    setCapturingHotkey(false)
    setMessage(copy.ready)
  }, [commitSettings, copy])

  const blocked = phase === 'cleaning' || (phase === 'idle' && input.phase !== 'plain')
  const active = phase === 'listening' || phase === 'armed' || phase === 'capturing'
  const shortcutLabel = formatHotkey(settings.hotkey, mac)
  const method = speechRecognitionConstructor() === null ? copy.systemMethod : copy.browserMethod

  return <>
    <span className="dsh-voice">
      <button
        type="button"
        className={`dsh-voice__button${active ? ' dsh-voice__button--active' : ''}`}
        disabled={blocked}
        aria-label={active ? copy.stop : copy.start}
        aria-pressed={active}
        title={`${active ? copy.stop : copy.start} (${shortcutLabel})`}
        onClick={toggle}
      >
        <MicIcon />
      </button>
      <button
        ref={settingsButtonRef}
        type="button"
        className="dsh-voice__button dsh-voice__settings"
        aria-label={copy.settings}
        aria-expanded={panelOpen}
        title={copy.settings}
        onClick={() => { setPanelOpen(open => !open); setCapturingHotkey(false) }}
      >
        <SettingsIcon />
      </button>
    </span>
    {panelOpen && typeof document !== 'undefined' && createPortal(
      <div ref={panelRef} className="dsh-voice-panel" style={panelStyle} role="dialog" aria-label={copy.settings}>
        <div className="dsh-voice-panel__head">
          <h2 className="dsh-voice-panel__title">{copy.title}</h2>
          <button
            type="button"
            className="dsh-voice-panel__close"
            aria-label={copy.close}
            onClick={() => { setPanelOpen(false); setCapturingHotkey(false) }}
          >×</button>
        </div>
        <p className="dsh-voice-panel__status" aria-live="polite">
          {message}
          {interim.length > 0 && <span className="dsh-voice-panel__preview">{interim}</span>}
        </p>
        <div className="dsh-voice-panel__row">
          <span className="dsh-voice-panel__label">{copy.method}</span>
          <span>{method}</span>
        </div>
        <div className="dsh-voice-panel__row">
          <span className="dsh-voice-panel__label">{copy.shortcut}</span>
          <button
            ref={shortcutButtonRef}
            type="button"
            className={`dsh-voice-panel__control${capturingHotkey ? ' dsh-voice-panel__control--capture' : ''}`}
            onClick={() => { setCapturingHotkey(true) }}
            onKeyDown={onShortcutKey}
          >
            {capturingHotkey ? copy.captureShortcut : shortcutLabel}
          </button>
        </div>
        <label className="dsh-voice-panel__row">
          <span className="dsh-voice-panel__label">{copy.language}</span>
          <select className="dsh-voice-panel__control" value={settings.language} onChange={onLanguage}>
            {RECOGNITION_LANGUAGES.map(language =>
              <option key={language} value={language}>{language === 'auto' ? copy.auto : language}</option>)}
          </select>
        </label>
        <p className="dsh-voice-panel__meta">{copy.privacy}</p>
        <div className="dsh-voice-panel__actions">
          <button type="button" className="dsh-voice-panel__reset" onClick={resetSettings}>{copy.reset}</button>
        </div>
      </div>,
      document.body,
    )}
  </>
}

function captureInsertion(draft: string): InsertionSnapshot {
  const textarea = composerTextarea(draft)
  if (textarea === null || textarea.value !== draft) {
    return Object.freeze({ draft, start: draft.length, end: draft.length })
  }
  return Object.freeze({
    draft,
    start: textarea.selectionStart ?? draft.length,
    end: textarea.selectionEnd ?? draft.length,
  })
}

function composerTextarea(draft: string): HTMLTextAreaElement | null {
  const active = document.activeElement
  if (active instanceof HTMLTextAreaElement && !active.disabled) return active
  const candidates = [...document.querySelectorAll<HTMLTextAreaElement>('textarea:not(:disabled)')]
  return candidates.find(candidate => candidate.value === draft && candidate.getClientRects().length > 0)
    ?? candidates.find(candidate => candidate.getClientRects().length > 0)
    ?? null
}

function browserLanguage(): string {
  return typeof navigator === 'undefined' || navigator.language.length === 0
    ? 'zh-CN'
    : navigator.language
}

function platformKind(): 'mac' | 'windows' | 'other' {
  if (typeof navigator === 'undefined') return 'other'
  const value = `${navigator.platform} ${navigator.userAgent}`.toLocaleLowerCase('en-US')
  if (value.includes('mac')) return 'mac'
  if (value.includes('win')) return 'windows'
  return 'other'
}

function systemDictationGesture(): string {
  const platform = platformKind()
  if (platform === 'mac') return 'Fn×2'
  if (platform === 'windows') return 'Win+H'
  return 'the system dictation shortcut'
}

function describeError(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) return error.message
  return String(error)
}

function MicIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="8" y="3" width="8" height="12" rx="4" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
  </svg>
}

function SettingsIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19 13.5v-3l-2-.7-.7-1.7.9-1.9-2.1-2.1-1.9.9-1.7-.7L10.5 2h-3l-.7 2-1.7.7-1.9-.9-2.1 2.1.9 1.9-.7 1.7-2 .7v3l2 .7.7 1.7-.9 1.9 2.1 2.1 1.9-.9 1.7.7.7 2h3l.7-2 1.7-.7 1.9.9 2.1-2.1-.9-1.9.7-1.7 2-.7Z" transform="translate(2.25 0) scale(.82 1)" />
  </svg>
}
