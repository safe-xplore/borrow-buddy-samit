import ThemeToggle from './ThemeToggle.jsx'

// แถบบน: ชื่อแอป, email ของบัญชีเจ้าของ (ถ้าเข้าสู่ระบบแล้ว), ปุ่มโหมดมืด, ปุ่มออกจากระบบ
export default function AppHeader({ email, theme, onToggleTheme, onSignOut }) {
  return (
    <header className="app-header">
      <h1>Borrow Buddy</h1>
      <div className="header-actions">
        {email && <span className="account-email">{email}</span>}
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        {onSignOut && (
          <button type="button" onClick={onSignOut}>
            ออกจากระบบ
          </button>
        )}
      </div>
    </header>
  )
}
