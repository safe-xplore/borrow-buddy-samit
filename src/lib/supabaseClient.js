import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// ถ้าไม่ได้ตั้งค่า ให้ App แสดงข้อความนี้แทนการพังทั้งหน้า
export const CONFIG_ERROR =
  url && key
    ? null
    : 'ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase กรุณาใส่ VITE_SUPABASE_URL และ VITE_SUPABASE_PUBLISHABLE_KEY ใน .env.local'

// สร้างครั้งเดียวทั้งแอป ใช้เฉพาะ publishable key (ห้ามใช้ service role key ฝั่งเว็บ)
export const supabase = CONFIG_ERROR ? null : createClient(url, key)
