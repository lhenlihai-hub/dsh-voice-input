export declare const PLUGIN_PACKAGE = "dsh-voice-input";
export declare const UNINSTALL_CONFIRMATION = "remove dsh-voice-input";
export interface UninstallRuntime {
    readonly execPath: string;
    readonly argv: readonly string[];
}
export interface CommandResult {
    readonly error?: Error;
    readonly status: number | null;
    readonly stdout?: string | Buffer;
    readonly stderr?: string | Buffer;
}
export type CommandRunner = (command: string, args: readonly string[], options: Readonly<{
    encoding: 'utf8';
    timeout: number;
    windowsHide: true;
}>) => CommandResult;
/** Resolve both `dsh --profile web` and the official `dsh web` alias. */
export declare function resolveProfileName(argv: readonly string[]): string | null;
/**
 * Remove only this package through the same official DSH executable that
 * started Harness. No path, package name, or command comes from the browser.
 */
export declare function uninstallCurrentPlugin(runtime: UninstallRuntime, runner?: CommandRunner): string;
//# sourceMappingURL=uninstall.d.ts.map