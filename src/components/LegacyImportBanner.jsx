import { useState } from 'react'
import { BROKEN_MESSAGE, LEGACY_STATUS } from '../lib/legacyStorage.js'

// แถบนำเข้าข้อมูลเดิมจาก localStorage (ครั้งเดียว)
// legacy = ผลจาก readLegacyLoans, onImport() คืนข้อความผิดพลาดหรือ null, onSkip() ไม่นำเข้า
export default function LegacyImportBanner({ legacy, summary, onImport, onSkip }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (summary) {
    return (
      <p className="notice" role="status">
        {summary}
      </p>
    )
  }
  if (legacy.status === LEGACY_STATUS.BROKEN) {
    return (
      <p className="notice" role="alert">
        {BROKEN_MESSAGE}
      </p>
    )
  }
  if (legacy.status !== LEGACY_STATUS.PENDING) return null

  const total = legacy.valid.length + legacy.invalid.length

  const handleImport = async () => {
    setBusy(true)
    setError(null)
    const message = await onImport()
    if (message) setError(message)
    setBusy(false)
  }

  return (
    <div className="notice legacy-banner" role="region" aria-label="การนำเข้าข้อมูลเดิม">
      <p>
        พบข้อมูลเดิม {total} รายการในเครื่องนี้
        {legacy.invalid.length > 0 && ` (ข้อมูลไม่ถูกต้อง ${legacy.invalid.length} รายการจะถูกข้าม)`}
      </p>
      {error && (
        <ul role="alert">
          <li>{error}</li>
        </ul>
      )}
      <div className="form-actions">
        <button type="button" className="primary" onClick={handleImport} disabled={busy}>
          {busy ? 'กำลังนำเข้า…' : 'นำเข้า'}
        </button>
        <button type="button" onClick={onSkip} disabled={busy}>
          ไม่นำเข้า
        </button>
      </div>
    </div>
  )
}
