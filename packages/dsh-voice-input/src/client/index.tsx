/** DeepSeek Harness browser half: composer slot, recognition, and cleanup Remote. */

import type { ClientContext, SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-model-selection/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type {
  CleanupRequest,
  CleanupResponse,
  UninstallRequest,
  UninstallResponse,
} from 'dsh-voice-input/types'
import VOICE_INPUT_REMOTE from 'dsh-voice-input/remote'
import { VoiceInput } from './VoiceInput.tsx'
import type { CleanupOutcome, VoiceInputInjected } from './VoiceInput.tsx'
import { installStyles } from './styles.ts'

export type { CleanupOutcome, VoiceInputInjected } from './VoiceInput.tsx'
export {
  DEFAULT_HOTKEY,
  formatHotkey,
  hotkeyFromEvent,
  matchesHotkey,
} from './hotkey.ts'
export {
  appendTranscript,
  diffText,
  insertTranscript,
  replaceObservedInsertion,
} from './text.ts'

interface VoiceInputRemote {
  cleanup(request: CleanupRequest, signal?: AbortSignal): Promise<RemoteResult<CleanupResponse>>
  uninstall(request: UninstallRequest): Promise<RemoteResult<UninstallResponse>>
}

type ContextWithVoiceRemote = ClientContext & {
  remote: ClientContext['remote'] & { readonly voiceInput: VoiceInputRemote }
}

/** Required Client services. Package-level injects ensure their modules load first. */
export const inject = ['slots', 'remote', 'modelDirectories']

/**
 * Mount the generated Remote contribution and register one additive control in
 * the official conversation.input.left slot. Remote setup is fail-open: if a
 * future Harness rejects the contribution, raw dictation remains usable and
 * the page itself still loads.
 */
export async function apply(ctx: ClientContext): Promise<() => Promise<void>> {
  const disposeStyles = installStyles()
  let disposeRemote: () => Promise<void> = async () => undefined
  try {
    disposeRemote = await ctx.remote.$mount(VOICE_INPUT_REMOTE)
  } catch (error) {
    console.error('dsh-voice-input: failed to mount cleanup Remote; raw dictation will be retained', error)
  }

  const disposeSlot = ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left',
    id: 'voice-input',
    order: 40,
    label: 'Voice input',
    inject: (sessionId): VoiceInputInjected => ({
      cleanupTranscript: (text, signal) => cleanupForSession(ctx, sessionId, text, signal),
      uninstallPlugin: () => uninstallPlugin(ctx),
    }),
  }, VoiceInput))

  return async () => {
    disposeSlot()
    disposeStyles()
    await disposeRemote()
  }
}

async function uninstallPlugin(ctx: ClientContext): Promise<{ readonly profile: string }> {
  const remote = (ctx as ContextWithVoiceRemote).remote.voiceInput
  if (remote === undefined) throw new Error('voice-input uninstall Remote is unavailable')
  const result = await remote.uninstall({ confirmation: 'remove dsh-voice-input' })
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
  return Object.freeze({ profile: result.value.profile })
}

async function cleanupForSession(
  ctx: ClientContext,
  sessionId: SessionId,
  text: string,
  signal: AbortSignal,
): Promise<CleanupOutcome> {
  const models = await ctx.modelDirectories.directoryFor(sessionId).load()
  const selection = models.current
  const request: CleanupRequest = {
    text,
    model: {
      provider: selection.provider,
      model: selection.model,
      ...(selection.reasoningEffort === undefined
        ? {}
        : { reasoningEffort: selection.reasoningEffort }),
    },
  }
  const remote = (ctx as ContextWithVoiceRemote).remote.voiceInput
  if (remote === undefined) throw new Error('voice-input cleanup Remote is unavailable')
  const result = await remote.cleanup(request, signal)
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
  return Object.freeze({
    text: result.value.text,
    modelLabel: `${selection.provider}/${selection.model}`,
  })
}
