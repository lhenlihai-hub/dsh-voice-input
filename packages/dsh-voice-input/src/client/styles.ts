const STYLE_ID = 'dsh-voice-input/styles'

const CSS = `
.dsh-voice { display: inline-flex; align-items: center; gap: 1px; }
.dsh-voice__button { appearance: none; border: 0; background: transparent; color: inherit; width: 30px; height: 30px; border-radius: 8px; display: inline-grid; place-items: center; cursor: pointer; opacity: .78; }
.dsh-voice__button:hover { background: color-mix(in srgb, currentColor 10%, transparent); opacity: 1; }
.dsh-voice__button:focus-visible { outline: 2px solid #4f8cff; outline-offset: 1px; }
.dsh-voice__button:disabled { cursor: not-allowed; opacity: .35; }
.dsh-voice__button--active { color: #ef4444; opacity: 1; animation: dsh-voice-pulse 1.2s ease-in-out infinite; }
.dsh-voice__settings { width: 24px; }
.dsh-voice svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.dsh-voice-panel { position: fixed; z-index: 10000; width: min(300px, calc(100vw - 16px)); box-sizing: border-box; padding: 13px; border: 1px solid color-mix(in srgb, currentColor 16%, transparent); border-radius: 12px; background: var(--background, var(--color-background, #fff)); color: var(--foreground, var(--color-foreground, #171717)); box-shadow: 0 16px 44px rgba(0,0,0,.22); font: 13px/1.45 system-ui, sans-serif; }
@media (prefers-color-scheme: dark) { .dsh-voice-panel { background: var(--background, var(--color-background, #191919)); color: var(--foreground, var(--color-foreground, #f2f2f2)); } }
.dsh-voice-panel__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.dsh-voice-panel__title { margin: 0; font-size: 14px; font-weight: 650; }
.dsh-voice-panel__close { appearance: none; border: 0; background: transparent; color: inherit; cursor: pointer; font-size: 18px; line-height: 1; opacity: .65; }
.dsh-voice-panel__instruction { display: flex; flex-wrap: wrap; align-items: center; margin: 0 0 12px; font-size: 14px; }
.dsh-voice-panel__shortcut { appearance: none; border: 0; background: transparent; color: #3975e9; padding: 2px 3px; border-radius: 5px; cursor: pointer; font: 650 13px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
.dsh-voice-panel__shortcut:hover { background: color-mix(in srgb, #3975e9 12%, transparent); }
.dsh-voice-panel__shortcut:disabled { cursor: not-allowed; opacity: .5; }
.dsh-voice-panel__shortcut--capture { outline: 2px solid #4f8cff; }
.dsh-voice-panel__status { margin: 10px 0 0; padding: 7px 8px; border-radius: 7px; background: color-mix(in srgb, currentColor 7%, transparent); overflow-wrap: anywhere; font-size: 12px; }
.dsh-voice-panel__preview { display: block; margin-top: 5px; opacity: .72; }
.dsh-voice-panel__row { display: grid; grid-template-columns: 72px 1fr; align-items: center; gap: 9px; }
.dsh-voice-panel__label { opacity: .7; }
.dsh-voice-panel__control { min-width: 0; box-sizing: border-box; width: 100%; min-height: 32px; border: 1px solid color-mix(in srgb, currentColor 18%, transparent); border-radius: 8px; background: color-mix(in srgb, currentColor 4%, transparent); color: inherit; padding: 5px 9px; font: inherit; }
.dsh-voice-panel__control:disabled { cursor: not-allowed; opacity: .5; }
.dsh-voice-panel__actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 12px; padding-top: 10px; border-top: 1px solid color-mix(in srgb, currentColor 10%, transparent); }
.dsh-voice-panel__reset, .dsh-voice-panel__uninstall { appearance: none; border: 0; background: transparent; padding: 3px 0; cursor: pointer; font: inherit; }
.dsh-voice-panel__reset { color: inherit; opacity: .68; }
.dsh-voice-panel__uninstall { color: #dc2626; }
.dsh-voice-panel__reset:disabled, .dsh-voice-panel__uninstall:disabled { cursor: not-allowed; opacity: .42; }
@keyframes dsh-voice-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(.88); } }
@media (prefers-reduced-motion: reduce) { .dsh-voice__button--active { animation: none; } }
`

export function installStyles(): () => void {
  const existing = document.querySelector<HTMLStyleElement>(`style[data-plugin-css="${STYLE_ID}"]`)
  if (existing !== null) return () => undefined
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-voice-input'
  tag.dataset.pluginCss = STYLE_ID
  tag.textContent = CSS
  document.head.appendChild(tag)
  return () => { tag.remove() }
}
