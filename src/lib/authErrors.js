// แปลงข้อผิดพลาดจาก Supabase เป็นข้อความภาษาไทย (ฟังก์ชันล้วน ไม่เรียก Supabase)

export const AUTH_MESSAGES = {
  invalidCredentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  notConfirmed: 'บัญชีนี้ยังไม่ได้ยืนยันอีเมล กรุณาติดต่อผู้ดูแล',
  rateLimited: 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่',
  network: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต',
  unknown: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่',
}

export const DATA_MESSAGES = {
  session: 'การเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่',
  invalid: 'ข้อมูลไม่ถูกต้องตามกติกา จึงบันทึกไม่ได้',
  forbidden: 'ไม่พบรายการนี้ หรือไม่มีสิทธิ์แก้ไข',
  network: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่',
  unknown: 'บันทึกหรือโหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่',
}

const isNetworkError = (error) =>
  error.name === 'AuthRetryableFetchError' ||
  error.status === 0 ||
  /failed to fetch|network|load failed/i.test(error.message ?? '')

// ไม่แยกข้อความระหว่าง email ผิดกับรหัสผ่านผิด
export function authErrorMessage(error) {
  if (!error) return AUTH_MESSAGES.unknown
  if (error.code === 'invalid_credentials') return AUTH_MESSAGES.invalidCredentials
  if (error.code === 'email_not_confirmed') return AUTH_MESSAGES.notConfirmed
  if (error.code === 'over_request_rate_limit' || error.status === 429) {
    return AUTH_MESSAGES.rateLimited
  }
  if (isNetworkError(error)) return AUTH_MESSAGES.network
  if (error.status === 400) return AUTH_MESSAGES.invalidCredentials
  return AUTH_MESSAGES.unknown
}

// PGRST301/303 = JWT ใช้ไม่ได้หรือหมดอายุ
export function isSessionError(error) {
  if (!error) return false
  return error.code === 'PGRST301' || error.code === 'PGRST303' || error.status === 401
}

export function dataErrorMessage(error) {
  if (!error) return DATA_MESSAGES.unknown
  if (isSessionError(error)) return DATA_MESSAGES.session
  if (error.code === '23514') return DATA_MESSAGES.invalid
  if (error.code === '42501' || error.code === 'PGRST116') return DATA_MESSAGES.forbidden
  if (isNetworkError(error)) return DATA_MESSAGES.network
  return DATA_MESSAGES.unknown
}
