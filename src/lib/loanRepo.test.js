import { describe, expect, it } from 'vitest'
import * as loanRepo from './loanRepo.js'
import { createLoan, createLoans, listLoans, updateLoan } from './loanRepo.js'
import { LOAN_COLUMNS } from './loanMapper.js'

// client ปลอม: บันทึกทุกการเรียกเป็นลำดับ และคืนผลที่กำหนดเมื่อ await
function fakeClient(result) {
  const calls = []
  const builder = {
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  for (const method of ['select', 'insert', 'update', 'eq', 'order', 'single']) {
    builder[method] = (...args) => {
      calls.push([method, ...args])
      return builder
    }
  }
  return {
    calls,
    from: (table) => {
      calls.push(['from', table])
      return builder
    },
  }
}

const row = {
  id: 'a1',
  friend_name: 'ต้น',
  item_name: 'ร่ม',
  borrowed_date: '2026-09-01',
  due_date: '2026-09-24',
  returned_date: null,
}

const loan = {
  id: 'a1',
  friendName: 'ต้น',
  itemName: 'ร่ม',
  borrowedDate: '2026-09-01',
  dueDate: '2026-09-24',
  returnedDate: null,
}

const { id: _id, ...newLoan } = loan
const rowWithoutId = {
  friend_name: 'ต้น',
  item_name: 'ร่ม',
  borrowed_date: '2026-09-01',
  due_date: '2026-09-24',
  returned_date: null,
}

describe('listLoans', () => {
  it('อ่านจากตาราง loans เฉพาะคอลัมน์ที่ใช้ แล้วแปลงเป็น Loan', async () => {
    const client = fakeClient({ data: [row], error: null })
    expect(await listLoans(client)).toEqual([loan])
    expect(client.calls).toEqual([
      ['from', 'loans'],
      ['select', LOAN_COLUMNS],
      ['order', 'due_date'],
    ])
  })

  it('ข้อมูลว่าง (null) = รายการว่าง', async () => {
    expect(await listLoans(fakeClient({ data: null, error: null }))).toEqual([])
  })

  it('ส่งต่อข้อผิดพลาดจาก Supabase', async () => {
    const error = { code: 'PGRST301', message: 'JWT expired' }
    await expect(listLoans(fakeClient({ data: null, error }))).rejects.toBe(error)
  })
})

describe('createLoan', () => {
  it('insert โดยไม่ส่ง id/owner_id และคืน Loan จากแถวที่เซิร์ฟเวอร์ส่งกลับ', async () => {
    const client = fakeClient({ data: row, error: null })
    expect(await createLoan(client, newLoan)).toEqual(loan)
    expect(client.calls).toEqual([
      ['from', 'loans'],
      ['insert', rowWithoutId],
      ['select', LOAN_COLUMNS],
      ['single'],
    ])
  })

  it('ส่งต่อข้อผิดพลาด', async () => {
    const error = { code: '23514' }
    await expect(createLoan(fakeClient({ data: null, error }), newLoan)).rejects.toBe(error)
  })
})

describe('createLoans', () => {
  it('insert หลายรายการในครั้งเดียว ไม่ส่ง id เดิม', async () => {
    const client = fakeClient({ data: [row, { ...row, id: 'a2' }], error: null })
    const result = await createLoans(client, [loan, { ...loan, id: 'old-2' }])
    expect(result.map((l) => l.id)).toEqual(['a1', 'a2'])
    expect(client.calls[1]).toEqual(['insert', [rowWithoutId, rowWithoutId]])
  })

  it('รายการว่างไม่เรียกเซิร์ฟเวอร์', async () => {
    const client = fakeClient({ data: [], error: null })
    expect(await createLoans(client, [])).toEqual([])
    expect(client.calls).toEqual([])
  })
})

describe('updateLoan', () => {
  it('update เฉพาะแถวที่ id ตรงกัน ไม่ส่ง id ในข้อมูลที่แก้', async () => {
    const returned = { ...row, returned_date: '2026-09-20' }
    const client = fakeClient({ data: returned, error: null })
    const result = await updateLoan(client, { ...loan, returnedDate: '2026-09-20' })
    expect(result.returnedDate).toBe('2026-09-20')
    expect(client.calls).toEqual([
      ['from', 'loans'],
      ['update', { ...rowWithoutId, returned_date: '2026-09-20' }],
      ['eq', 'id', 'a1'],
      ['select', LOAN_COLUMNS],
      ['single'],
    ])
  })

  it('ส่งต่อข้อผิดพลาด (เช่น ไม่พบแถวเพราะ RLS)', async () => {
    const error = { code: 'PGRST116' }
    await expect(updateLoan(fakeClient({ data: null, error }), loan)).rejects.toBe(error)
  })
})

describe('ไม่มีการลบ Loan', () => {
  it('ไม่มีฟังก์ชันลบใน loanRepo', () => {
    expect(Object.keys(loanRepo).sort()).toEqual([
      'createLoan',
      'createLoans',
      'listLoans',
      'updateLoan',
    ])
  })
})
