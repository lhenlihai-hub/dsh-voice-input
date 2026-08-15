export interface TextChange {
    readonly start: number;
    readonly beforeEnd: number;
    readonly afterEnd: number;
    readonly removed: string;
    readonly inserted: string;
}
/** One minimal prefix/suffix diff, sufficient for a single dictation edit. */
export declare function diffText(before: string, after: string): TextChange | null;
/** Insert direct recognition text at the captured selection with conservative spacing. */
export declare function insertTranscript(draft: string, start: number, end: number, transcript: string): string;
export declare function appendTranscript(draft: string, transcript: string): string;
/**
 * Replace only the exact dictation occurrence observed before cleanup. If the
 * user edited that occurrence while the model was running, retain their live
 * draft and report that no replacement was safe.
 */
export declare function replaceObservedInsertion(liveDraft: string, observedDraft: string, change: TextChange, cleaned: string): {
    readonly text: string;
    readonly replaced: boolean;
};
//# sourceMappingURL=text.d.ts.map