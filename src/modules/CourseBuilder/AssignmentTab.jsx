import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Pill from '../../components/Pill.jsx'
import Icon from '../../components/Icon.jsx'

export default function AssignmentTab({ draft }) {
  const { t, users, logAction } = useApp()
  const [roles, setRoles] = useState(['rep-oncology'])
  const [deadline, setDeadline] = useState(30)
  const [trigger, setTrigger] = useState('manual')

  const targets = users.filter((u) => u.therapyArea === draft.therapyArea && (u.role === 'learner' || u.role === 'manager'))

  const handleAssign = () => {
    logAction('course_assigned', `${targets.length}-users`, { courseTitle: draft.title, deadlineDays: deadline, source: trigger })
    alert(t(`This will reassign ${targets.length} users with a ${deadline}-day deadline.`,
            `سيتم تعيين الدورة لـ ${targets.length} مستخدمًا مع موعد نهائي قدره ${deadline} يومًا.`))
  }

  return (
    <div className="builder-grid">
      <div>
        <h3>{t('Targeted assignment', 'تعيين موجّه')}</h3>

        <div className="field">
          <label>{t('Target roles', 'الأدوار المستهدفة')}</label>
          <div className="row">
            {['rep-oncology','rep-cardio','msl-oncology','msl-cardio','kam'].map((r) => (
              <label key={r} className="chip" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={roles.includes(r)} onChange={(e) => {
                  setRoles((prev) => e.target.checked ? [...prev, r] : prev.filter((x) => x !== r))
                }} style={{ marginRight: 6 }} />
                {r}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>{t('Deadline (days)', 'الموعد النهائي (أيام)')}</label>
          <input type="number" value={deadline} onChange={(e) => setDeadline(+e.target.value)} className="filter-input" />
        </div>

        <div className="field">
          <label>{t('Auto-assign trigger', 'مشغّل التعيين التلقائي')}</label>
          <select className="filter-input" value={trigger} onChange={(e) => setTrigger(e.target.value)}>
            <option value="manual">{t('Manual', 'يدوي')}</option>
            <option value="auto-role">{t('Role change in HRIS', 'تغيير الدور (HRIS)')}</option>
            <option value="launch-readiness">{t('Product launch', 'إطلاق منتج')}</option>
            <option value="auto-version">{t('SOP/version update', 'تحديث الإجراء')}</option>
            <option value="quality-event">{t('Quality event (QMS)', 'حدث جودة (QMS)')}</option>
            <option value="cert-expiry">{t('Certificate expiry refresh', 'تجديد شهادة')}</option>
            <option value="crm-trigger">{t('CRM event (Veeva/SF)', 'حدث CRM')}</option>
          </select>
        </div>

        <div className="field">
          <label>{t('Reminder cadence', 'جدول التذكيرات')}</label>
          <div className="card-tight" style={{ background:'var(--bg)', borderRadius:'var(--r3)' }}>
            <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 11, lineHeight: 1.7 }}>
              <li>{t('7 days before — email + in-app',                 '7 أيام قبل — بريد + داخل التطبيق')}</li>
              <li>{t('3 days before — email + in-app + push',          '3 أيام قبل — بريد + داخل + إشعار')}</li>
              <li>{t('1 day before — push + SMS',                       'يوم قبل — إشعار + رسالة')}</li>
              <li>{t('Day-of — manager copied',                          'في اليوم — يُنسخ المدير')}</li>
              <li>{t('Overdue — daily, escalate to admin',              'متأخر — يوميًا للمدير العام')}</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3>{t('Preview targets', 'عرض المستهدفين')}</h3>
        <div className="row mb-12">
          <Pill variant="blue">{targets.length} {t('users', 'مستخدمين')}</Pill>
          <Pill variant="amber">{t('30-day deadline', 'موعد 30 يومًا')}</Pill>
          {trigger !== 'manual' && <Pill variant="purple">{trigger}</Pill>}
        </div>
        <div style={{ maxHeight: 300, overflowY:'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid var(--border)', borderRadius: 'var(--r3)' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('User', 'المستخدم')}</th>
                <th>{t('Role', 'الدور')}</th>
                <th>{t('Region', 'المنطقة')}</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((u) => (
                <tr key={u.id}>
                  <td>{t(u.name, u.nameAr)}</td>
                  <td>{u.jobTitle}</td>
                  <td>{u.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row mt-16">
          <button className="btn">{t('Save target list', 'حفظ القائمة')}</button>
          <button className="btn primary" onClick={handleAssign}>
            <Icon name="check" size={14} /> &nbsp; {t(`Assign to ${targets.length} users`, `تعيين لـ${targets.length} مستخدمين`)}
          </button>
        </div>
      </div>
    </div>
  )
}
