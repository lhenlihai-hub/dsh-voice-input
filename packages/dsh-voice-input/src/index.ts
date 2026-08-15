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
import {
  UNINSTALL_CONFIRMATION,
  uninstallCurrentPlugin,
} from './uninstall.ts'
import type {
  CleanupRequest,
  CleanupResponse,
  UninstallRequest,
  UninstallResponse,
} from './types.ts'

export type {
  CleanupRequest,
  CleanupResponse,
  UninstallRequest,
  UninstallResponse,
  VoiceModelSelection,
} from './types.ts'
export {
  CLEANUP_SYSTEM_PROMPT,
  MAX_TRANSCRIPT_CHARS,
  cleanupMaxTokens,
  extractCleanupText,
  finishFailure,
  normalizeCleanedText,
  textFromBlocks,
} from './cleanup.ts'
export {
  PLUGIN_PACKAGE,
  UNINSTALL_CONFIRMATION,
  resolveProfileName,
  uninstallCurrentPlugin,
} from './uninstall.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    voiceInput: VoiceInputService
    appExit?: (code: number) => void
  }
}

/** Host service exposed to the browser through a generated Typert Remote. */
export class VoiceInputService extends TypertRemoteService {
  static inject = ['llm', 'appExit']

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
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ text: '你觉得这个方案行不行？' }),
        }],
        source: { kind: 'plugin' as const, plugin: 'dsh-voice-input' },
      }),
      createUserMessage({
        content: [{
          type: 'text' as const,
          text: '我们现在对软件进行重新的review',
        }],
        source: { kind: 'user' as const },
      }),
      createMessage({
        role: 'assistant' as const,
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ text: '我们现在对软件进行重新的review。' }),
        }],
        source: { kind: 'plugin' as const, plugin: 'dsh-voice-input' },
      }),
      createUserMessage({
        content: [{
          type: 'text' as const,
          text: '今天先检查登录流程明天再看支付模块如果测试不过我们就先不发布',
        }],
        source: { kind: 'user' as const },
      }),
      createMessage({
        role: 'assistant' as const,
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            text: '今天先检查登录流程。明天再看支付模块。如果测试不过，我们就先不发布。',
          }),
        }],
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
      temperature: 0,
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

  /** Remove this exact package through official DSH plugin management. */
  @Remote('uninstall')
  async uninstall(request: UninstallRequest): Promise<UninstallResponse> {
    if (request.confirmation !== UNINSTALL_CONFIRMATION) {
      throw new TypeError('voice-input: uninstall confirmation is invalid')
    }
    const appExit = this.ctx.appExit
    if (typeof appExit !== 'function') {
      throw new Error('voice-input: Harness cannot exit safely; use the documented CLI uninstall command')
    }

    const profile = uninstallCurrentPlugin({
      execPath: process.execPath,
      argv: process.argv,
    })
    setTimeout(() => { appExit(0) }, 750)
    return Object.freeze({ removed: true, profile, restartRequired: true })
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
