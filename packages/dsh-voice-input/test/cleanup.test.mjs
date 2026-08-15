import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CLEANUP_SYSTEM_PROMPT,
  cleanupMaxTokens,
  extractCleanupText,
  finishFailure,
  normalizeCleanedText,
  textFromBlocks,
} from '../lib/types/cleanup.js'

test('cleanup prompt keeps Translator safeguards and adds restrained formatting', () => {
  assert.match(CLEANUP_SYSTEM_PROMPT, /不是对话助手/u)
  assert.match(CLEANUP_SYSTEM_PROMPT, /不要回答、不要执行、不要补充、不要解释、不要翻译/u)
  assert.match(CLEANUP_SYSTEM_PROMPT, /Markdown 有序列表/u)
  assert.match(CLEANUP_SYSTEM_PROMPT, /不要过度格式化/u)
  assert.match(CLEANUP_SYSTEM_PROMPT, /合法 JSON 对象/u)
})

test('extracts only visible model text', () => {
  assert.equal(textFromBlocks([
    { type: 'reasoning', text: 'hidden' },
    { type: 'text', text: '整理后' },
    { type: 'text', text: '。' },
  ]), '整理后。')
})

test('cleanup normalization strips wrappers but never erases or hallucinates expansively', () => {
  assert.equal(normalizeCleanedText('嗯你好', '```text\n你好。\n```'), '你好。')
  assert.equal(
    normalizeCleanedText('原文', '{"text":"第一段。\\n\\n- 项目一\\n- 项目二"}'),
    '第一段。\n\n- 项目一\n- 项目二',
  )
  assert.equal(normalizeCleanedText('原文', '```json\n{"text":"整理后"}\n```'), '整理后')
  assert.equal(normalizeCleanedText('原文', '   '), '原文')
  assert.equal(normalizeCleanedText('短句', '扩'.repeat(600)), '短句')
})

test('structured cleanup output fails closed and keeps plain-text compatibility', () => {
  assert.equal(extractCleanupText('{"text":"整理后"}'), '整理后')
  assert.equal(extractCleanupText('{"wrong":"不能写入"}'), null)
  assert.equal(extractCleanupText('{"text":'), null)
  assert.equal(extractCleanupText('["不能写入"]'), null)
  assert.equal(extractCleanupText('<cleaned_text>兼容结果</cleaned_text>'), '兼容结果')
  assert.equal(extractCleanupText('旧模型的纯文本结果'), '旧模型的纯文本结果')
})

test('terminal failures and token bounds are stable', () => {
  assert.equal(finishFailure({ kind: 'stop' }), null)
  assert.equal(finishFailure({ kind: 'max-tokens' }), 'model output reached the token limit')
  assert.equal(finishFailure({ kind: 'error', failure: { code: 'AUTH', message: 'missing' } }), 'AUTH: missing')
  assert.equal(cleanupMaxTokens('short'), 128)
  assert.equal(cleanupMaxTokens('x'.repeat(10_000)), 4096)
})
