import test from 'node:test'
import assert from 'node:assert/strict'
import {
  appendTranscript,
  diffText,
  insertTranscript,
  replaceObservedInsertion,
} from '../lib/types/client/text.js'

test('inserts Chinese without artificial spaces and English with word spacing', () => {
  assert.equal(insertTranscript('你好世界', 2, 2, '，嗯'), '你好，嗯世界')
  assert.equal(appendTranscript('hello', 'world'), 'hello world')
  assert.equal(insertTranscript('say now', 4, 4, 'hello'), 'say hello now')
})

test('finds one minimal system-dictation edit', () => {
  assert.deepEqual(diffText('请提交。', '请明天提交。'), {
    start: 1,
    beforeEnd: 1,
    afterEnd: 3,
    removed: '',
    inserted: '明天',
  })
  assert.equal(diffText('same', 'same'), null)
})

test('replaces only the observed transcript and preserves concurrent edits', () => {
  const observed = '开头嗯那个请提交结尾'
  const change = diffText('开头结尾', observed)
  assert.ok(change)
  assert.deepEqual(replaceObservedInsertion(observed, observed, change, '请提交。'), {
    text: '开头请提交。结尾',
    replaced: true,
  })
  assert.deepEqual(replaceObservedInsertion('开头用户改了结尾', observed, change, '请提交。'), {
    text: '开头用户改了结尾',
    replaced: false,
  })
})
