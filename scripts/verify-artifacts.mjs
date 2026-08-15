import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const plugin = resolve(root, 'packages/dsh-voice-input')
const required = [
  'lib/index.js',
  'lib/client.js',
  'lib/client.js.map',
  'lib/types/index.d.ts',
  'lib/types/client/index.d.ts',
  'lib/typert.host.js',
  'lib/typert.host.d.ts',
  'lib/typert.remote-client.js',
  'lib/typert.remote-client.d.ts',
  'cordis.patch.yml',
]

await Promise.all(required.map(file => access(resolve(plugin, file))))

const manifest = JSON.parse(await readFile(resolve(plugin, 'package.json'), 'utf8'))
assert.equal(manifest.name, 'dsh-voice-input')
assert.equal(manifest.dsh.client.platform, 'web')
assert.equal(manifest.exports['./client'].default, './lib/client.js')
assert.equal(manifest.exports['./remote'].default, './lib/typert.remote-client.js')

const rootManifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
assert.equal(rootManifest.name, 'dsh-voice-input')
assert.equal(rootManifest.dsh.bundle.patch, './packages/dsh-voice-input/cordis.patch.yml')
assert.equal(rootManifest.exports['./client'].default, './packages/dsh-voice-input/lib/client.js')

const client = await readFile(resolve(plugin, 'lib/client.js'), 'utf8')
assert.match(client, /^window\.__ModuleLoader__\.load\(\{/u)
assert.match(client, /id: "dsh-voice-input"/u)
assert.doesNotMatch(client, /plugins\/disable|plugins\/remove|rm -rf|self-uninstall/iu)

const hostRemote = await readFile(resolve(plugin, 'lib/typert.host.js'), 'utf8')
const clientRemote = await readFile(resolve(plugin, 'lib/typert.remote-client.js'), 'utf8')
assert.match(hostRemote, /dsh-voice-input#voiceInput\/cleanup/u)
assert.match(clientRemote, /dsh-voice-input#voiceInput\/cleanup/u)

console.log(`verified ${String(required.length)} required plugin artifacts`)
