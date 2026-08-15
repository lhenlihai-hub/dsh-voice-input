/** The exact Harness route selected for this Session's next model call. */
export interface VoiceModelSelection {
  readonly provider: string
  readonly model: string
  readonly reasoningEffort?: string
}

/** Validated request crossing from the browser plugin to the Harness Host. */
export interface CleanupRequest {
  readonly text: string
  readonly model: VoiceModelSelection
}

/** Transcript returned by the current Harness model. */
export interface CleanupResponse {
  readonly text: string
  readonly changed: boolean
}

/** Explicit confirmation required by the destructive uninstall Remote. */
export interface UninstallRequest {
  readonly confirmation: 'remove dsh-voice-input'
}

/** A successful removal requires the current Harness process to restart. */
export interface UninstallResponse {
  readonly removed: true
  readonly profile: string
  readonly restartRequired: true
}
