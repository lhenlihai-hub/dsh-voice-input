/** DeepSeek Harness Host half for voice transcript cleanup. */
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { CleanupRequest, CleanupResponse, UninstallRequest, UninstallResponse } from './types.ts';
export type { CleanupRequest, CleanupResponse, UninstallRequest, UninstallResponse, VoiceModelSelection, } from './types.ts';
export { CLEANUP_SYSTEM_PROMPT, MAX_TRANSCRIPT_CHARS, cleanupMaxTokens, extractCleanupText, finishFailure, normalizeCleanedText, textFromBlocks, } from './cleanup.ts';
export { PLUGIN_PACKAGE, UNINSTALL_CONFIRMATION, resolveProfileName, uninstallCurrentPlugin, } from './uninstall.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        voiceInput: VoiceInputService;
        appExit?: (code: number) => void;
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
    /** Remove this exact package through official DSH plugin management. */
    uninstall(request: UninstallRequest): Promise<UninstallResponse>;
}
export default VoiceInputService;
//# sourceMappingURL=index.d.ts.map