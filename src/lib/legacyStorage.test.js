import { describe, expect, it } from 'vitest'
import {
  IMPORTED_FLAG_KEY,
  LEGACY_KEY,
  LEGACY_STATUS,
  markLegacyHandled,
  readLegacyLoans,
} from './legacyStorage.js'

const memoryStorage = (initial = {}) => {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value)
    },
  }
}

const brokenStorage = () => ({
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('quota')
  },
})

const good = {
  id: 'old-1',
  friendName: 'ต้น',
  itemName: 'ร่ม',
  borrowedDate: '2026-09-01',
  dueDate: '2026-09-24',
  returnedDate: null,
}
const bad = { ...good, id: 'old-2', friendName: '  ' }

describe('readLegacyLoans', () => {
  it('ไม่มีข้อมูลเดิม = none', () => {
    expect(readLegacyLoans(memoryStorage())).toEqual({
      status: LEGACY_STATUS.NONE,
      valid: [],
      invalid: [],
    })
  })

  it('อาร์เรย์ว่าง = none', () => {
    const storage = memoryStorage({ [LEGACY_KEY]: '[]' })
    expect(readLegacyLoans(storage).status).toBe(LEGACY_STATUS.NONE)
  })

  it('มีธงนำเข้าแล้ว = imported แม้ยังมีข้อมูลเดิม', () => {
    const storage = memoryStorage({
      [LEGACY_KEY]: JSON.stringify([good]),
      [IMPORTED_FLAG_KEY]: '1',
    })
    expect(readLegacyLoans(storage).status).toBe(LEGACY_STATUS.IMPORTED)
  })

  it('JSON เสีย = broken และไม่เขียนทับข้อมูลเดิม', () => {
    const storage = memoryStorage({ [LEGACY_KEY]: '{เสีย' })
    expect(readLegacyLoans(storage).status).toBe(LEGACY_STATUS.BROKEN)
    expect(storage.data[LEGACY_KEY]).toBe('{เสีย')
    expect(storage.data[IMPORTED_FLAG_KEY]).toBeUndefined()
  })

  it('JSON ไม่ใช่อาร์เรย์ = broken', () => {
    const storage = memoryStorage({ [LEGACY_KEY]: '{"a":1}' })
    expect(readLegacyLoans(storage).status).toBe(LEGACY_STATUS.BROKEN)
  })

  it('อ่าน storage ไม่ได้ = broken', () => {
    expect(readLegacyLoans(brokenStorage()).status).toBe(LEGACY_STATUS.BROKEN)
  })

  it('แยกรายการถูก/ผิดด้วยกติกาเดียวกับ loanRules', () => {
    const notObject = 'ข้อความ'
    const storage = memoryStorage({ [LEGACY_KEY]: JSON.stringify([good, bad, notObject, null]) })
    const result = readLegacyLoans(storage)
    expect(result.status).toBe(LEGACY_STATUS.PENDING)
    expect(result.valid).toEqual([good])
    expect(result.invalid).toHaveLength(3)
  })

  it('returnedDate ก่อนวันที่ยืม = ผิด', () => {
    const early = { ...good, returnedDate: '2026-08-01' }
    const storage = memoryStorage({ [LEGACY_KEY]: JSON.stringify([early]) })
    expect(readLegacyLoans(storage).invalid).toEqual([early])
  })

  it('อ่านอย่างเดียว ไม่เขียนอะไรกลับ', () => {
    const storage = memoryStorage({ [LEGACY_KEY]: JSON.stringify([good]) })
    readLegacyLoans(storage)
    expect(Object.keys(storage.data)).toEqual([LEGACY_KEY])
  })
})

describe('markLegacyHandled', () => {
  it('ตั้งธงนำเข้าแล้ว โดยไม่ลบข้อมูลเดิม', () => {
    const raw = JSON.stringify([good])
    const storage = memoryStorage({ [LEGACY_KEY]: raw })
    expect(markLegacyHandled(storage)).toBe(true)
    expect(storage.data[LEGACY_KEY]).toBe(raw)
    expect(readLegacyLoans(storage).status).toBe(LEGACY_STATUS.IMPORTED)
  })

  it('เขียนไม่ได้ = false ไม่โยนข้อผิดพลาด', () => {
    expect(markLegacyHandled(brokenStorage())).toBe(false)
  })
})
