import { describe, expect, it } from 'vitest'
import { LOAN_COLUMNS, loanToRow, rowToLoan } from './loanMapper.js'

const row = {
  id: 'a1b2',
  friend_name: 'ต้น',
  item_name: 'ร่มสีฟ้า',
  borrowed_date: '2026-09-01',
  due_date: '2026-09-24',
  returned_date: null,
}

const loan = {
  id: 'a1b2',
  friendName: 'ต้น',
  itemName: 'ร่มสีฟ้า',
  borrowedDate: '2026-09-01',
  dueDate: '2026-09-24',
  returnedDate: null,
}

describe('rowToLoan', () => {
  it('แปลงแถวเป็น Loan ครบทุกฟิลด์', () => {
    expect(rowToLoan(row)).toEqual(loan)
  })

  it('ไม่ส่งคอลัมน์อื่น (owner_id, created_at) เข้า Loan', () => {
    const extra = { ...row, owner_id: 'u1', created_at: 'x', updated_at: 'y' }
    expect(rowToLoan(extra)).toEqual(loan)
  })

  it('วันที่คืนจริงที่มีค่าแปลงได้', () => {
    expect(rowToLoan({ ...row, returned_date: '2026-09-20' }).returnedDate).toBe('2026-09-20')
  })

  it('returned_date ที่ไม่มี (undefined) เป็น null', () => {
    const { returned_date: _omit, ...rest } = row
    expect(rowToLoan(rest).returnedDate).toBeNull()
  })
})

describe('loanToRow', () => {
  it('แปลง Loan เป็นแถวโดยไม่ส่ง id และ owner_id', () => {
    expect(loanToRow(loan)).toEqual({
      friend_name: 'ต้น',
      item_name: 'ร่มสีฟ้า',
      borrowed_date: '2026-09-01',
      due_date: '2026-09-24',
      returned_date: null,
    })
  })

  it('Loan ที่ไม่มี returnedDate ส่งเป็น null', () => {
    const { returnedDate: _omit, ...rest } = loan
    expect(loanToRow(rest).returned_date).toBeNull()
  })

  it('แปลงไป-กลับได้เหมือนเดิม', () => {
    expect(rowToLoan({ id: loan.id, ...loanToRow(loan) })).toEqual(loan)
  })
})

describe('LOAN_COLUMNS', () => {
  it('ขอเฉพาะคอลัมน์ที่ใช้ ไม่มี owner_id', () => {
    expect(LOAN_COLUMNS).toBe('id,friend_name,item_name,borrowed_date,due_date,returned_date')
  })
})
