import { authErrorMessage } from './authErrors.js'

// ทุกฟังก์ชันรับ client เป็นพารามิเตอร์ เพื่อใช้ client ปลอมตอนทดสอบได้

// คืน { session, error } โดย error เป็นข้อความภาษาไทยหรือ null
export async function signIn(client, email, password) {
  try {
    const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return { session: null, error: authErrorMessage(error) }
    return { session: data.session, error: null }
  } catch (error) {
    return { session: null, error: authErrorMessage(error) }
  }
}

// ออกจากระบบเฉพาะเครื่องนี้ ถ้าเซิร์ฟเวอร์ตอบผิดพลาด supabase-js ยังล้าง session ในเครื่องให้
export async function signOut(client) {
  try {
    await client.auth.signOut({ scope: 'local' })
  } catch {
    // ไม่ต้องทำอะไร หน้าจอจะกลับไปหน้าเข้าสู่ระบบจาก onSessionChange อยู่แล้ว
  }
}

// เรียก callback(session) ทุกครั้งที่ session เปลี่ยน (รวมครั้งแรกตอนเปิดหน้า) คืนฟังก์ชันยกเลิก
export function onSessionChange(client, callback) {
  const { data } = client.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}
