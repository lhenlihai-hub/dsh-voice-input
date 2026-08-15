export interface TextChange {
  readonly start: number
  readonly beforeEnd: number
  readonly afterEnd: number
  readonly removed: string
  readonly inserted: string
}

/** One minimal prefix/suffix diff, sufficient for a single dictation edit. */
export function diffText(before: string, after: string): TextChange | null {
  if (before === after) return null
  let start = 0
  const common = Math.min(before.length, after.length)
  while (start < common && before[start] === after[start]) start += 1

  let beforeEnd = before.length
  let afterEnd = after.length
  while (
    beforeEnd > start
    && afterEnd > start
    && before[beforeEnd - 1] === after[afterEnd - 1]
  ) {
    beforeEnd -= 1
    afterEnd -= 1
  }

  return Object.freeze({
    start,
    beforeEnd,
    afterEnd,
    removed: before.slice(start, beforeEnd),
    inserted: after.slice(start, afterEnd),
  })
}

/** Insert direct recognition text at the captured selection with conservative spacing. */
export function insertTranscript(draft: string, start: number, end: number, transcript: string): string {
  const text = transcript.trim()
  if (text.length === 0) return draft
  const safeStart = Math.max(0, Math.min(start, draft.length))
  const safeEnd = Math.max(safeStart, Math.min(end, draft.length))
  const left = draft.slice(0, safeStart)
  const right = draft.slice(safeEnd)
  const leftSpace = needsAsciiWordSpace(left.at(-1), text[0]) ? ' ' : ''
  const rightSpace = needsAsciiWordSpace(text.at(-1), right[0]) ? ' ' : ''
  return `${left}${leftSpace}${text}${rightSpace}${right}`
}

export function appendTranscript(draft: string, transcript: string): string {
  return insertTranscript(draft, draft.length, draft.length, transcript)
}

/**
 * Replace only the exact dictation occurrence observed before cleanup. If the
 * user edited that occurrence while the model was running, retain their live
 * draft and report that no replacement was safe.
 */
export function replaceObservedInsertion(
  liveDraft: string,
  observedDraft: string,
  change: TextChange,
  cleaned: string,
): { readonly text: string; readonly replaced: boolean } {
  const source = change.inserted
  if (source.length === 0) return Object.freeze({ text: liveDraft, replaced: false })
  if (liveDraft === observedDraft) {
    return Object.freeze({
      text: `${liveDraft.slice(0, change.start)}${cleaned}${liveDraft.slice(change.afterEnd)}`,
      replaced: true,
    })
  }
  if (liveDraft.slice(change.start, change.start + source.length) === source) {
    return Object.freeze({
      text: `${liveDraft.slice(0, change.start)}${cleaned}${liveDraft.slice(change.start + source.length)}`,
      replaced: true,
    })
  }
  return Object.freeze({ text: liveDraft, replaced: false })
}

function needsAsciiWordSpace(left: string | undefined, right: string | undefined): boolean {
  if (left === undefined || right === undefined) return false
  return /[A-Za-z0-9]/u.test(left) && /[A-Za-z0-9]/u.test(right)
}
