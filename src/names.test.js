import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findPerson } from './names.js'

test('chấp nhận 4 tên, bỏ qua hoa/thường, dấu và khoảng trắng thừa', () => {
  assert.equal(findPerson('Anh Thư'), 'Anh Thư')
  assert.equal(findPerson('  anh   thu '), 'Anh Thư')
  assert.equal(findPerson('NHƯ Ý'), 'Như Ý')
  assert.equal(findPerson('phuong trang'), 'Phương Trang')
  assert.equal(findPerson('Tú'), 'Tú')
})

test('từ chối tên thiếu hoặc tên khác', () => {
  for (const s of ['', 'Anh', 'Thư', 'Trang', 'Tu Anh', 'Lan']) assert.equal(findPerson(s), null)
})
