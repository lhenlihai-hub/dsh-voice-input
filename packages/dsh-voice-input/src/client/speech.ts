export interface SpeechRecognitionAlternativeLike {
  readonly transcript: string
}

export interface SpeechRecognitionResultLike {
  readonly isFinal: boolean
  readonly length: number
  readonly [index: number]: SpeechRecognitionAlternativeLike
}

export interface SpeechRecognitionResultListLike {
  readonly length: number
  readonly [index: number]: SpeechRecognitionResultLike
}

export interface SpeechRecognitionEventLike extends Event {
  readonly results: SpeechRecognitionResultListLike
}

export interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string
  readonly message?: string
}

export interface BrowserSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition

interface SpeechWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

export function speechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const speechWindow = window as SpeechWindow
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null
}

/** Recompute the whole result list so repeated browser events never duplicate text. */
export function collectRecognitionText(results: SpeechRecognitionResultListLike): {
  readonly finalText: string
  readonly interimText: string
} {
  const finalParts: string[] = []
  const interimParts: string[] = []
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index]
    if (result === undefined) continue
    const alternative = result?.[0]
    if (alternative === undefined) continue
    if (result.isFinal) finalParts.push(alternative.transcript)
    else interimParts.push(alternative.transcript)
  }
  return Object.freeze({
    finalText: finalParts.join('').trim(),
    interimText: interimParts.join('').trim(),
  })
}
