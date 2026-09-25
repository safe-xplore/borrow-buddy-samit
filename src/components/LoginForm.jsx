import { useState } from 'react'

// ฟอร์มเข้าสู่ระบบด้วย email + รหัสผ่าน ไม่มีลิงก์สมัครสมาชิก
// onSignIn(email, password) คืนข้อความผิดพลาดภาษาไทย หรือ null เมื่อสำเร็จ
export default function LoginForm({ onSignIn, notice }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน')
      return
    }
    setBusy(true)
    setError(null)
    const message = await onSignIn(email, password)
    // สำเร็จแล้วหน้านี้จะถูกเปลี่ยนเป็นหน้าหลักเอง
    if (message) {
      setError(message)
      setBusy(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <h2>เข้าสู่ระบบ</h2>
      {notice && !error && <p className="notice">{notice}</p>}

      <label>
        อีเมล
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label>
        รหัสผ่าน
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {error && (
        <ul role="alert">
          <li>{error}</li>
        </ul>
      )}

      <div className="form-actions">
        <button type="submit" disabled={busy}>
          {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
        </button>
      </div>
    </form>
  )
}
