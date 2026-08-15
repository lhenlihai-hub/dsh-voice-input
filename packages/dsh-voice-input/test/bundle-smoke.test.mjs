import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

test('client.js registers a loadable Harness module factory', async () => {
  let definition
  const previousWindow = globalThis.window
  globalThis.window = {
    __ModuleLoader__: {
      load(value) { definition = value },
    },
  }
  try {
    const url = pathToFileURL(resolve('packages/dsh-voice-input/lib/client.js'))
    url.searchParams.set('test', String(Date.now()))
    await import(url.href)
    assert.equal(definition.id, 'dsh-voice-input')
    assert.equal(typeof definition.factory, 'function')
    const require = createRequire(import.meta.url)
    const module = definition.factory(specifier => require(specifier))
    assert.deepEqual(module.inject, ['slots', 'remote', 'modelDirectories'])
    assert.equal(typeof module.apply, 'function')
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})
