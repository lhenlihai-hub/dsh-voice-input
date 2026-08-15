export interface SpeechRecognitionAlternativeLike {
    readonly transcript: string;
}
export interface SpeechRecognitionResultLike {
    readonly isFinal: boolean;
    readonly length: number;
    readonly [index: number]: SpeechRecognitionAlternativeLike;
}
export interface SpeechRecognitionResultListLike {
    readonly length: number;
    readonly [index: number]: SpeechRecognitionResultLike;
}
export interface SpeechRecognitionEventLike extends Event {
    readonly results: SpeechRecognitionResultListLike;
}
export interface SpeechRecognitionErrorEventLike extends Event {
    readonly error: string;
    readonly message?: string;
}
export interface BrowserSpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    lang: string;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}
type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;
export declare function speechRecognitionConstructor(): SpeechRecognitionConstructor | null;
/** Recompute the whole result list so repeated browser events never duplicate text. */
export declare function collectRecognitionText(results: SpeechRecognitionResultListLike): {
    readonly finalText: string;
    readonly interimText: string;
};
export {};
//# sourceMappingURL=speech.d.ts.map