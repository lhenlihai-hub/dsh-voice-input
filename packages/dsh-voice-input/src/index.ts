/** DeepSeek Harness Host half for voice transcript cleanup. */

import type { Context } from '@deepseek-ai/cordis'
import {
  BlockAssembler,
  createMessage,
  createUserMessage,
} from '@deepseek-ai/dsh-llm'
import type { ReasoningEffortId } from '@deepseek-ai/dsh-llm'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import {
  CLEANUP_SYSTEM_PROMPT,
  MAX_TRANSCRIPT_CHARS,
  cleanupMaxTokens,
  finishFailure,
  normalizeCleanedText,
  textFromBlocks,
} from './cleanup.ts'
import type { CleanupRequest, CleanupResponse } from './types.ts'

export type { CleanupRequest, CleanupResponse, VoiceModelSelection } from './types.ts'
export {
  CLEANUP_SYSTEM_PROMPT,
  MAX_TRANSCRIPT_CHARS,
  cleanupMaxTokens,
  finishFailure,
  normalizeCleanedText,
  textFromBlocks,
} from './cleanup.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    voiceInput: VoiceInputService
  }
}

/** Host service exposed to the browser through a generated Typert Remote. */
export class VoiceInputService extends TypertRemoteService {
  static inject = ['llm']

  constructor(ctx: Context) {
    super(ctx, 'voiceInput')
  }

  /**
   * Clean one transcript with the model selected by the addressed browser
   * Session. The Client resolves the selection immediately before this call;
   * the Host supplies credentials and routing through the normal Harness LLM.
   */
  @Remote('cleanup')
  async cleanup(request: CleanupRequest, signal: AbortSignal): Promise<CleanupResponse> {
    const source = validateRequest(request)
    const assembler = new BlockAssembler()
    const messages = [
      createUserMessage({
        content: [{ type: 'text' as const, text: '嗯那个你觉得这个方案行不行啊' }],
        source: { kind: 'user' as const },
      }),
      createMessage({
        role: 'assistant' as const,
        content: [{ type: 'text' as const, text: '你觉得这个方案行不行？' }],
        source: { kind: 'plugin' as const, plugin: 'dsh-voice-input' },
      }),
      createUserMessage({
        content: [{ type: 'text' as const, text: source }],
        source: { kind: 'user' as const },
      }),
    ]

    for await (const chunk of this.ctx.llm.stream({
      provider: request.model.provider,
      model: request.model.model,
      ...(request.model.reasoningEffort === undefined
        ? {}
        : { reasoningEffort: request.model.reasoningEffort as ReasoningEffortId }),
      system: CLEANUP_SYSTEM_PROMPT,
      messages,
      temperature: 0.2,
      maxTokens: cleanupMaxTokens(source),
      signal,
    })) {
      assembler.push(chunk)
    }

    const failure = finishFailure(assembler.finish)
    if (failure !== null) throw new Error(`voice-input cleanup failed: ${failure}`)
    const cleaned = normalizeCleanedText(source, textFromBlocks(assembler.blocks()))
    return Object.freeze({ text: cleaned, changed: cleaned !== source })
  }
}

function validateRequest(request: CleanupRequest): string {
  const text = request.text.trim()
  if (text.length === 0) throw new TypeError('voice-input: transcript must not be blank')
  if (text.length > MAX_TRANSCRIPT_CHARS) {
    throw new RangeError(`voice-input: transcript exceeds ${String(MAX_TRANSCRIPT_CHARS)} characters`)
  }
  if (request.model.provider.trim().length === 0 || request.model.model.trim().length === 0) {
    throw new TypeError('voice-input: current model selection is incomplete')
  }
  return text
}

export default VoiceInputService
