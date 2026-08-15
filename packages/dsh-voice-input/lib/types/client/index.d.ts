/** DeepSeek Harness browser half: composer slot, recognition, and cleanup Remote. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
export type { CleanupOutcome, VoiceInputInjected } from './VoiceInput.tsx';
export { DEFAULT_HOTKEY, formatHotkey, hotkeyFromEvent, matchesHotkey, } from './hotkey.ts';
export { appendTranscript, diffText, insertTranscript, replaceObservedInsertion, } from './text.ts';
/** Required Client services. Package-level injects ensure their modules load first. */
export declare const inject: string[];
/**
 * Mount the generated Remote contribution and register one additive control in
 * the official conversation.input.left slot. Remote setup is fail-open: if a
 * future Harness rejects the contribution, raw dictation remains usable and
 * the page itself still loads.
 */
export declare function apply(ctx: ClientContext): Promise<() => Promise<void>>;
//# sourceMappingURL=index.d.ts.map