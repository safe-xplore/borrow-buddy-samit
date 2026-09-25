// แปลง Loan (camelCase ในแอป) ↔ แถวตาราง loans (snake_case) ที่เดียว
// UI และ loanRules.js ไม่ต้องรู้จักชื่อคอลัมน์

// คอลัมน์ที่อ่านกลับมา (ไม่ต้องใช้ owner_id ในหน้าเว็บ)
export const LOAN_COLUMNS = 'id,friend_name,item_name,borrowed_date,due_date,returned_date'

export function rowToLoan(row) {
  return {
    id: row.id,
    friendName: row.friend_name,
    itemName: row.item_name,
    borrowedDate: row.borrowed_date,
    dueDate: row.due_date,
    returnedDate: row.returned_date ?? null,
  }
}

// ใช้ทั้ง insert และ update: ไม่ส่ง id (ฐานข้อมูลสร้างให้) และ owner_id (default auth.uid())
export function loanToRow(loan) {
  return {
    friend_name: loan.friendName,
    item_name: loan.itemName,
    borrowed_date: loan.borrowedDate,
    due_date: loan.dueDate,
    returned_date: loan.returnedDate ?? null,
  }
}
