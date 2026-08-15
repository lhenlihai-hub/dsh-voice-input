/** The exact Harness route selected for this Session's next model call. */
export interface VoiceModelSelection {
    readonly provider: string;
    readonly model: string;
    readonly reasoningEffort?: string;
}
/** Validated request crossing from the browser plugin to the Harness Host. */
export interface CleanupRequest {
    readonly text: string;
    readonly model: VoiceModelSelection;
}
/** Transcript returned by the current Harness model. */
export interface CleanupResponse {
    readonly text: string;
    readonly changed: boolean;
}
//# sourceMappingURL=types.d.ts.map