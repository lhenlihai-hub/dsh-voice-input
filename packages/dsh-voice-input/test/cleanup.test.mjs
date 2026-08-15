import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanupMaxTokens,
  finishFailure,
  normalizeCleanedText,
  textFromBlocks,
} from '../lib/types/cleanup.js'

test('extracts only visible model text', () => {
  assert.equal(textFromBlocks([
    { type: 'reasoning', text: 'hidden' },
    { type: 'text', text: '整理后' },
    { type: 'text', text: '。' },
  ]), '整理后。')
})

test('cleanup normalization strips wrappers but never erases or hallucinates expansively', () => {
  assert.equal(normalizeCleanedText('嗯你好', '```text\n你好。\n```'), '你好。')
  assert.equal(normalizeCleanedText('原文', '   '), '原文')
  assert.equal(normalizeCleanedText('短句', '扩'.repeat(600)), '短句')
})

test('terminal failures and token bounds are stable', () => {
  assert.equal(finishFailure({ kind: 'stop' }), null)
  assert.equal(finishFailure({ kind: 'max-tokens' }), 'model output reached the token limit')
  assert.equal(finishFailure({ kind: 'error', failure: { code: 'AUTH', message: 'missing' } }), 'AUTH: missing')
  assert.equal(cleanupMaxTokens('short'), 128)
  assert.equal(cleanupMaxTokens('x'.repeat(10_000)), 4096)
})
