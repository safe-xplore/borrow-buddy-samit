import { LOAN_COLUMNS, loanToRow, rowToLoan } from './loanMapper.js'

// อ่าน/เขียน Loan ผ่าน Supabase (ตาราง loans) ไม่มีการลบ
// รับ client เป็นพารามิเตอร์ เพื่อทดสอบด้วย client ปลอม
// เมื่อผิดพลาดจะโยน error ของ Supabase ต่อ ให้ผู้เรียกแปลงเป็นข้อความด้วย dataErrorMessage

const TABLE = 'loans'

const unwrap = ({ data, error }) => {
  if (error) throw error
  return data
}

export async function listLoans(client) {
  const rows = unwrap(await client.from(TABLE).select(LOAN_COLUMNS).order('due_date'))
  return (rows ?? []).map(rowToLoan)
}

export async function createLoan(client, loan) {
  const row = unwrap(
    await client.from(TABLE).insert(loanToRow(loan)).select(LOAN_COLUMNS).single(),
  )
  return rowToLoan(row)
}

// ใช้ตอนนำเข้าข้อมูลเดิม: insert ครั้งเดียว สำเร็จทั้งหมดหรือไม่สำเร็จเลย
export async function createLoans(client, loans) {
  if (loans.length === 0) return []
  const rows = unwrap(await client.from(TABLE).insert(loans.map(loanToRow)).select(LOAN_COLUMNS))
  return rows.map(rowToLoan)
}

export async function updateLoan(client, loan) {
  const row = unwrap(
    await client
      .from(TABLE)
      .update(loanToRow(loan))
      .eq('id', loan.id)
      .select(LOAN_COLUMNS)
      .single(),
  )
  return rowToLoan(row)
}
