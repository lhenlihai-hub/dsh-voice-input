import test from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveProfileName,
  uninstallCurrentPlugin,
} from '../lib/types/uninstall.js'

test('resolves official profile forms and rejects unsafe names', () => {
  assert.equal(resolveProfileName(['node', 'dsh', '--profile', 'work']), 'work')
  assert.equal(resolveProfileName(['node', 'dsh', '--profile=web']), 'web')
  assert.equal(resolveProfileName(['node', 'dsh', 'web']), 'web')
  assert.equal(resolveProfileName(['node', 'dsh', '--profile', '../web']), null)
  assert.equal(resolveProfileName(['node', 'dsh']), null)
})

test('uninstall invokes the current official CLI with fixed arguments only', () => {
  let invocation
  const profile = uninstallCurrentPlugin({
    execPath: '/node',
    argv: ['/node', '/official/dsh.js', '--profile', 'web'],
  }, (command, args, options) => {
    invocation = { command, args, options }
    return { status: 0 }
  })
  assert.equal(profile, 'web')
  assert.deepEqual(invocation, {
    command: '/node',
    args: [
      '/official/dsh.js',
      'plugin',
      '--profile',
      'web',
      'remove',
      'dsh-voice-input',
    ],
    options: { encoding: 'utf8', timeout: 120_000, windowsHide: true },
  })
})

test('uninstall fails before spawning when the current profile is unknown', () => {
  let called = false
  assert.throws(() => uninstallCurrentPlugin({
    execPath: '/node',
    argv: ['/node', '/official/dsh.js'],
  }, () => {
    called = true
    return { status: 0 }
  }), /identify the current Harness profile/u)
  assert.equal(called, false)
})
