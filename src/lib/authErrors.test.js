import { describe, expect, it } from 'vitest'
import {
  AUTH_MESSAGES,
  DATA_MESSAGES,
  authErrorMessage,
  dataErrorMessage,
  isSessionError,
} from './authErrors.js'

describe('authErrorMessage', () => {
  it('email หรือรหัสผ่านผิด ใช้ข้อความเดียวกัน ไม่บอกว่าอันไหนผิด', () => {
    const msg = authErrorMessage({ code: 'invalid_credentials', status: 400 })
    expect(msg).toBe(AUTH_MESSAGES.invalidCredentials)
    expect(msg).toBe('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
  })

  it('ไม่มี code แต่ status 400 ก็ถือเป็นข้อมูลเข้าสู่ระบบไม่ถูกต้อง', () => {
    expect(authErrorMessage({ status: 400, message: 'Invalid login credentials' })).toBe(
      AUTH_MESSAGES.invalidCredentials,
    )
  })

  it('บัญชียังไม่ยืนยันอีเมล', () => {
    expect(authErrorMessage({ code: 'email_not_confirmed' })).toBe(AUTH_MESSAGES.notConfirmed)
  })

  it('พยายามบ่อยเกินไป', () => {
    expect(authErrorMessage({ code: 'over_request_rate_limit', status: 429 })).toBe(
      AUTH_MESSAGES.rateLimited,
    )
    expect(authErrorMessage({ status: 429 })).toBe(AUTH_MESSAGES.rateLimited)
  })

  it('เชื่อมต่อไม่ได้', () => {
    expect(authErrorMessage({ name: 'AuthRetryableFetchError', status: 0 })).toBe(
      AUTH_MESSAGES.network,
    )
  })

  it('ข้อผิดพลาดที่ไม่รู้จัก = ข้อความทั่วไป', () => {
    expect(authErrorMessage({ code: 'something_new', status: 500 })).toBe(AUTH_MESSAGES.unknown)
    expect(authErrorMessage(null)).toBe(AUTH_MESSAGES.unknown)
  })
})

describe('isSessionError', () => {
  it('JWT หมดอายุหรือไม่มีสิทธิ์ = session ใช้ไม่ได้', () => {
    expect(isSessionError({ code: 'PGRST301' })).toBe(true)
    expect(isSessionError({ code: 'PGRST303' })).toBe(true)
    expect(isSessionError({ status: 401 })).toBe(true)
  })

  it('ข้อผิดพลาดอื่นไม่ใช่เรื่อง session', () => {
    expect(isSessionError({ code: '23514' })).toBe(false)
    expect(isSessionError(null)).toBe(false)
  })
})

describe('dataErrorMessage', () => {
  it('session หมดอายุ', () => {
    expect(dataErrorMessage({ code: 'PGRST301' })).toBe(DATA_MESSAGES.session)
  })

  it('ละเมิดกติกาในฐานข้อมูล (check constraint)', () => {
    expect(dataErrorMessage({ code: '23514' })).toBe(DATA_MESSAGES.invalid)
  })

  it('ไม่มีสิทธิ์ (RLS) หรือไม่พบรายการ', () => {
    expect(dataErrorMessage({ code: '42501' })).toBe(DATA_MESSAGES.forbidden)
    expect(dataErrorMessage({ code: 'PGRST116' })).toBe(DATA_MESSAGES.forbidden)
  })

  it('เชื่อมต่อไม่ได้', () => {
    expect(dataErrorMessage({ message: 'TypeError: Failed to fetch', code: '' })).toBe(
      DATA_MESSAGES.network,
    )
    expect(dataErrorMessage(new TypeError('Failed to fetch'))).toBe(DATA_MESSAGES.network)
    expect(dataErrorMessage({ message: 'TypeError: fetch failed', code: '' })).toBe(
      DATA_MESSAGES.network,
    )
    expect(dataErrorMessage({ message: 'NetworkError when attempting to fetch resource.' })).toBe(
      DATA_MESSAGES.network,
    )
    expect(dataErrorMessage({ message: 'Load failed' })).toBe(DATA_MESSAGES.network)
  })

  it('ไม่รู้จัก = ข้อความทั่วไป', () => {
    expect(dataErrorMessage({ code: 'XX000' })).toBe(DATA_MESSAGES.unknown)
  })
})
