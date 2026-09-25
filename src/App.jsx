import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import './App.css'
import AppHeader from './components/AppHeader.jsx'
import LegacyImportBanner from './components/LegacyImportBanner.jsx'
import LoanForm from './components/LoanForm.jsx'
import LoanList from './components/LoanList.jsx'
import LoginForm from './components/LoginForm.jsx'
import SearchBox from './components/SearchBox.jsx'
import { onSessionChange, signIn, signOut } from './lib/auth.js'
import { DATA_MESSAGES, dataErrorMessage, isSessionError } from './lib/authErrors.js'
import { toIsoDate } from './lib/dateFormat.js'
import { LEGACY_STATUS, markLegacyHandled, readLegacyLoans } from './lib/legacyStorage.js'
import { filterLoansByFriend, markReturned, unmarkReturned } from './lib/loanRules.js'
import { createLoan, createLoans, listLoans, updateLoan } from './lib/loanRepo.js'
import { CONFIG_ERROR, supabase } from './lib/supabaseClient.js'
import { getInitialTheme, saveTheme, toggleTheme } from './lib/theme.js'

function App() {
  // undefined = กำลังตรวจ session, null = ยังไม่เข้าสู่ระบบ
  const [session, setSession] = useState(undefined)
  const [notice, setNotice] = useState(null)
  const [theme, setTheme] = useState(() =>
    getInitialTheme(undefined, window.matchMedia('(prefers-color-scheme: dark)').matches),
  )

  // ตั้งธีมให้ <html> ก่อนวาดหน้าจอ เพื่อไม่ให้จอกะพริบ
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // ติดตาม session (ครั้งแรกตอนเปิดหน้า, เข้าสู่ระบบ, ออกจากระบบ, ต่ออายุ token)
  useEffect(() => {
    if (!supabase) return undefined
    return onSessionChange(supabase, (next) => setSession(next ?? null))
  }, [])

  const handleToggleTheme = () => {
    const next = toggleTheme(theme)
    setTheme(next)
    saveTheme(next)
  }

  const handleSignIn = async (email, password) => {
    setNotice(null)
    const { error } = await signIn(supabase, email, password)
    return error
  }

  // คงที่ตลอด เพื่อไม่ให้ LoansPage โหลดรายการใหม่ทุกครั้งที่ App วาดใหม่
  const handleSessionExpired = useCallback(() => {
    setNotice(DATA_MESSAGES.session)
    signOut(supabase)
  }, [])

  const header = (
    <AppHeader
      email={session?.user?.email}
      theme={theme}
      onToggleTheme={handleToggleTheme}
      onSignOut={session ? () => signOut(supabase) : null}
    />
  )

  if (CONFIG_ERROR) {
    return (
      <main>
        {header}
        <p role="alert">{CONFIG_ERROR}</p>
      </main>
    )
  }

  if (session === undefined) {
    return (
      <main>
        {header}
        <p role="status">กำลังโหลด…</p>
      </main>
    )
  }

  return (
    <main>
      {header}
      {session ? (
        // key ตามบัญชี: ออกจากระบบ/เปลี่ยนบัญชีแล้ว state ของ Loan ถูกล้างทั้งหมด
        <LoansPage key={session.user.id} onSessionExpired={handleSessionExpired} />
      ) : (
        <LoginForm onSignIn={handleSignIn} notice={notice} />
      )}
    </main>
  )
}

function LoansPage({ onSessionExpired }) {
  const [loans, setLoans] = useState([])
  const [loadState, setLoadState] = useState({ status: 'loading', error: null })
  const [reloadCount, setReloadCount] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')
  const [legacy, setLegacy] = useState(() => readLegacyLoans())
  const [importSummary, setImportSummary] = useState(null)

  useEffect(() => {
    let active = true
    listLoans(supabase)
      .then((loaded) => {
        if (!active) return
        setLoans(loaded)
        setLoadState({ status: 'ready', error: null })
      })
      .catch((error) => {
        if (!active) return
        if (isSessionError(error)) onSessionExpired()
        setLoadState({ status: 'error', error: dataErrorMessage(error) })
      })
    return () => {
      active = false
    }
  }, [reloadCount, onSessionExpired])

  const today = toIsoDate(new Date())
  const editingLoan = loans.find((loan) => loan.id === editingId) ?? null
  const visibleLoans = filterLoansByFriend(loans, query)

  // ส่งคำขอไปเซิร์ฟเวอร์ แล้วอัปเดตหน้าจอจากผลที่เซิร์ฟเวอร์ยืนยันเท่านั้น
  // คืน null เมื่อสำเร็จ หรือข้อความผิดพลาดภาษาไทย
  const persist = async (request, apply) => {
    try {
      apply(await request())
      return null
    } catch (error) {
      if (isSessionError(error)) onSessionExpired()
      return dataErrorMessage(error)
    }
  }

  const replaceLoan = (saved) =>
    setLoans((prev) => prev.map((l) => (l.id === saved.id ? saved : l)))

  // Loan ที่ยังไม่มี id คือเพิ่มใหม่ ถ้ามี id คือแก้ไขรายการเดิม
  const handleSave = (loan) =>
    loan.id
      ? persist(
          () => updateLoan(supabase, loan),
          (saved) => {
            replaceLoan(saved)
            setEditingId(null)
          },
        )
      : persist(
          () => createLoan(supabase, loan),
          (saved) => setLoans((prev) => [...prev, saved]),
        )

  const handleMarkReturned = (loan, returnedDate) =>
    persist(() => updateLoan(supabase, markReturned(loan, today, returnedDate)), replaceLoan)

  const handleUnmarkReturned = (loan) =>
    persist(() => updateLoan(supabase, unmarkReturned(loan)), replaceLoan)

  const handleImport = () =>
    persist(
      () => createLoans(supabase, legacy.valid),
      (created) => {
        setLoans((prev) => [...prev, ...created])
        const flagged = markLegacyHandled()
        setImportSummary(
          `นำเข้า ${created.length} รายการ ข้าม ${legacy.invalid.length} รายการ` +
            (flagged ? '' : ' (จำสถานะการนำเข้าในเครื่องนี้ไม่ได้ กรุณาอย่ากดนำเข้าซ้ำ)'),
        )
      },
    )

  const handleSkipImport = () => {
    markLegacyHandled()
    setLegacy({ ...legacy, status: LEGACY_STATUS.IMPORTED })
  }

  const handleRetry = () => {
    setLoadState({ status: 'loading', error: null })
    setReloadCount((n) => n + 1)
  }

  if (loadState.status === 'loading') return <p role="status">กำลังโหลด…</p>

  if (loadState.status === 'error') {
    return (
      <div className="notice" role="alert">
        <p>{loadState.error}</p>
        <div className="form-actions">
          <button type="button" onClick={handleRetry}>
            ลองใหม่
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <LegacyImportBanner
        legacy={legacy}
        summary={importSummary}
        onImport={handleImport}
        onSkip={handleSkipImport}
      />
      <LoanForm
        key={editingLoan?.id ?? 'new'}
        today={today}
        editingLoan={editingLoan}
        onSave={handleSave}
        onCancelEdit={() => setEditingId(null)}
      />
      <SearchBox value={query} onChange={setQuery} />
      <LoanList
        loans={visibleLoans}
        today={today}
        onMarkReturned={handleMarkReturned}
        onUnmarkReturned={handleUnmarkReturned}
        onEdit={(loan) => setEditingId(loan.id)}
      />
    </>
  )
}

export default App
