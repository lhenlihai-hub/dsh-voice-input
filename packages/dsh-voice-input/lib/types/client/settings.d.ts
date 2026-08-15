import type { HotkeySpec } from './hotkey.ts';
export declare const RECOGNITION_LANGUAGES: readonly ["auto", "zh-CN", "zh-TW", "zh-HK", "en-US", "en-GB", "ja-JP", "ko-KR"];
export type RecognitionLanguage = typeof RECOGNITION_LANGUAGES[number];
export interface VoiceInputSettings {
    readonly hotkey: HotkeySpec;
    readonly language: RecognitionLanguage;
}
interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
export declare const DEFAULT_SETTINGS: VoiceInputSettings;
export declare function loadSettings(storage: StorageLike | undefined): VoiceInputSettings;
export declare function saveSettings(storage: StorageLike | undefined, settings: VoiceInputSettings): void;
export declare function clearSettings(storage: StorageLike | undefined): void;
export {};
//# sourceMappingURL=settings.d.ts.map