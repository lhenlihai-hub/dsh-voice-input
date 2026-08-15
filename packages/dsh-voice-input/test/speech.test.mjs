import test from 'node:test'
import assert from 'node:assert/strict'
import { collectRecognitionText } from '../lib/types/client/speech.js'

test('recomputes final and interim recognition text without duplication', () => {
  const result = collectRecognitionText([
    Object.assign([{ transcript: '你好' }], { isFinal: true }),
    Object.assign([{ transcript: '世界' }], { isFinal: false }),
  ])
  assert.deepEqual(result, { finalText: '你好', interimText: '世界' })
})
