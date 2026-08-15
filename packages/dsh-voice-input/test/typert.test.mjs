import test from 'node:test'
import assert from 'node:assert/strict'
import remote from '../lib/typert.remote-client.js'
import { TYPERT as host } from '../lib/typert.host.js'

test('official generator emits matching strict Host and Client descriptors', () => {
  assert.equal(remote.package, 'dsh-voice-input')
  assert.equal(host.package, remote.package)
  assert.equal(remote.descriptors.length, 2)
  assert.equal(host.invocations.length, 2)
  const descriptor = remote.descriptors.find(value => value.id.endsWith('/cleanup'))
  assert.ok(descriptor)
  assert.equal(descriptor.id, 'dsh-voice-input#voiceInput/cleanup')
  assert.deepEqual(descriptor.cancellation, { parameter: 'signal' })
  assert.equal(descriptor.parameters[0].codec.schema.safeParse({
    text: 'hello',
    model: { provider: 'deepseek-official', model: 'deepseek-chat' },
  }).success, true)
  assert.equal(descriptor.parameters[0].codec.schema.safeParse({
    text: 3,
    model: { provider: 'deepseek-official', model: 'deepseek-chat' },
  }).success, false)
  const uninstall = remote.descriptors.find(value => value.id.endsWith('/uninstall'))
  assert.ok(uninstall)
  assert.equal(uninstall.parameters[0].codec.schema.safeParse({
    confirmation: 'remove dsh-voice-input',
  }).success, true)
  assert.equal(uninstall.parameters[0].codec.schema.safeParse({
    confirmation: 'remove another-plugin',
  }).success, false)
})
