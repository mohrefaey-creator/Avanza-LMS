import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Pill from '../../components/Pill.jsx'
import Icon from '../../components/Icon.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import QuickAssignModal from './QuickAssignModal.jsx'

export default function CourseDetail() {
  const { t, courses, selectedCourse, setSelectedCourse, setEditingCourseId, role, goto, setModule, assignments, enrollInCourse, user, logAction } = useApp()
  const course = courses.find((c) => c.id === selectedCourse)
  const [showAssign, setShowAssign] = useState(false)
  const [toast, setToast] = useState(null)
  if (!course) return null

  const myAssignment = assignments.find((a) => a.courseId === course.id && a.userId === user?.id)

  const flash = (msg, variant = 'green') => {
    setToast({ msg, variant })
    setTimeout(() => setToast(null), 2800)
  }
  const handleEdit = () => {
    setEditingCourseId(course.id)
    goto('builder')
    logAction('course_edit_opened', course.id)
  }
  const handleEnroll = () => {
    const a = enrollInCourse(course.id, { source: 'self-enrolled', deadlineDays: 30 })
    logAction('self_enrolled', course.id, { assignmentId: a?.id })
    flash(t('Added to your plan · 30-day deadline', 'تمت الإضافة إلى خطتك · مهلة 30 يومًا'))
  }
  const handleOpenInPlayer = () => {
    if (!myAssignment) enrollInCourse(course.id, { source: 'self-enrolled', deadlineDays: 30 })
    setModule('my-courses')
  }

  const sections = [
    { en: 'Mechanism of Action',     ar: 'آلية العمل',          mins: 12 },
    { en: 'Clinical Evidence Pack',  ar: 'حزمة الأدلة السريرية', mins: 18 },
    { en: 'Dosing & Titration',      ar: 'الجرعات والمعايرة',   mins: 9 },
    { en: 'Adverse Events Profile',  ar: 'الآثار الجانبية',       mins: 10 },
    { en: 'Selling Skills Workshop', ar: 'ورشة مهارات البيع',   mins: 16 },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <button className="btn ghost" style={{ paddingLeft:0 }} onClick={() => setSelectedCourse(null)}>
            <Icon name="arrowL" size={14} /> &nbsp; {t('Back to catalog', 'العودة للكتالوج')}
          </button>
          <h1 style={{ marginTop: 8 }}>{t(course.title, course.titleAr)}</h1>
          <div className="subtitle">
            {course.therapyArea} · {course.product} · v{course.version}
          </div>
        </div>
        <div className="row">
          {role === 'admin' && (
            <>
              <button className="btn" onClick={handleEdit}>
                <Icon name="edit" size={14} /> &nbsp; {t('Edit', 'تعديل')}
              </button>
              <button className="btn primary" onClick={() => setShowAssign(true)}>
                <Icon name="check" size={14} /> &nbsp; {t('Assign', 'تعيين')}
              </button>
            </>
          )}
          {role === 'manager' && (
            <button className="btn primary" onClick={() => setShowAssign(true)}>
              <Icon name="check" size={14} /> &nbsp; {t('Assign to team', 'تعيين للفريق')}
            </button>
          )}
          {role === 'learner' && (
            <>
              {!myAssignment && (
                <button className="btn" onClick={handleEnroll}>
                  <Icon name="plus" size={14} /> &nbsp; {t('Add to my plan', 'أضف إلى خطتي')}
                </button>
              )}
              <button className="btn primary" onClick={handleOpenInPlayer}>
                <Icon name="play" size={14} /> &nbsp;
                {myAssignment ? t('Open in player', 'افتح في المشغل') : t('Start course', 'ابدأ الدورة')}
              </button>
            </>
          )}
          {role === 'auditor' && (
            <Pill variant="gray">{t('Read-only', 'للعرض فقط')}</Pill>
          )}
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
            <Pill variant="blue">{course.type.toUpperCase()}</Pill>
            {course.mandatory && <Pill variant="purple">{t('Mandatory', 'إلزامي')}</Pill>}
            <Pill variant="teal">{course.therapyArea}</Pill>
            <Pill variant="gray">{course.language === 'both' ? 'EN / AR' : course.language.toUpperCase()}</Pill>
          </div>
          <p style={{ lineHeight: 1.55 }}>{t(course.description, course.descriptionAr)}</p>

          <h3 style={{ marginTop:18 }}>{t('Modules', 'الوحدات')}</h3>
          <div>
            {sections.map((s, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'24px 1fr auto auto', gap:10, padding:'10px 0', borderTop:'1px solid var(--border)', alignItems:'center' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--tx2)' }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight:600 }}>{t(s.en, s.ar)}</div>
                  <div className="muted" style={{ fontSize:11 }}>{s.mins} {t('min', 'دقيقة')} · {course.type}</div>
                </div>
                {myAssignment && i < Math.floor(sections.length * (myAssignment.progress / 100))
                  ? <Pill variant="green">{t('Done', 'تم')}</Pill>
                  : <Pill variant="gray">{t('Open', 'متاحة')}</Pill>
                }
                <button className="btn sm" onClick={() => goto('my-courses')}><Icon name="play" size={12} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>{t('Course details', 'تفاصيل الدورة')}</h3>
          <div className="kv-list">
            <KV label={t('Type', 'النوع')} value={course.type.toUpperCase()} />
            <KV label={t('Pass mark', 'علامة النجاح')} value={`${course.passMark}%`} />
            <KV label={t('Attempts', 'المحاولات')} value={course.attemptsAllowed} />
            <KV label={t('Duration', 'المدة')} value={`${course.durationMin} ${t('min', 'دقيقة')}`} />
            <KV label={t('Valid from', 'صالحة من')} value={course.validFrom} />
            <KV label={t('Valid until', 'صالحة حتى')} value={course.validUntil} />
            <KV label={t('Roles', 'الأدوار')} value={course.targetRoles.join(', ')} />
            <KV label={t('Tags', 'الوسوم')} value={course.tags.join(' · ')} />
          </div>

          {myAssignment && (
            <div className="mt-16">
              <h3>{t('My progress', 'تقدمي')}</h3>
              <ProgressBar pct={myAssignment.progress} />
              <div className="muted mt-12" style={{ fontSize:11 }}>
                {t(`${myAssignment.progress}% complete · ${myAssignment.attempts} of ${course.attemptsAllowed} attempts used`,
                   `${myAssignment.progress}% مكتمل · ${myAssignment.attempts} من ${course.attemptsAllowed} محاولات`)}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAssign && (
        <QuickAssignModal
          course={course}
          onClose={(result) => {
            setShowAssign(false)
            if (result && result.count) {
              flash(t(`Assigned to ${result.count} user${result.count === 1 ? '' : 's'}`,
                      `تم التعيين لـ ${result.count} مستخدمين`))
            }
          }}
        />
      )}

      {toast && (
        <div className="fade-in" style={{
          position: 'fixed', bottom: 28, insetInlineEnd: 28,
          background: toast.variant === 'amber' ? '#FEF3C7' : '#DCFCE7',
          color:      toast.variant === 'amber' ? '#B45309' : '#15803D',
          border: `1px solid ${toast.variant === 'amber' ? '#FCD34D' : '#86EFAC'}`,
          padding: '12px 16px', borderRadius: 'var(--r3)',
          fontWeight: 600, fontSize: 13, zIndex: 60,
          boxShadow: '0 8px 24px rgba(0,0,0,.14)',
          maxWidth: 360,
        }}>
          {toast.msg}
        </div>
      )}
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
