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
.dsh-voice-panel { position: fixed; z-index: 10000; width: min(340px, calc(100vw - 16px)); box-sizing: border-box; padding: 14px; border: 1px solid color-mix(in srgb, currentColor 16%, transparent); border-radius: 12px; background: var(--background, var(--color-background, #fff)); color: var(--foreground, var(--color-foreground, #171717)); box-shadow: 0 16px 44px rgba(0,0,0,.22); font: 13px/1.45 system-ui, sans-serif; }
@media (prefers-color-scheme: dark) { .dsh-voice-panel { background: var(--background, var(--color-background, #191919)); color: var(--foreground, var(--color-foreground, #f2f2f2)); } }
.dsh-voice-panel__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.dsh-voice-panel__title { margin: 0; font-size: 14px; font-weight: 650; }
.dsh-voice-panel__close { appearance: none; border: 0; background: transparent; color: inherit; cursor: pointer; font-size: 18px; line-height: 1; opacity: .65; }
.dsh-voice-panel__status { margin: 0 0 12px; padding: 9px 10px; border-radius: 8px; background: color-mix(in srgb, currentColor 7%, transparent); overflow-wrap: anywhere; }
.dsh-voice-panel__preview { display: block; margin-top: 5px; opacity: .72; }
.dsh-voice-panel__row { display: grid; grid-template-columns: 92px 1fr; align-items: center; gap: 10px; margin-top: 10px; }
.dsh-voice-panel__label { opacity: .7; }
.dsh-voice-panel__control { min-width: 0; box-sizing: border-box; width: 100%; min-height: 32px; border: 1px solid color-mix(in srgb, currentColor 18%, transparent); border-radius: 8px; background: color-mix(in srgb, currentColor 4%, transparent); color: inherit; padding: 5px 9px; font: inherit; }
button.dsh-voice-panel__control { cursor: pointer; text-align: left; }
.dsh-voice-panel__control--capture { outline: 2px solid #4f8cff; }
.dsh-voice-panel__meta { margin: 12px 0 0; opacity: .62; font-size: 12px; }
.dsh-voice-panel__actions { display: flex; justify-content: flex-end; margin-top: 10px; }
.dsh-voice-panel__reset { appearance: none; border: 0; background: transparent; color: inherit; padding: 3px 0; cursor: pointer; opacity: .7; font: inherit; }
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
