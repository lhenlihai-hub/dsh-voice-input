/** DeepSeek Harness Host half for voice transcript cleanup. */
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { CleanupRequest, CleanupResponse } from './types.ts';
export type { CleanupRequest, CleanupResponse, VoiceModelSelection } from './types.ts';
export { CLEANUP_SYSTEM_PROMPT, MAX_TRANSCRIPT_CHARS, cleanupMaxTokens, finishFailure, normalizeCleanedText, textFromBlocks, } from './cleanup.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        voiceInput: VoiceInputService;
    }
}
/** Host service exposed to the browser through a generated Typert Remote. */
export declare class VoiceInputService extends TypertRemoteService {
    static inject: string[];
    constructor(ctx: Context);
    /**
     * Clean one transcript with the model selected by the addressed browser
     * Session. The Client resolves the selection immediately before this call;
     * the Host supplies credentials and routing through the normal Harness LLM.
     */
    cleanup(request: CleanupRequest, signal: AbortSignal): Promise<CleanupResponse>;
}
export default VoiceInputService;
//# sourceMappingURL=index.d.ts.map