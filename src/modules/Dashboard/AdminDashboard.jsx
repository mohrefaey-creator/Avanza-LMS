import { useApp } from '../../context/AppContext.jsx'
import StatCard from '../../components/StatCard.jsx'
import Pill from '../../components/Pill.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import Icon from '../../components/Icon.jsx'

export default function AdminDashboard() {
  const { t, courses, users, assignments, certificates, goto } = useApp()

  const totalCourses = courses.filter(c => c.status === 'active').length
  const activeUsers = users.filter(u => u.role === 'learner' || u.role === 'manager').length
  const completionAvg = Math.round(
    assignments.reduce((s, a) => s + (a.progress || 0), 0) / Math.max(1, assignments.length)
  )
  const expiringCerts = certificates.filter(c => c.status === 'expiring').length

  const therapyAreas = [
    { name: 'Oncology',    nameAr: 'الأورام',       courses: 3, users: 12, completion: 71 },
    { name: 'Cardiology',  nameAr: 'أمراض القلب',   courses: 2, users: 8,  completion: 84 },
    { name: 'Diabetes',    nameAr: 'السكري',         courses: 1, users: 14, completion: 92 },
    { name: 'PV / GxP',    nameAr: 'اليقظة / GxP',   courses: 1, users: 27, completion: 66 },
  ]

  const recentActions = [
    { en: 'Layla uploaded KEYNORX v2.1.0',           ar: 'ليلى رفعت كاينوركس v2.1.0',           ts: '2h ago',  tag: 'upload' },
    { en: 'Auto-assigned PV refresher to 27 users',  ar: 'تم تعيين تجديد اليقظة لـ27 مستخدمًا', ts: '4h ago',  tag: 'assign' },
    { en: 'Sara passed ARNI Dosing (96%)',           ar: 'سارة اجتازت جرعات ARNI (٩٦٪)',         ts: 'Yesterday', tag: 'pass' },
    { en: 'Veeva trigger fired — 3 reps retraining', ar: 'تنبيه Veeva — 3 مندوبين يعيدون التدريب', ts: 'Yesterday', tag: 'trigger' },
    { en: 'Cert "PV v3.0" expires in 26 days for Sara', ar: 'شهادة "PV v3.0" تنتهي خلال 26 يومًا', ts: '2d ago', tag: 'expiring' },
  ]

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
        <StatCard label={t('Active courses', 'الدورات النشطة')} value={totalCourses} subtitle={t('+2 this quarter', '+2 هذا الربع')} icon="book" iconBg="var(--blue-l)" iconColor="var(--blue-d)" />
        <StatCard label={t('Active learners', 'المتعلمون النشطون')} value={activeUsers} subtitle={t('98% activation rate', 'نسبة التفعيل 98٪')} icon="users" iconBg="var(--green-l)" iconColor="var(--green)" valueColor="var(--green)" />
        <StatCard label={t('Avg completion', 'متوسط الإنجاز')} value={`${completionAvg}%`} subtitle={t('Target 80%', 'الهدف 80٪')} icon="pulse" iconBg="var(--blue-l)" iconColor="var(--blue-d)" valueColor="var(--blue-d)" />
        <StatCard label={t('Certs expiring', 'شهادات تنتهي')} value={expiringCerts} subtitle={t('Within 30 days', 'خلال 30 يومًا')} icon="clock" iconBg="var(--amb-l)" iconColor="var(--amb)" valueColor="var(--amb)" />
      </div>

      <div className="two-col">
        <div className="card">
          <h2>{t('Therapy area health', 'صحة المجالات العلاجية')}</h2>
          {therapyAreas.map((a) => (
            <div key={a.name} style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 6 }}>
                <div style={{ fontWeight:600 }}>{t(a.name, a.nameAr)}</div>
                <div style={{ fontSize:11, color:'var(--tx2)' }}>
                  {a.courses} {t('courses', 'دورات')} · {a.users} {t('users', 'مستخدم')}
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
          <TriggerCard label={t('HRIS role change',   'تغيير الدور (HRIS)')}        count={4}  variant="blue" />
          <TriggerCard label={t('Product launch',     'إطلاق منتج')}                count={1}  variant="purple" />
          <TriggerCard label={t('SOP/version update', 'تحديث الإجراء أو النسخة')} count={47} variant="amber" />
          <TriggerCard label={t('Cert expiry refresh','تجديد شهادة منتهية')}         count={6}  variant="green" />
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
    default:         return 'pulse'
  }
}
