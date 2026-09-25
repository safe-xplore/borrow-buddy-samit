import { validateLoan } from './loanRules.js'

// ข้อมูล Loan จากเวอร์ชัน 1 ที่เก็บใน localStorage ใช้สำหรับการนำเข้าข้อมูลเดิมครั้งเดียว
// ห้ามลบหรือเขียนทับคีย์เดิม เก็บไว้เป็นสำรอง
export const LEGACY_KEY = 'borrow-buddy:loans'
export const IMPORTED_FLAG_KEY = 'borrow-buddy:legacy-imported'

export const LEGACY_STATUS = {
  NONE: 'none', // ไม่มีข้อมูลเดิม
  IMPORTED: 'imported', // จัดการแล้ว (นำเข้าหรือกดไม่นำเข้า)
  BROKEN: 'broken', // อ่านไม่ได้หรือ JSON เสีย
  PENDING: 'pending', // มีข้อมูลรอนำเข้า
}

export const BROKEN_MESSAGE =
  'พบข้อมูลเดิมในเครื่องนี้แต่อ่านไม่ได้ จึงนำเข้าไม่ได้ ข้อมูลเดิมยังไม่ถูกลบ'

const result = (status, valid = [], invalid = []) => ({ status, valid, invalid })

const isValidLoan = (item) =>
  item !== null && typeof item === 'object' && validateLoan(item).length === 0

// อ่านอย่างเดียว storage รับเป็นพารามิเตอร์เพื่อทดสอบได้
export function readLegacyLoans(storage = globalThis.localStorage) {
  let data
  try {
    if (storage.getItem(IMPORTED_FLAG_KEY)) return result(LEGACY_STATUS.IMPORTED)
    const raw = storage.getItem(LEGACY_KEY)
    if (raw === null) return result(LEGACY_STATUS.NONE)
    data = JSON.parse(raw)
  } catch {
    return result(LEGACY_STATUS.BROKEN)
  }
  if (!Array.isArray(data)) return result(LEGACY_STATUS.BROKEN)
  if (data.length === 0) return result(LEGACY_STATUS.NONE)

  const valid = data.filter(isValidLoan)
  const invalid = data.filter((item) => !isValidLoan(item))
  return result(LEGACY_STATUS.PENDING, valid, invalid)
}

// ตั้งธงว่าจัดการข้อมูลเดิมแล้ว คืน true เมื่อสำเร็จ
export function markLegacyHandled(storage = globalThis.localStorage) {
  try {
    storage.setItem(IMPORTED_FLAG_KEY, '1')
    return true
  } catch {
    return false
  }
}
