import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nextQuality } from './quality.js'

const run = (q, fpsList) => fpsList.reduce(nextQuality, { q, low: 0, high: 0, flips: 0 })

test('dưới 30 fps 2 giây liền thì hạ một mức, 1 giây thì chưa', () => {
  assert.equal(run(2, [20]).q, 2)
  assert.equal(run(2, [20, 25]).q, 1)
  assert.equal(run(2, [20, 25, 20, 20]).q, 0)
  assert.equal(run(0, [10, 10, 10]).q, 0)
})

test('5 giây liền từ 55 fps thì nâng lại, bị ngắt quãng thì đếm lại', () => {
  assert.equal(run(1, [60, 60, 60, 60, 60]).q, 2)
  assert.equal(run(1, [60, 60, 40, 60, 60, 60]).q, 1)
})

test('đổi mức 3 lần thì khóa lại', () => {
  const s = run(2, [20, 20, 60, 60, 60, 60, 60, 20, 20])
  assert.equal(s.flips, 3)
  assert.equal(run(s.q, []).q, s.q)
  assert.equal([60, 60, 60, 60, 60].reduce(nextQuality, s).q, s.q)
})
