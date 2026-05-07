import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Pill from '../../components/Pill.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import Icon from '../../components/Icon.jsx'
import { mockActivity, mockScores, mockHoursPerWeek, mockHeatmap } from '../../data/teams.js'

const TABS = [
  { id: 'activity',    en: 'Activity',    ar: 'النشاط' },
  { id: 'courses',     en: 'Courses',     ar: 'الدورات' },
  { id: 'performance', en: 'Performance', ar: 'الأداء' },
  { id: 'compliance',  en: 'Compliance',  ar: 'الامتثال' },
]

export default function MemberDetail() {
  const { t, teams, selectedMember, setSelectedMember, courses, assignments, certificates, logAction } = useApp()
  const [tab, setTab] = useState('activity')

  const m = teams.find((x) => x.id === selectedMember)
  if (!m) return null

  const userId = m.userId || 'u-rep-1'
  const myAssignments = assignments.filter((a) => a.userId === userId)
  const myCerts = certificates.filter((c) => c.userId === userId)

  const status = ((s) => {
    switch (s) {
      case 'on-track':      return { en: 'On track',      ar: 'على المسار', v: 'green' }
      case 'at-risk':       return { en: 'At risk',       ar: 'في خطر',     v: 'red' }
      case 'top-performer': return { en: 'Top performer', ar: 'متميز',      v: 'green' }
      case 'needs-review':  return { en: 'Needs review',  ar: 'يحتاج مراجعة', v: 'amber' }
      case 'new-hire':      return { en: 'New hire',      ar: 'موظف جديد',  v: 'blue' }
      default:              return { en: s, ar: s, v: 'gray' }
    }
  })(m.status)

  const learningIndex = Math.round(0.4 * (m.avgScore || 0) + 0.2 * m.completion + 0.15 * (m.completion > 50 ? 90 : 60) + 0.15 * Math.min(100, m.hours * 2) + 0.10 * 80)
  const lband = learningIndex >= 90 ? 'green' : learningIndex >= 75 ? 'blue' : learningIndex >= 60 ? 'amber' : 'red'

  const handleSendReminder = () => {
    logAction('reminder_sent', userId)
    alert(t('Reminder sent.', 'تم إرسال التذكير.'))
  }

  return (
    <>
      <div className="page-head">
        <div>
          <button className="btn ghost" style={{ paddingLeft:0 }} onClick={() => setSelectedMember(null)}>
            <Icon name="arrowL" size={14} /> &nbsp; {t('Back to team', 'العودة للفريق')}
          </button>
          <div className="row mt-12" style={{ gap: 14, alignItems: 'center' }}>
            <div className="team-avatar" style={{ background: m.bg, color: m.col, width: 56, height: 56, fontSize: 18 }}>{m.init}</div>
            <div>
              <h1 style={{ margin: 0 }}>{t(m.name, m.nameAr)}</h1>
              <div className="subtitle">
                {m.role} · {m.location} · {t('Hired', 'تاريخ التعيين')} 2023-09-15
              </div>
              <div className="row mt-12" style={{ gap: 6 }}>
                <Pill variant={status.v}>{t(status.en, status.ar)}</Pill>
                <Pill variant="purple"><Icon name="pen" size={10} /> &nbsp; {t('e-signed compliance', 'الامتثال موقّع')}</Pill>
                <Pill variant={lband}>{t(`Learning Index ${learningIndex}`, `مؤشر التعلم ${learningIndex}`)}</Pill>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <button className="btn" onClick={handleSendReminder}><Icon name="bell" size={14} /> &nbsp; {t('Send reminder', 'إرسال تذكير')}</button>
          <button className="btn"><Icon name="message" size={14} /> &nbsp; {t('Schedule 1:1', 'جدولة لقاء')}</button>
          <button className="btn"><Icon name="pen" size={14} /> &nbsp; {t('Coaching note', 'ملاحظة تدريبية')}</button>
        </div>
      </div>

      <div className="builder-grid">
        <div className="card" style={{ alignSelf: 'start' }}>
          <h3>{t('Profile', 'الملف الشخصي')}</h3>
          <div className="kv-list">
            <KV label={t('Email', 'البريد')} value={m.email || `${m.name.toLowerCase().split(' ')[0]}.rep@avanza.health`} />
            <KV label={t('Phone', 'الهاتف')} value={m.phone || '+971 50 555 0100'} />
            {m.line && <KV label={t('Line', 'المستوى')} value={m.line} />}
            <KV label={t('Manager', 'المدير')} value={m.managerName || m.managerEmail || 'Fadi Saleh'} />
            {m.managerEmail && <KV label={t('Manager email', 'بريد المدير')} value={m.managerEmail} />}
            <KV label={t('Hire date', 'تاريخ التعيين')} value={m.hireDate || '2023-09-15'} />
            <KV label={t('Country', 'الدولة')} value={m.country || 'UAE'} />
            <KV label={t('Region', 'المنطقة')} value={m.region || '—'} />
            <KV label={t('City', 'المدينة')} value={m.city || m.district || '—'} />
            <KV label={t('Therapy area', 'المجال العلاجي')} value={m.therapyArea || 'Oncology'} />
            <KV label={t('Active certifications', 'الشهادات النشطة')} value={`${myCerts.filter(c => c.status === 'active').length} ${t('active', 'نشطة')}`} />
            <KV label={t('Mandatory courses', 'الدورات الإلزامية')} value={t('All current', 'كلها سارية')} />
          </div>
        </div>

        <div>
          <div className="card">
            <div className="tabs">
              {TABS.map((tt) => (
                <button key={tt.id} className={`tab ${tab === tt.id ? 'active' : ''}`} onClick={() => setTab(tt.id)}>
                  {t(tt.en, tt.ar)}
                </button>
              ))}
            </div>

            {tab === 'activity' && <ActivityTab activity={mockActivity} />}
            {tab === 'courses' && <CoursesTab assignments={myAssignments} courses={courses} />}
            {tab === 'performance' && <PerformanceTab learningIndex={learningIndex} band={lband} />}
            {tab === 'compliance' && <ComplianceTab certs={myCerts} courses={courses} />}
          </div>
        </div>
      </div>
    </>
  )
}

function KV({ label, value }) {
  return (
    <div className="kv-row">
      <div className="kv-label">{label}</div>
      <div className="kv-value">{value}</div>
    </div>
  )
}

function ActivityTab({ activity }) {
  const { t } = useApp()
  return (
    <div>
      {activity.map((a) => (
        <div key={a.id} style={{ display:'grid', gridTemplateColumns:'32px 1fr auto', gap:10, padding:'10px 0', borderTop:'1px solid var(--border)', alignItems:'center' }}>
          <div style={{ width:32, height:32, borderRadius:'var(--r2)', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name={a.icon} size={14} />
          </div>
          <div>
            <div style={{ fontWeight:600 }}>{t(a.text, a.textAr)}</div>
            <div className="muted" style={{ fontSize:10 }}>{new Date(a.ts).toLocaleString()}</div>
          </div>
          <div style={{ fontSize:10, color:'var(--tx3)' }}>IP 10.0.0.42</div>
        </div>
      ))}
    </div>
  )
}

function CoursesTab({ assignments, courses }) {
  const { t } = useApp()
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th>{t('Course', 'الدورة')}</th>
          <th>{t('Status', 'الحالة')}</th>
          <th>{t('Progress', 'التقدم')}</th>
          <th>{t('Score', 'الدرجة')}</th>
          <th>{t('Completed', 'تاريخ الإنجاز')}</th>
        </tr>
      </thead>
      <tbody>
        {assignments.map((a) => {
          const c = courses.find((x) => x.id === a.courseId)
          if (!c) return null
          const variant = a.status === 'completed' ? 'green' : a.status === 'in-progress' ? 'blue' : a.status === 'overdue' ? 'red' : 'gray'
          return (
            <tr key={a.id}>
              <td>{t(c.title, c.titleAr)}</td>
              <td><Pill variant={variant}>{a.status}</Pill></td>
              <td style={{ minWidth: 140 }}><ProgressBar pct={a.progress} /></td>
              <td>{a.finalScore != null ? `${a.finalScore}%` : '—'}</td>
              <td>{a.completedAt || '—'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function PerformanceTab({ learningIndex, band }) {
  const { t } = useApp()
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom: 16 }}>
        <div className="card-tight" style={{ background:'var(--bg)', borderRadius:'var(--r3)', padding:14 }}>
          <div style={{ fontSize:9, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.3px' }}>
            {t('Learning Index', 'مؤشر التعلم')}
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: `var(--${band})`, lineHeight: 1, marginTop: 6 }}>
            {learningIndex}
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
            {t('40% score · 20% completion · 15% deadlines · 15% engagement · 10% roleplay',
               '40٪ الدرجة · 20٪ الإنجاز · 15٪ المواعيد · 15٪ المشاركة · 10٪ المحاكاة')}
          </div>
        </div>
        <div className="card-tight" style={{ background:'var(--bg)', borderRadius:'var(--r3)', padding:14 }}>
          <div style={{ fontSize:9, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.3px' }}>
            {t('Hours per week (last 12 weeks)', 'الساعات أسبوعيًا (آخر 12 أسبوعًا)')}
          </div>
          <LineChart data={mockHoursPerWeek} />
        </div>
      </div>

      <div className="card-tight" style={{ background:'var(--bg)', borderRadius:'var(--r3)', padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize:9, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.3px', marginBottom: 8 }}>
          {t('Final scores per course (last 12)', 'الدرجات النهائية لكل دورة (آخر 12)')}
        </div>
        <BarChart data={mockScores.map((s) => ({ label: t(s.course, s.courseAr), value: s.score }))} />
      </div>

      <div className="card-tight" style={{ background:'var(--bg)', borderRadius:'var(--r3)', padding: 14 }}>
        <div style={{ fontSize:9, color:'var(--tx3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.3px', marginBottom: 8 }}>
          {t('Daily activity — last 90 days', 'النشاط اليومي — آخر 90 يومًا')}
        </div>
        <div className="heatmap" style={{ gridTemplateColumns: `repeat(${Math.ceil(mockHeatmap.length / 7)}, 1fr)` }}>
          {mockHeatmap.map((lvl, i) => (
            <div key={i} className={`cell ${lvl ? `l${lvl}` : ''}`} title={`Day -${mockHeatmap.length - i}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ComplianceTab({ certs, courses }) {
  const { t, logAction } = useApp()
  return (
    <div>
      <h3>{t('Mandatory certifications', 'الشهادات الإلزامية')}</h3>
      <table className="tbl">
        <thead>
          <tr>
            <th>{t('Course', 'الدورة')}</th>
            <th>{t('Issued', 'أُصدرت')}</th>
            <th>{t('Expires', 'تنتهي')}</th>
            <th>{t('Status', 'الحالة')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {certs.map((c) => {
            const course = courses.find((x) => x.id === c.courseId)
            const variant = c.status === 'active' ? 'green' : c.status === 'expiring' ? 'amber' : c.status === 'expired' ? 'red' : 'gray'
            return (
              <tr key={c.id}>
                <td>{course ? t(course.title, course.titleAr) : c.courseId}</td>
                <td>{c.issuedAt}</td>
                <td>{c.expiresAt}</td>
                <td><Pill variant={variant}>{c.status}</Pill></td>
                <td><button className="btn sm" onClick={() => logAction('cert_viewed', c.id)}>{t('Open', 'فتح')}</button></td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <h3 style={{ marginTop: 18 }}>{t('E-signature audit trail', 'سجل التوقيعات الإلكترونية')}</h3>
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <ESigRow when="2026-04-25 14:31" what="PV & AE Reporting v3.0.0" ip="10.0.0.42" />
        <ESigRow when="2026-04-26 11:08" what="Diabetes 101 microlearning" ip="10.0.0.42" />
        <ESigRow when="2026-03-15 09:14" what="KEYNORX v2.0.0 (superseded)" ip="10.0.0.42" />
      </div>
    </div>
  )
}

function ESigRow({ when, what, ip }) {
  const { t } = useApp()
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:12, padding:'10px 0', borderTop:'1px solid var(--border)', alignItems:'center' }}>
      <div>
        <div style={{ fontWeight: 600 }}>{what}</div>
        <div className="muted" style={{ fontSize: 11 }}>{t('"I confirm I have completed this training"', '"أؤكد أنني أكملت هذا التدريب"')}</div>
      </div>
      <div className="muted" style={{ fontSize: 11 }}>{when}</div>
      <Pill variant="green">IP {ip}</Pill>
    </div>
  )
}

function BarChart({ data }) {
  const max = 100
  return (
    <svg viewBox={`0 0 ${data.length * 50} 140`} width="100%" height="140" style={{ display:'block' }}>
      {data.map((d, i) => {
        const x = i * 50 + 8
        const h = (d.value / max) * 100
        const color = d.value === 0 ? '#CBD1E1' : d.value >= 85 ? '#16A34A' : d.value >= 70 ? '#2563EB' : '#D97706'
        return (
          <g key={i}>
            <rect x={x} y={120 - h} width="34" height={h || 0} rx="3" fill={color} />
            <text x={x + 17} y={135} fontSize="8" fill="#5A6380" textAnchor="middle">{d.label.slice(0, 8)}</text>
            {d.value > 0 && <text x={x + 17} y={117 - h} fontSize="9" fill="#1A1D2E" textAnchor="middle" fontWeight="700">{d.value}</text>}
          </g>
        )
      })}
    </svg>
  )
}

function LineChart({ data }) {
  const max = Math.max(...data, 10)
  const w = 280, h = 90
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * (h - 10) - 4
    return `${x},${y}`
  }).join(' ')
  const lastX = w
  const lastY = h - (data[data.length - 1] / max) * (h - 10) - 4
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display:'block', marginTop: 8 }}>
      <polyline points={pts} fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="4" fill="#2563EB" stroke="white" strokeWidth="2" />
      <text x={lastX - 6} y={lastY - 8} fontSize="10" textAnchor="end" fontWeight="700" fill="#1D4ED8">{data[data.length - 1]}h</text>
    </svg>
  )
}
