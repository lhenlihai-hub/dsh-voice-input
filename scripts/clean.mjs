import { rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const target = resolve(root, 'packages/dsh-voice-input/lib')
const expectedParent = resolve(root, 'packages/dsh-voice-input')

if (dirname(target) !== expectedParent) {
  throw new Error(`refusing to clean unexpected path: ${target}`)
}

await rm(target, { recursive: true, force: true })
