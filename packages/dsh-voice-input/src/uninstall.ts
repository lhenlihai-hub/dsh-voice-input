import { spawnSync } from 'node:child_process'

export const PLUGIN_PACKAGE = 'dsh-voice-input'
export const UNINSTALL_CONFIRMATION = 'remove dsh-voice-input'

const PROFILE_NAME = /^[A-Za-z0-9._-]+$/u

export interface UninstallRuntime {
  readonly execPath: string
  readonly argv: readonly string[]
}

export interface CommandResult {
  readonly error?: Error
  readonly status: number | null
  readonly stdout?: string | Buffer
  readonly stderr?: string | Buffer
}

export type CommandRunner = (
  command: string,
  args: readonly string[],
  options: Readonly<{
    encoding: 'utf8'
    timeout: number
    windowsHide: true
  }>,
) => CommandResult

/** Resolve both `dsh --profile web` and the official `dsh web` alias. */
export function resolveProfileName(argv: readonly string[]): string | null {
  const args = argv.slice(2)
  if (args[0] === 'web') return 'web'
  const option = args.findIndex(value => value === '--profile')
  const inline = args.find(value => value.startsWith('--profile='))
  const candidate = option >= 0 ? args[option + 1] : inline?.slice('--profile='.length)
  return candidate !== undefined && PROFILE_NAME.test(candidate) ? candidate : null
}

/**
 * Remove only this package through the same official DSH executable that
 * started Harness. No path, package name, or command comes from the browser.
 */
export function uninstallCurrentPlugin(
  runtime: UninstallRuntime,
  runner: CommandRunner = defaultCommandRunner,
): string {
  const profile = resolveProfileName(runtime.argv)
  const cliPath = runtime.argv[1]
  if (profile === null || cliPath === undefined || cliPath.trim().length === 0) {
    throw new Error('Unable to identify the current Harness profile. Use the documented dsh plugin remove command.')
  }

  const result = runner(runtime.execPath, [
    cliPath,
    'plugin',
    '--profile',
    profile,
    'remove',
    PLUGIN_PACKAGE,
  ], {
    encoding: 'utf8',
    timeout: 120_000,
    windowsHide: true,
  })

  if (result.error !== undefined) throw result.error
  if (result.status !== 0) {
    const diagnostic = outputText(result.stderr) || outputText(result.stdout)
    throw new Error(diagnostic.length > 0
      ? `Official DSH uninstall failed: ${diagnostic}`
      : `Official DSH uninstall failed with exit code ${String(result.status)}`)
  }
  return profile
}

const defaultCommandRunner: CommandRunner = (command, args, options) =>
  spawnSync(command, [...args], options)

function outputText(value: string | Buffer | undefined): string {
  return value === undefined ? '' : value.toString().trim().slice(0, 1_000)
}
