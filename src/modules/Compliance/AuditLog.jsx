import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Pill from '../../components/Pill.jsx'
import Icon from '../../components/Icon.jsx'

const ACTION_VARIANTS = {
  user_login:          'blue',
  user_logout:         'gray',
  course_uploaded:     'purple',
  course_assigned:     'blue',
  course_archived:     'gray',
  quiz_submitted:      'amber',
  esignature_applied:  'green',
  cert_issued:         'green',
  cert_revoked:        'red',
  reminder_sent:       'amber',
  deadline_waived:     'red',
  course_opened:       'blue',
  cert_viewed:         'gray',
  ai_authoring_started:'purple',
  roleplay_started:    'teal',
  roleplay_scored:     'teal',
}

export default function AuditLog() {
  const { t, auditLog, logAction } = useApp()
  const [q, setQ] = useState('')
  const [filterAction, setFilterAction] = useState('all')

  const handleExportCSV = () => {
    const escapeCSV = (cell) => {
      if (cell === null || cell === undefined) return ''
      const s = String(cell)
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const headers = ['Timestamp', 'User ID', 'User Name', 'Role', 'Action', 'Target', 'Meta', 'IP']
    const rows = filtered.map((e) => [
      new Date(e.timestamp).toISOString(),
      e.userId || '',
      e.userName || '',
      e.role || '',
      e.action || '',
      e.target || '',
      e.meta && Object.keys(e.meta).length ? JSON.stringify(e.meta) : '',
      e.ip || '',
    ])
    const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(',')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    a.href = url
    a.download = `avanza-audit-log-${stamp}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    logAction('audit_log_exported', `${filtered.length}-entries`, {
      filter: filterAction !== 'all' ? filterAction : null,
      search: q || null,
    })
  }

  const filtered = useMemo(() => {
    return auditLog.filter((e) => {
      if (filterAction !== 'all' && e.action !== filterAction) return false
      if (q && !(e.userName + ' ' + e.action + ' ' + e.target).toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
  }, [auditLog, q, filterAction])

  const allActions = ['all', ...Array.from(new Set(auditLog.map((e) => e.action)))]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('Audit log', 'سجل المراجعة')}</h1>
          <div className="subtitle">
            {t('Append-only · 21 CFR Part 11 / EU Annex 11 · immutable',
               'يضاف فقط · 21 CFR Part 11 / EU Annex 11 · غير قابل للتعديل')}
          </div>
        </div>
        <div className="row">
          <Pill variant="green"><Icon name="shield" size={10} /> &nbsp; {t('Immutable', 'غير قابل للتعديل')}</Pill>
          <button className="btn" onClick={handleExportCSV} disabled={filtered.length === 0} title={t('Export the filtered audit trail', 'تصدير سجل المراجعة المعروض')}>
            <Icon name="download" size={14} /> &nbsp; {t(`Export CSV (${filtered.length})`, `تصدير CSV (${filtered.length})`)}
          </button>
        </div>
      </div>

      <div className="card mb-16">
        <div className="row" style={{ gap: 8 }}>
          <input className="filter-input" style={{ flex:1, minWidth: 220 }} placeholder={t('Search user, action, or target', 'ابحث في المستخدم، الإجراء، أو الهدف')} value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="filter-input" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
            {allActions.map((a) => <option key={a} value={a}>{a === 'all' ? t('All actions', 'كل الإجراءات') : a}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {/* Desktop / tablet view: wide horizontal table with all columns. */}
        <div className="tbl-wrap audit-tbl-only">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('When', 'الوقت')}</th>
                <th>{t('User', 'المستخدم')}</th>
                <th>{t('Role', 'الدور')}</th>
                <th>{t('Action', 'الإجراء')}</th>
                <th>{t('Target', 'الهدف')}</th>
                <th>{t('Meta', 'بيانات')}</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(e.timestamp).toLocaleString()}</td>
                  <td>{e.userName}</td>
                  <td><Pill variant="blue">{e.role}</Pill></td>
                  <td><Pill variant={ACTION_VARIANTS[e.action] || 'gray'}>{e.action}</Pill></td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{e.target}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--tx2)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.meta && Object.keys(e.meta).length ? JSON.stringify(e.meta) : '—'}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{e.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile view: stacked card per audit entry — no horizontal scroll. */}
        <div className="audit-card-only">
          {filtered.length === 0 && (
            <div className="muted" style={{ fontSize: 12, textAlign: 'center', padding: '24px 12px' }}>
              {t('No audit entries match the current filters.', 'لا توجد سجلات مطابقة للمرشحات الحالية.')}
            </div>
          )}
          {filtered.map((e) => (
            <div key={e.id} className="audit-card">
              <div className="audit-card-head">
                <Pill variant={ACTION_VARIANTS[e.action] || 'gray'}>{e.action}</Pill>
                <span className="audit-card-time">{new Date(e.timestamp).toLocaleString()}</span>
              </div>
              <div className="audit-card-row">
                <span className="audit-card-key">{t('User', 'المستخدم')}</span>
                <span className="audit-card-val">
                  {e.userName} <Pill variant="blue">{e.role}</Pill>
                </span>
              </div>
              <div className="audit-card-row">
                <span className="audit-card-key">{t('Target', 'الهدف')}</span>
                <span className="audit-card-val mono">{e.target || '—'}</span>
              </div>
              {e.meta && Object.keys(e.meta).length > 0 && (
                <div className="audit-card-row">
                  <span className="audit-card-key">{t('Meta', 'بيانات')}</span>
                  <span className="audit-card-val mono small">{JSON.stringify(e.meta)}</span>
                </div>
              )}
              <div className="audit-card-row">
                <span className="audit-card-key">IP</span>
                <span className="audit-card-val mono">{e.ip || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="muted mt-16" style={{ fontSize: 11 }}>
        {t('All entries are signed at write-time. UPDATE and DELETE are revoked at the database role level.',
           'جميع السجلات موقّعة وقت الكتابة. صلاحيات التعديل والحذف مسحوبة على مستوى قاعدة البيانات.')}
      </div>
    </>
  )
}
