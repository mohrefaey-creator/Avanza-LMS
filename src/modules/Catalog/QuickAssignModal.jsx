import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Icon from '../../components/Icon.jsx'
import Pill from '../../components/Pill.jsx'
import { categorizeUser, CATEGORY_THEME, LINE_THEME } from '../../lib/category.js'

// ─────────────────────────────────────────────────────────────────────────────
// Quick assign — backend contract
// ─────────────────────────────────────────────────────────────────────────────
//   POST /api/courses/:courseId/assign
//   Body: {
//     userIds: uuid[],
//     deadlineDays: number,
//     source: 'admin' | 'auto-role' | 'auto-version' | 'launch-readiness'
//             | 'quality-event' | 'cert-expiry' | 'crm-trigger',
//     reminderCadence?: object,    // optional override of default escalation
//   }
//
//   Server-side:
//     1. Validates user permissions (admin only)
//     2. For each userId, INSERT INTO assignments(...) with
//        - assigned_at = now()
//        - due_at = now() + deadlineDays * 86400
//        - status = 'not-started'
//        - source = body.source
//        - certificate_id = null (issued on completion)
//     3. Schedules reminder notifications per the cadence in the SKILL spec:
//        7d / 3d / 1d / day-of / overdue
//     4. Writes one audit_log row { action: 'course_assigned',
//        target: courseId, meta: { userCount, deadlineDays, source } }
//     5. Returns the created assignment rows
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { id: 'all',       en: 'Any role',       ar: 'أي دور' },
  { id: 'rep',       en: 'Rep',            ar: 'مندوب' },
  { id: 'dm',        en: 'DM',             ar: 'مدير منطقة' },
  { id: 'bu',        en: 'BU Manager',     ar: 'مدير وحدة' },
  { id: 'marketing', en: 'Marketing',      ar: 'تسويق' },
  { id: 'admin',     en: 'Admin',          ar: 'مدير' },
  { id: 'auditor',   en: 'Auditor',        ar: 'مدقق' },
]

const LINE_OPTIONS = [
  { id: 'all', en: 'Any line', ar: 'أي مستوى' },
  { id: 'L1',  en: 'L1 · Managing Director',  ar: 'L1' },
  { id: 'L2',  en: 'L2 · BU Head',            ar: 'L2' },
  { id: 'L3',  en: 'L3 · National Sales',     ar: 'L3' },
  { id: 'L4',  en: 'L4 · District / Regional', ar: 'L4' },
  { id: 'L5',  en: 'L5 · Senior',             ar: 'L5' },
  { id: 'L6',  en: 'L6 · Rep / MSL / KAM',    ar: 'L6' },
]

export default function QuickAssignModal({ course, onClose }) {
  const { t, users, assignments, assignCourseToUsers, logAction } = useApp()
  const [picked, setPicked] = useState([])
  const [filter, setFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [lineFilter, setLineFilter] = useState('all')
  const [deadlineDays, setDeadlineDays] = useState(30)

  const eligible = useMemo(() => users.filter((u) => u.role === 'learner' || u.role === 'manager'), [users])
  const alreadyAssigned = useMemo(
    () => new Set(assignments.filter((a) => a.courseId === course.id).map((a) => a.userId)),
    [assignments, course.id]
  )

  // Resolve each user's category once for filtering — falls back to the
  // runtime classifier for legacy records without a persisted category.
  const userCategory = (u) => u.category || categorizeUser(u.roleRaw, u.jobTitle, u.role)

  const filtered = useMemo(() => {
    const q = filter.toLowerCase()
    return eligible.filter((u) => {
      if (roleFilter !== 'all' && userCategory(u) !== roleFilter) return false
      if (lineFilter !== 'all' && u.line !== lineFilter) return false
      if (q && !(u.name + ' ' + u.email + ' ' + (u.jobTitle || '') + ' ' + (u.therapyArea || '')).toLowerCase().includes(q)) return false
      return true
    })
  }, [eligible, filter, roleFilter, lineFilter])

  const togglePick = (id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  const pickAll = () => setPicked(filtered.filter((u) => !alreadyAssigned.has(u.id)).map((u) => u.id))
  const clearPicks = () => setPicked([])

  const handleAssign = () => {
    if (picked.length === 0) return
    const created = assignCourseToUsers(course.id, picked, { deadlineDays, source: 'admin' })
    logAction('course_assigned', course.id, {
      userCount: created.length,
      deadlineDays,
      title: course.title,
      roleFilter: roleFilter !== 'all' ? roleFilter : undefined,
      lineFilter: lineFilter !== 'all' ? lineFilter : undefined,
    })
    onClose({ count: created.length })
  }

  const dueLabel = new Date(Date.now() + deadlineDays * 86400000).toLocaleDateString()

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 720 }}>
        <div className="modal-head">
          <h3>{t('Assign course', 'تعيين الدورة')}</h3>
          <button className="icon-btn" onClick={() => onClose(null)}><Icon name="x" size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="card-tight" style={{ background: 'var(--blue-l)', border: '1px solid var(--blue-m)', borderRadius: 'var(--r3)', padding: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--blue-d)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.3px' }}>
              {t('Course', 'الدورة')}
            </div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>{t(course.title, course.titleAr)}</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
              {course.therapyArea} · {course.product} · v{course.version}
            </div>
          </div>

          <div className="row" style={{ gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: '1 1 140px', marginBottom: 0, minWidth: 0 }}>
              <label>{t('Deadline (days)', 'الموعد (أيام)')}</label>
              <input type="number" className="filter-input" min="1" max="365" value={deadlineDays} onChange={(e) => setDeadlineDays(+e.target.value || 1)} />
              <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>{t('Due by', 'موعد الانتهاء')}: {dueLabel}</div>
            </div>
            <div className="field" style={{ flex: '1 1 160px', marginBottom: 0, minWidth: 0 }}>
              <label>{t('Filter by role', 'تصفية حسب الدور')}</label>
              <select className="filter-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                {ROLE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{t(o.en, o.ar)}</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: '1 1 160px', marginBottom: 0, minWidth: 0 }}>
              <label>{t('Filter by line', 'تصفية حسب المستوى')}</label>
              <select className="filter-input" value={lineFilter} onChange={(e) => setLineFilter(e.target.value)}>
                {LINE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{t(o.en, o.ar)}</option>)}
              </select>
            </div>
          </div>

          {(roleFilter !== 'all' || lineFilter !== 'all') && (
            <div className="card-tight" style={{ background: 'var(--blue-l)', border: '1px solid var(--blue-m)', borderRadius: 'var(--r3)', padding: 10, marginBottom: 10, fontSize: 12 }}>
              <div className="row" style={{ alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Icon name="filter" size={12} color="var(--blue-d)" />
                <span style={{ color: 'var(--blue-d)', fontWeight: 600 }}>
                  {t('Filtered to:', 'مفلتر إلى:')}
                </span>
                {roleFilter !== 'all' && (
                  <Pill variant={CATEGORY_THEME[roleFilter]?.pillVariant || 'gray'}>
                    {t(ROLE_OPTIONS.find((o) => o.id === roleFilter)?.en, ROLE_OPTIONS.find((o) => o.id === roleFilter)?.ar)}
                  </Pill>
                )}
                {lineFilter !== 'all' && (
                  <Pill variant={LINE_THEME[lineFilter]?.variant || 'gray'}>{lineFilter}</Pill>
                )}
                <span className="muted" style={{ marginInlineStart: 'auto' }}>
                  {filtered.length} {t(filtered.length === 1 ? 'match' : 'matches', 'مطابق')}
                </span>
                <button type="button" className="btn sm" onClick={() => { setRoleFilter('all'); setLineFilter('all') }}>
                  {t('Clear filters', 'مسح')}
                </button>
              </div>
            </div>
          )}

          <div className="field">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('Recipients', 'المستلمون')}</span>
              <span className="row" style={{ gap: 6 }}>
                <button type="button" className="btn sm" onClick={pickAll}>{t('Select visible', 'اختر المعروضين')}</button>
                <button type="button" className="btn sm" onClick={clearPicks} disabled={picked.length === 0}>{t('Clear', 'مسح')}</button>
              </span>
            </label>
            <input className="filter-input" style={{ width: '100%' }} placeholder={t('Search name, email, title, or therapy area', 'ابحث في الاسم والبريد والمسمى والمجال')} value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid var(--border)', borderRadius: 'var(--r3)' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>{t('Name', 'الاسم')}</th>
                  <th>{t('Category', 'الفئة')}</th>
                  <th>{t('Line', 'المستوى')}</th>
                  <th>{t('Region', 'المنطقة')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const has = alreadyAssigned.has(u.id)
                  const cat = userCategory(u)
                  const catTheme = CATEGORY_THEME[cat] || CATEGORY_THEME.other
                  return (
                    <tr key={u.id}>
                      <td>
                        <input type="checkbox" checked={picked.includes(u.id)} disabled={has} onChange={() => togglePick(u.id)} />
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div className="muted" style={{ fontSize: 10 }}>{u.email}</div>
                      </td>
                      <td><Pill variant={catTheme.pillVariant}>{t(catTheme.en, catTheme.ar)}</Pill></td>
                      <td>{u.line ? <Pill variant={LINE_THEME[u.line]?.variant || 'gray'}>{u.line}</Pill> : '—'}</td>
                      <td>{u.region || '—'}</td>
                      <td>{has && <Pill variant="gray">{t('Already assigned', 'مُعيَّن مسبقًا')}</Pill>}</td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 30, color: 'var(--tx3)' }}>{t('No users match', 'لا مستخدمين مطابقين')}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {picked.length > 0 && (
            <div className="card-tight mt-12" style={{ background: 'var(--green-l)', borderRadius: 'var(--r3)', padding: 10, fontSize: 12 }}>
              <strong>{t(`Will assign to ${picked.length} user${picked.length === 1 ? '' : 's'}`, `سيُعيَّن لـ ${picked.length} مستخدمين`)}</strong>
              <span className="muted" style={{ marginInlineStart: 8 }}>· {t('Reminders fire at', 'تذكيرات عند')} 7d / 3d / 1d / 0d</span>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => onClose(null)}>{t('Cancel', 'إلغاء')}</button>
          <button className="btn primary" onClick={handleAssign} disabled={picked.length === 0}>
            <Icon name="check" size={14} /> &nbsp;
            {picked.length > 0
              ? t(`Assign to ${picked.length}`, `تعيين لـ ${picked.length}`)
              : t('Select users to assign', 'اختر مستخدمين')}
          </button>
        </div>
      </div>
    </div>
  )
}
