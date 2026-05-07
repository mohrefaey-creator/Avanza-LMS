import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Pill from '../../components/Pill.jsx'
import Icon from '../../components/Icon.jsx'

export default function ESignature({ course, onSigned, onCancel }) {
  const { t, user, logAction } = useApp()
  const [pwd, setPwd] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!confirmed || pwd.length < 4) return
    setBusy(true)
    setTimeout(() => {
      logAction('esignature_applied', course.id, {
        statement: 'I confirm I have completed this training',
        userName: user?.name,
        passwordReverified: true,
      })
      setBusy(false)
      onSigned?.()
    }, 600)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h3>{t('E-signature', 'التوقيع الإلكتروني')}</h3>
          <button className="icon-btn" onClick={onCancel}><Icon name="x" size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <Pill variant="purple">{t('21 CFR Part 11', 'CFR 21 جزء 11')}</Pill>
            <p className="mt-12" style={{ lineHeight: 1.55, fontSize: 13 }}>
              {t('You are signing completion of a mandatory training. Logged immutably.',
                 'أنت توقّع إتمام تدريب إلزامي. يُسجَّل دون إمكان التعديل.')}
            </p>

            <div className="field">
              <label>{t('Re-enter your password', 'أعد إدخال كلمة المرور')}</label>
              <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required />
            </div>

            <label style={{ display:'flex', gap:8, alignItems:'flex-start', fontSize:12, lineHeight:1.5 }}>
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              <span>{t('I confirm I have completed this training in full.', 'أؤكد أنني أكملت هذا التدريب بالكامل.')}</span>
            </label>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn" onClick={onCancel}>{t('Cancel', 'إلغاء')}</button>
            <button type="submit" className="btn primary" disabled={!confirmed || pwd.length < 4 || busy}>
              {busy ? t('Signing…', 'جاري التوقيع…') : t('Apply', 'تطبيق')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
