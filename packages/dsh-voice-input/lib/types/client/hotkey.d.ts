export interface KeyEventLike {
    readonly key: string;
    readonly code: string;
    readonly ctrlKey: boolean;
    readonly altKey: boolean;
    readonly metaKey: boolean;
    readonly shiftKey: boolean;
}
export interface HotkeySpec {
    readonly key: string;
    readonly code: string;
    readonly ctrl: boolean;
    readonly alt: boolean;
    readonly meta: boolean;
    readonly shift: boolean;
}
export declare const DEFAULT_HOTKEY: HotkeySpec;
/** Convert one keyboard event into a safe shortcut, or reject bare typing. */
export declare function hotkeyFromEvent(event: KeyEventLike): HotkeySpec | null;
/** Match by physical code when available so custom keyboard layouts remain stable. */
export declare function matchesHotkey(event: KeyEventLike, hotkey: HotkeySpec): boolean;
/** Human-readable label for tooltips and the settings panel. */
export declare function formatHotkey(hotkey: HotkeySpec, mac: boolean): string;
export declare function isHotkeySpec(value: unknown): value is HotkeySpec;
//# sourceMappingURL=hotkey.d.ts.map