import { useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import StatCard from '../../components/StatCard.jsx'
import Pill from '../../components/Pill.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import Icon from '../../components/Icon.jsx'

export default function AdminDashboard() {
  const { t, courses, users, assignments, certificates, auditLog, goto } = useApp()

  const totalCourses = courses.filter(c => c.status === 'active').length
  const activeUsers = users.filter(u => u.role === 'learner' || u.role === 'manager').length
  const completionAvg = Math.round(
    assignments.reduce((s, a) => s + (a.progress || 0), 0) / Math.max(1, assignments.length)
  )
  const expiringCerts = certificates.filter(c => c.status === 'expiring').length

  // Live therapy-area analytics — computed from the actual course catalog,
  // active assignments, and their completion progress. No more hardcoded
  // demo numbers. If the catalog has no courses (or only library courses
  // tagged "Commercial Skills"), this just shows what's really there.
  const therapyAreas = useMemo(() => {
    const buckets = new Map()
    for (const c of courses) {
      if (c.status !== 'active') continue
      const key = c.therapyArea || 'Uncategorized'
      if (!buckets.has(key)) {
        buckets.set(key, { name: key, nameAr: key, courseIds: new Set(), userIds: new Set(), totalProgress: 0, progressCount: 0 })
      }
      buckets.get(key).courseIds.add(c.id)
    }
    for (const a of assignments) {
      const c = courses.find((x) => x.id === a.courseId)
      if (!c) continue
      const key = c.therapyArea || 'Uncategorized'
      const bucket = buckets.get(key)
      if (!bucket) continue
      bucket.userIds.add(a.userId)
      bucket.totalProgress += (a.progress || 0)
      bucket.progressCount += 1
    }
    return Array.from(buckets.values())
      .map((b) => ({
        name: b.name,
        nameAr: b.nameAr,
        courses: b.courseIds.size,
        users: b.userIds.size,
        completion: b.progressCount > 0 ? Math.round(b.totalProgress / b.progressCount) : 0,
      }))
      .sort((a, b) => b.courses - a.courses)
      .slice(0, 8)  // top 8 therapy areas by course count
  }, [courses, assignments])

  // Recent activity is read straight from the live audit log so it reflects
  // real platform usage. Empty until users start interacting.
  const recentActions = useMemo(() => {
    return auditLog.slice(0, 6).map((entry) => {
      const meta = describeAuditEntry(entry, courses, users)
      return {
        en: meta.en,
        ar: meta.ar,
        ts: relativeTime(entry.timestamp),
        tag: meta.tag,
      }
    })
  }, [auditLog, courses, users])

  // Auto-assignment trigger counts from the live audit log (last 30 days).
  const triggerCounts = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000
    const recent = auditLog.filter((e) => new Date(e.timestamp).getTime() >= cutoff)
    return {
      hris:    recent.filter((e) => e.action === 'role_change').length,
      launch:  recent.filter((e) => e.action === 'product_launch_assign').length,
      sop:     recent.filter((e) => e.action === 'course_uploaded' || e.action === 'sop_version_assign').length,
      certExp: recent.filter((e) => e.action === 'cert_expiry_refresh').length,
    }
  }, [auditLog])

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('Admin dashboard', 'لوحة تحكم المدير')}</h1>
          <div className="subtitle">{t('Organisation overview · MENA region · 2026 Q2', 'نظرة على المؤسسة · منطقة MENA · الربع الثاني 2026')}</div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => goto('reports')}><Icon name="chart" size={14} /> &nbsp; {t('Reports', 'التقارير')}</button>
          <button className="btn primary" onClick={() => goto('builder')}><Icon name="plus" size={14} /> &nbsp; {t('New course', 'دورة جديدة')}</button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label={t('Active courses', 'الدورات النشطة')}    value={totalCourses}        subtitle={t('In catalog', 'في الكتالوج')}    icon="book"  iconBg="var(--blue-l)"  iconColor="var(--blue-d)" />
        <StatCard label={t('Active learners', 'المتعلمون النشطون')} value={activeUsers}         subtitle={t('Learners + managers', 'متعلمون ومشرفون')} icon="users" iconBg="var(--green-l)" iconColor="var(--green)"  valueColor="var(--green)" />
        <StatCard label={t('Avg completion', 'متوسط الإنجاز')}      value={`${completionAvg}%`} subtitle={t('Target 80%', 'الهدف 80٪')}          icon="pulse" iconBg="var(--blue-l)"  iconColor="var(--blue-d)" valueColor="var(--blue-d)" />
        <StatCard label={t('Certs expiring', 'شهادات تنتهي')}        value={expiringCerts}       subtitle={t('Within 30 days', 'خلال 30 يومًا')}   icon="clock" iconBg="var(--amb-l)"   iconColor="var(--amb)"    valueColor="var(--amb)" />
      </div>

      <div className="two-col">
        <div className="card">
          <h2>{t('Therapy area health', 'صحة المجالات العلاجية')}</h2>
          {therapyAreas.length === 0 && (
            <div className="muted" style={{ fontSize: 12, padding: '14px 0' }}>
              {t('No active courses yet. Add courses to see therapy-area analytics.',
                 'لا توجد دورات نشطة بعد. أضف دورات لرؤية تحليلات المجالات العلاجية.')}
            </div>
          )}
          {therapyAreas.map((a) => (
            <div key={a.name} style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 6 }}>
                <div style={{ fontWeight:600 }}>{t(a.name, a.nameAr)}</div>
                <div style={{ fontSize:11, color:'var(--tx2)' }}>
                  {a.courses} {t(a.courses === 1 ? 'course' : 'courses', 'دورات')} · {a.users} {t(a.users === 1 ? 'user' : 'users', 'مستخدم')}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'center' }}>
                <ProgressBar pct={a.completion} />
                <div style={{ fontSize:11, fontWeight:700 }}>{a.completion}%</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>{t('Recent activity', 'النشاط الأخير')}</h2>
          {recentActions.length === 0 && (
            <div className="muted" style={{ fontSize: 12, padding: '14px 0' }}>
              {t('No recent activity yet. Live actions will appear here as they happen.',
                 'لا يوجد نشاط حديث. ستظهر الأحداث الحية هنا فور وقوعها.')}
            </div>
          )}
          {recentActions.map((a, i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderTop: i ? '1px solid var(--border)' : 'none', alignItems:'flex-start' }}>
              <div style={{ width:28, height:28, borderRadius:8, background: tagColor(a.tag).bg, color: tagColor(a.tag).fg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name={tagIcon(a.tag)} size={14} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600 }}>{t(a.en, a.ar)}</div>
                <div style={{ fontSize:10, color:'var(--tx3)', marginTop:2 }}>{a.ts}</div>
              </div>
            </div>
          ))}
          <button className="btn ghost" style={{ marginTop:8 }} onClick={() => goto('compliance')}>
            {t('Open audit log →', 'فتح سجل المراجعة →')}
          </button>
        </div>
      </div>

      <div className="mt-16 card">
        <h2>{t('Auto-assignment triggers — last 30 days', 'مشغّلات التعيين التلقائي — آخر 30 يومًا')}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
          <TriggerCard label={t('HRIS role change',   'تغيير الدور (HRIS)')}        count={triggerCounts.hris}    variant="blue" />
          <TriggerCard label={t('Product launch',     'إطلاق منتج')}                count={triggerCounts.launch}  variant="purple" />
          <TriggerCard label={t('SOP/version update', 'تحديث الإجراء أو النسخة')} count={triggerCounts.sop}     variant="amber" />
          <TriggerCard label={t('Cert expiry refresh','تجديد شهادة منتهية')}         count={triggerCounts.certExp} variant="green" />
        </div>
      </div>
    </>
  )
}

function TriggerCard({ label, count, variant }) {
  return (
    <div style={{ padding:'12px 14px', border:'1px solid var(--border)', borderRadius: 'var(--r3)' }}>
      <Pill variant={variant}>{label}</Pill>
      <div style={{ fontSize:22, fontWeight:700, marginTop:6 }}>{count}</div>
    </div>
  )
}

function tagColor(tag) {
  switch (tag) {
    case 'upload':   return { bg: 'var(--blue-l)',   fg: 'var(--blue-d)' }
    case 'assign':   return { bg: 'var(--pur-l)',    fg: 'var(--pur)' }
    case 'pass':     return { bg: 'var(--green-l)',  fg: 'var(--green)' }
    case 'trigger':  return { bg: 'var(--amb-l)',    fg: 'var(--amb)' }
    case 'expiring': return { bg: 'var(--red-l)',    fg: 'var(--red)' }
    default:         return { bg: 'var(--bg)',       fg: 'var(--tx2)' }
  }
}

function tagIcon(tag) {
  switch (tag) {
    case 'upload':   return 'upload'
    case 'assign':   return 'check'
    case 'pass':     return 'award'
    case 'trigger':  return 'zap'
    case 'expiring': return 'clock'
    case 'login':    return 'login'
    default:         return 'pulse'
  }
}

// Map an audit-log entry to a human-readable description + a tag for icon/color.
function describeAuditEntry(entry, courses, users) {
  const userName = entry.userName || 'Someone'
  const courseFor = courses.find((c) => c.id === entry.target)
  const targetUser = users.find((u) => u.id === entry.target)
  const courseLabel = courseFor ? `"${courseFor.title}"` : (entry.target || '')
  const userLabel = targetUser ? targetUser.name : (entry.target || '')

  switch (entry.action) {
    case 'user_login':
      return { tag: 'login', en: `${userName} signed in`, ar: `سجل ${userName} الدخول` }
    case 'user_logout':
      return { tag: 'login', en: `${userName} signed out`, ar: `سجل ${userName} الخروج` }
    case 'course_uploaded':
      return { tag: 'upload', en: `${userName} uploaded ${courseLabel}`, ar: `رفع ${userName} ${courseLabel}` }
    case 'course_assigned':
      return { tag: 'assign', en: `${userName} assigned ${courseLabel}`, ar: `عيّن ${userName} ${courseLabel}` }
    case 'course_archived':
      return { tag: 'upload', en: `${userName} archived ${courseLabel}`, ar: `أرشف ${userName} ${courseLabel}` }
    case 'quiz_submitted':
      return { tag: 'pass', en: `${userName} submitted quiz on ${courseLabel}`, ar: `أرسل ${userName} اختبار ${courseLabel}` }
    case 'cert_issued':
      return { tag: 'pass', en: `Certificate issued to ${userName}`, ar: `صدرت شهادة لـ${userName}` }
    case 'cert_revoked':
      return { tag: 'expiring', en: `Certificate revoked for ${userName}`, ar: `أُلغيت شهادة ${userName}` }
    case 'esignature_applied':
      return { tag: 'pass', en: `${userName} e-signed ${courseLabel}`, ar: `وقّع ${userName} إلكترونيًا على ${courseLabel}` }
    case 'reminder_sent':
      return { tag: 'trigger', en: `Reminder sent to ${userLabel}`, ar: `تم إرسال تذكير إلى ${userLabel}` }
    case 'roleplay_started':
      return { tag: 'trigger', en: `${userName} started AI roleplay`, ar: `${userName} بدأ محاكاة الذكاء الاصطناعي` }
    case 'roleplay_scored':
      return { tag: 'pass', en: `${userName} completed AI roleplay`, ar: `${userName} أكمل محاكاة الذكاء الاصطناعي` }
    case 'audit_log_exported':
      return { tag: 'upload', en: `${userName} exported the audit log`, ar: `صدّر ${userName} سجل المراجعة` }
    default:
      return { tag: 'pulse', en: `${userName}: ${entry.action}`, ar: `${userName}: ${entry.action}` }
  }
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1)   return 'just now'
  if (min < 60)  return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24)   return `${hr}h ago`
  const d = Math.round(hr / 24)
  if (d < 30)    return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}
