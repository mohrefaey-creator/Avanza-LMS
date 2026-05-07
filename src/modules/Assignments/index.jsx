import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Pill from '../../components/Pill.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import Icon from '../../components/Icon.jsx'
import NewPathModal from './NewPathModal.jsx'

export default function Assignments() {
  const { t, learningPaths, courses, assignments, users } = useApp()
  const [showNew, setShowNew] = useState(false)
  const [createdBanner, setCreatedBanner] = useState(null)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('Assignments & learning paths', 'المهام ومسارات التعلم')}</h1>
          <div className="subtitle">{t('Define paths, sequence, deadlines, and auto-assign rules.',
                                       'حدد المسارات، التسلسل، المواعيد، وقواعد التعيين التلقائي.')}</div>
        </div>
        <button className="btn primary" onClick={() => setShowNew(true)}>
          <Icon name="plus" size={14} /> &nbsp; {t('New path', 'مسار جديد')}
        </button>
      </div>

      {createdBanner && (
        <div className="card mb-12" style={{ background: 'var(--green-l)', borderColor: 'var(--green-m)' }}>
          <div className="row" style={{ alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#15803D' }}>
                {t(`Path "${createdBanner.name}" created`, `تم إنشاء المسار "${createdBanner.name}"`)}
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                {createdBanner.courses.length} {t('courses · ', 'دورات · ')}
                {createdBanner.targetRoles.length} {t('roles', 'أدوار')}
                {createdBanner.autoAssignTriggers.length > 0 && <> · {createdBanner.autoAssignTriggers.length} {t('triggers active', 'محفّزات نشطة')}</>}
              </div>
            </div>
            <button className="icon-btn" onClick={() => setCreatedBanner(null)}><Icon name="x" size={14} /></button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 12 }}>
        {learningPaths.map((p) => (
          <div key={p.id} className="card">
            <div className="row mb-12" style={{ justifyContent:'space-between' }}>
              <div>
                <h2 style={{ margin:0 }}>{t(p.name, p.nameAr)}</h2>
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                  {p.targetRoles.join(', ')}
                </div>
              </div>
              <div className="row">
                {p.autoAssignTriggers.map((tr, i) => (
                  <Pill key={i} variant="purple">{tr.type}</Pill>
                ))}
              </div>
            </div>
            <div>
              {p.courses.map((cs, i) => {
                const c = courses.find((x) => x.id === cs.courseId)
                if (!c) return null
                return (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'24px 1fr auto auto', gap:10, padding:'10px 0', borderTop:'1px solid var(--border)', alignItems:'center' }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t(c.title, c.titleAr)}</div>
                      <div className="muted" style={{ fontSize: 11 }}>
                        {c.therapyArea} · v{c.version}{cs.prerequisite ? ` · ${t('after', 'بعد')} ${courses.find((x) => x.id === cs.prerequisite)?.title?.split(' ')[0]}` : ''}
                      </div>
                    </div>
                    <Pill variant={cs.passMark >= 85 ? 'red' : 'amber'}>{t(`Pass ${cs.passMark}%`, `النجاح ${cs.passMark}%`)}</Pill>
                    <Pill variant="blue">{cs.deadlineDays}d</Pill>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {showNew && (
        <NewPathModal onClose={(path) => {
          setShowNew(false)
          if (path) setCreatedBanner(path)
        }} />
      )}

      <div className="card mt-16">
        <h2>{t('All active assignments', 'كل التعيينات الحالية')}</h2>
        <table className="tbl">
          <thead>
            <tr>
              <th>{t('User', 'المستخدم')}</th>
              <th>{t('Course', 'الدورة')}</th>
              <th>{t('Source', 'المصدر')}</th>
              <th>{t('Due', 'الموعد')}</th>
              <th>{t('Progress', 'التقدم')}</th>
              <th>{t('Status', 'الحالة')}</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => {
              const u = users.find((x) => x.id === a.userId)
              const c = courses.find((x) => x.id === a.courseId)
              if (!u || !c) return null
              const variant = a.status === 'completed' ? 'green' : a.status === 'in-progress' ? 'blue' : a.status === 'overdue' ? 'red' : 'gray'
              return (
                <tr key={a.id}>
                  <td>{t(u.name, u.nameAr)}</td>
                  <td>{t(c.title, c.titleAr)}</td>
                  <td><Pill variant="purple">{a.source}</Pill></td>
                  <td>{a.dueAt}</td>
                  <td style={{ minWidth: 140 }}><ProgressBar pct={a.progress} /></td>
                  <td><Pill variant={variant}>{a.status}</Pill></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
