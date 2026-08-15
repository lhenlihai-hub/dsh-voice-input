import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
export interface CleanupOutcome {
    readonly text: string;
    readonly modelLabel: string;
}
export interface VoiceInputInjected {
    readonly cleanupTranscript: (text: string, signal: AbortSignal) => Promise<CleanupOutcome>;
    readonly uninstallPlugin: () => Promise<{
        readonly profile: string;
    }>;
}
type VoiceInputProps = PropsRuntime<'conversation.input.left'> & VoiceInputInjected;
export declare function VoiceInput({ input, inputActions, cleanupTranscript, uninstallPlugin, }: VoiceInputProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=VoiceInput.d.ts.map