import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import TeamCard from '../../components/TeamCard.jsx'
import Icon from '../../components/Icon.jsx'
import BulkUploadModal, { downloadTemplate } from './BulkUpload.jsx'

const FILTERS = [
  { id: 'all',           en: 'All',           ar: 'الكل' },
  { id: 'on-track',      en: 'On track',      ar: 'على المسار' },
  { id: 'at-risk',       en: 'At risk',       ar: 'في خطر' },
  { id: 'top-performer', en: 'Top performer', ar: 'متميز' },
  { id: 'needs-review',  en: 'Needs review',  ar: 'يحتاج مراجعة' },
  { id: 'new-hire',      en: 'New hire',      ar: 'موظف جديد' },
]

export default function TeamView() {
  const { t, teams, users, role, user, setSelectedMember, logAction } = useApp()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [importBanner, setImportBanner] = useState(null)

  const filtered = useMemo(() => {
    let list = teams
    if (filter !== 'all') list = list.filter((m) => m.status === filter)
    if (q) list = list.filter((m) => (m.name + m.location + m.role).toLowerCase().includes(q.toLowerCase()))
    return list
  }, [teams, filter, q])

  const counts = teams.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1
    return acc
  }, {})

  const onTrack = (counts['on-track'] || 0) + (counts['top-performer'] || 0)
  const atRisk = counts['at-risk'] || 0

  const districtName = role === 'admin'
    ? t('All users — organisation-wide', 'جميع المستخدمين — كامل المؤسسة')
    : t(`My team — ${user?.region} district`, `فريقي — منطقة ${user?.region}`)

  const handleExportCSV = () => {
    const escapeCSV = (cell) => {
      if (cell === null || cell === undefined) return ''
      const s = String(cell)
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const deriveAuthRole = (m) => {
      if (m.userId) {
        const u = users?.find((x) => x.id === m.userId)
        if (u?.role) return u.role
      }
      if (m.email) {
        const u = users?.find((x) => x.email?.toLowerCase() === m.email.toLowerCase())
        if (u?.role) return u.role
      }
      const title = (m.role || '').toLowerCase()
      if (/director|admin|head/.test(title))   return 'admin'
      if (/manager|supervisor/.test(title))    return 'manager'
      if (/auditor|compliance/.test(title))    return 'auditor'
      return 'learner'
    }
    const headers = ['User ID','User Name','Role','Email','Job Title','Manager Name','Manager Email','Country','Region','City','Line','Phone']
    const rows = filtered.map((m) => [
      m.userId || m.id || '',
      m.name || '',
      deriveAuthRole(m),
      m.email || '',
      m.role || '',
      m.managerName || '',
      m.managerEmail || m.reportsTo || '',
      m.country || '',
      m.region || '',
      m.city || m.district || '',
      m.line || '',
      m.phone || '',
    ])
    const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(',')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `avanza-users-${stamp}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    logAction('users_csv_exported', `${filtered.length}-users`, { filter, search: q || null })
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{districtName}</h1>
          <div className="subtitle">
            {t(`${teams.length} ${role === 'admin' ? 'users' : 'reports'} · ${onTrack} on track · ${atRisk} at risk`,
               `${teams.length} مستخدم · ${onTrack} على المسار · ${atRisk} في خطر`)}
          </div>
        </div>
        <div className="row">
          <button className="btn" onClick={handleExportCSV} disabled={filtered.length === 0} title={t('Export the current filtered list', 'تصدير القائمة المعروضة')}>
            <Icon name="download" size={14} /> &nbsp; {t(`Export CSV (${filtered.length})`, `تصدير CSV (${filtered.length})`)}
          </button>
          {role === 'admin' && (
            <>
              <button className="btn" onClick={downloadTemplate} title={t('Download blank template with hierarchy columns', 'تنزيل قالب فارغ مع أعمدة التسلسل')}>
                <Icon name="doc" size={14} /> &nbsp; {t('Download template', 'تنزيل القالب')}
              </button>
              <button className="btn primary" onClick={() => setShowBulk(true)}>
                <Icon name="upload" size={14} /> &nbsp; {t('Bulk upload', 'رفع جماعي')}
              </button>
            </>
          )}
        </div>
      </div>

      {importBanner && (
        <div className="card mb-12" style={{ background: 'var(--green-l)', borderColor: 'var(--green-m)' }}>
          <div className="row" style={{ alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#15803D' }}>
                {t(`Imported ${importBanner.count} user${importBanner.count === 1 ? '' : 's'} into the org.`,
                   `تم استيراد ${importBanner.count} مستخدم إلى المؤسسة.`)}
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                {t('They appear at the top of the list with "New hire" status. Reporting chain is built from the email links you provided.',
                   'يظهرون أعلى القائمة بحالة "موظف جديد". تم بناء سلسلة التقارير من البريد الإلكتروني.')}
              </div>
            </div>
            <button className="icon-btn" onClick={() => setImportBanner(null)}><Icon name="x" size={14} /></button>
          </div>
        </div>
      )}

      <div className="card mb-16">
        <div className="row" style={{ gap: 8 }}>
          <input className="filter-input" style={{ flex:1, minWidth:220 }} placeholder={t('Search name, location, or role', 'ابحث بالاسم، الموقع، أو الدور')} value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="chip-row" style={{ margin: 0 }}>
            {FILTERS.map((f) => (
              <button key={f.id} className={`chip ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
                {t(f.en, f.ar)} {f.id !== 'all' && counts[f.id] ? ` · ${counts[f.id]}` : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="team-grid">
        {filtered.map((m) => (
          <TeamCard key={m.id} member={m} onClick={() => setSelectedMember(m.id)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="ico"><Icon name="users" size={22} /></div>
          <h4>{t('No team members match', 'لا أعضاء مطابقون')}</h4>
          <p>{t('Try a different filter or clear the search.', 'جرّب فلترًا آخر أو امسح البحث.')}</p>
        </div>
      )}

      {showBulk && (
        <BulkUploadModal onClose={(result) => {
          setShowBulk(false)
          if (result && result.count) setImportBanner(result)
        }} />
      )}
    </>
  )
}
