import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_HOTKEY,
  formatHotkey,
  hotkeyFromEvent,
  matchesHotkey,
} from '../lib/types/client/hotkey.js'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../lib/types/client/settings.js'

function key(overrides = {}) {
  return {
    key: 'v',
    code: 'KeyV',
    ctrlKey: true,
    altKey: true,
    metaKey: false,
    shiftKey: false,
    ...overrides,
  }
}

test('rejects bare typing but accepts modified and function keys', () => {
  assert.equal(hotkeyFromEvent(key({ ctrlKey: false, altKey: false })), null)
  assert.deepEqual(hotkeyFromEvent(key()), DEFAULT_HOTKEY)
  assert.deepEqual(hotkeyFromEvent(key({
    key: 'F8', code: 'F8', ctrlKey: false, altKey: false,
  })), {
    key: 'F8', code: 'F8', ctrl: false, alt: false, meta: false, shift: false,
  })
})

test('matches the physical key plus the exact modifier set', () => {
  assert.equal(matchesHotkey(key(), DEFAULT_HOTKEY), true)
  assert.equal(matchesHotkey(key({ shiftKey: true }), DEFAULT_HOTKEY), false)
  assert.equal(matchesHotkey(key({ code: 'KeyB' }), DEFAULT_HOTKEY), false)
  assert.equal(formatHotkey(DEFAULT_HOTKEY, true), '⌃⌥V')
  assert.equal(formatHotkey(DEFAULT_HOTKEY, false), 'Ctrl+Alt+V')
})

test('settings persistence is validated and fails closed to defaults', () => {
  const values = new Map()
  const storage = {
    getItem: name => values.get(name) ?? null,
    setItem: (name, value) => values.set(name, value),
  }
  saveSettings(storage, { hotkey: DEFAULT_HOTKEY, language: 'en-US' })
  assert.equal(loadSettings(storage).language, 'en-US')
  values.set('dsh-voice-input.settings.v2', '{"hotkey":{},"language":"bad"}')
  assert.deepEqual(loadSettings(storage), DEFAULT_SETTINGS)
})
