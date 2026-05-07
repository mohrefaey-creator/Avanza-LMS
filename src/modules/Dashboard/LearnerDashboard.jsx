import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import StatCard from '../../components/StatCard.jsx'
import CourseRow from '../../components/CourseRow.jsx'
import Pill from '../../components/Pill.jsx'
import Icon from '../../components/Icon.jsx'

export default function LearnerDashboard({ mode }) {
  const { t, user, role, courses, assignments, enrollInCourse, setSelectedCourse, setModule, goto, logAction } = useApp()
  const [toast, setToast] = useState(null)
  const showToast = (msg, variant = 'green') => {
    setToast({ msg, variant })
    setTimeout(() => setToast(null), 2800)
  }

  const handleMicrolearning = () => {
    const micro = courses.find((c) => c.type === 'microlearning' && c.status === 'active')
    if (!micro) {
      showToast(t('No microlearning module is available right now.', 'لا توجد وحدة مصغّرة متاحة الآن.'), 'amber')
      return
    }
    enrollInCourse(micro.id, { source: 'microlearning-burst', deadlineDays: 1 })
    setSelectedCourse(micro.id)
    setModule('my-courses')
    logAction('microlearning_started', micro.id)
  }

  const handleAddToPlan = (courseId) => {
    const c = courses.find((x) => x.id === courseId)
    if (!c) return
    const a = enrollInCourse(courseId, { source: 'self-enrolled', deadlineDays: 30 })
    logAction('self_enrolled', courseId, { assignmentId: a?.id })
    showToast(t(`Added "${c.title}" to your plan · 30-day deadline`, `تمت إضافة "${c.titleAr || c.title}" إلى خطتك`))
  }

  const myAssignments = assignments.filter((a) => a.userId === user?.id)
  const completedCount = myAssignments.filter((a) => a.status === 'completed').length
  const totalCount = myAssignments.length
  const completion = Math.round((completedCount / Math.max(1, totalCount)) * 100)
  const finishedScores = myAssignments.filter((a) => a.finalScore != null).map((a) => a.finalScore)
  const avgScore = finishedScores.length
    ? Math.round(finishedScores.reduce((s, n) => s + n, 0) / finishedScores.length)
    : 0
  const hours = 42
  const streak = 12

  const sorted = [...myAssignments].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (b.status === 'completed' && a.status !== 'completed') return -1
    return new Date(a.dueAt) - new Date(b.dueAt)
  })

  const recommended = courses.filter((c) =>
    !myAssignments.find((a) => a.courseId === c.id) && c.status === 'active'
  ).slice(0, 3)

  const scoreColor =
    avgScore >= 85 ? 'var(--green)' :
    avgScore >= 70 ? 'var(--amb)' :
    avgScore > 0   ? 'var(--red)'  : 'var(--tx3)'

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t(mode === 'courses' ? 'My courses' : `Welcome, ${user?.name?.split(' ')[0]}`,
                 mode === 'courses' ? 'دوراتي' : `أهلًا، ${user?.nameAr?.split(' ')[0] || user?.name?.split(' ')[0]}`)}</h1>
          <div className="subtitle">
            {t(`Today is ${new Date('2026-05-06').toDateString()} · ${myAssignments.filter(a => a.status !== 'completed').length} active assignments`,
               `اليوم ${new Date('2026-05-06').toDateString()} · ${myAssignments.filter(a => a.status !== 'completed').length} مهمة نشطة`)}
          </div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => goto('catalog')}><Icon name="search" size={14} /> &nbsp; {t('Browse catalog', 'تصفح الكتالوج')}</button>
          {role === 'learner' && (
            <button className="btn primary" onClick={() => goto('roleplay')}><Icon name="message" size={14} /> &nbsp; {t('Practice roleplay', 'تدريب محاكاة')}</button>
          )}
        </div>
      </div>

      {mode !== 'courses' && (
        <>
          <div className="stat-grid">
            <StatCard label={t('Completion', 'الإنجاز')} value={`${completion}%`} subtitle={t(`${completedCount} of ${totalCount} courses`, `${completedCount} من ${totalCount}`)} icon="pulse" iconBg="var(--blue-l)" iconColor="var(--blue-d)" valueColor="var(--blue-d)" />
            <StatCard label={t('Average score', 'متوسط الدرجة')} value={avgScore ? `${avgScore}%` : '—'} subtitle={t(avgScore >= 85 ? 'Excellent' : avgScore >= 70 ? 'On target' : 'Below target', avgScore >= 85 ? 'ممتاز' : avgScore >= 70 ? 'ضمن الهدف' : 'دون الهدف')} icon="award" iconBg="var(--green-l)" iconColor="var(--green)" valueColor={scoreColor} />
            <StatCard label={t('Hours', 'الساعات')} value={hours} subtitle={t('Last 30 days', 'آخر 30 يومًا')} icon="clock" iconBg="var(--blue-l)" iconColor="var(--blue-d)" />
            <StatCard label={t('Streak', 'سلسلة الأيام')} value={streak} subtitle={t('Days in a row', 'أيام متتالية')} icon="flame" iconBg="var(--amb-l)" iconColor="var(--amb)" valueColor="var(--amb)"
              extra={streak >= 7 ? <Icon name="flame" size={16} color="#D97706" /> : null} />
          </div>

          <div className="card mb-16" style={{ background:'linear-gradient(135deg, var(--blue-l) 0%, #fff 70%)', border:'1px solid var(--blue-m)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
              <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                <div style={{ width:44, height:44, background:'var(--blue)', color:'white', borderRadius:'var(--r2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name="zap" size={22} />
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700 }}>{t("Today's microlearning burst", 'الجلسة المصغرة اليوم')}</div>
                  <div style={{ fontSize:11, color:'var(--tx2)' }}>{t('5 min · ARNI dosing refresher · +25 streak points', '٥ دقائق · تجديد جرعات ARNI · +25 نقطة')}</div>
                </div>
              </div>
              <button className="btn primary" onClick={handleMicrolearning}>{t('Start now', 'ابدأ الآن')}</button>
            </div>
          </div>
        </>
      )}

      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h2 style={{ margin:0 }}>{t('Assigned courses', 'الدورات المسندة')}</h2>
          <span className="muted" style={{ fontSize:11 }}>
            {t(`${myAssignments.filter(a => a.status !== 'completed').length} active · ${completedCount} completed`,
               `${myAssignments.filter(a => a.status !== 'completed').length} نشطة · ${completedCount} مكتملة`)}
          </span>
        </div>
        <div className="mt-12">
          {sorted.length === 0 && (
            <div className="empty-state">
              <div className="ico"><Icon name="book" size={22} /></div>
              <h4>{t('No assignments yet', 'لا توجد مهام بعد')}</h4>
              <p>{t('Browse the catalog to get started.', 'تصفح الكتالوج للبدء.')}</p>
            </div>
          )}
          {sorted.map((a) => {
            const course = courses.find((c) => c.id === a.courseId)
            if (!course) return null
            return <CourseRow key={a.id} course={course} assignment={a} />
          })}
        </div>
      </div>

      {mode !== 'courses' && (
        <div className="card mt-16">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <h2 style={{ margin:0 }}>{t('Recommended for you', 'موصى به لك')}</h2>
            <Pill variant="purple"><Icon name="sparkle" size={10} />&nbsp; AI</Pill>
          </div>
          <div className="mt-12" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
            {recommended.map((c) => (
              <div key={c.id} style={{ border:'1px solid var(--border)', borderRadius:'var(--r3)', padding:'12px' }}>
                <Pill variant="teal">{c.therapyArea}</Pill>
                <div style={{ fontWeight:700, marginTop:8 }}>{t(c.title, c.titleAr)}</div>
                <div className="muted" style={{ fontSize:11, marginTop:4 }}>
                  {c.durationMin} {t('min', 'دقيقة')} · {t(`Pass mark ${c.passMark}%`, `النجاح ${c.passMark}%`)}
                </div>
                <button className="btn ghost mt-12" style={{ paddingLeft:0 }} onClick={() => handleAddToPlan(c.id)}>
                  {t('Add to my plan →', 'أضفها إلى خطتي →')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div className="fade-in" style={{
          position: 'fixed', bottom: 28, insetInlineEnd: 28,
          background: toast.variant === 'amber' ? '#FEF3C7' : '#DCFCE7',
          color: toast.variant === 'amber' ? '#B45309' : '#15803D',
          border: `1px solid ${toast.variant === 'amber' ? '#FCD34D' : '#86EFAC'}`,
          padding: '12px 16px', borderRadius: 'var(--r3)',
          fontWeight: 600, fontSize: 13, zIndex: 60,
          boxShadow: '0 8px 24px rgba(0,0,0,.14)',
        }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}
