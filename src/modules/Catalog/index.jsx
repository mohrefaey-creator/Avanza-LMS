import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Pill from '../../components/Pill.jsx'
import Icon from '../../components/Icon.jsx'
import QuickAssignModal from './QuickAssignModal.jsx'
import { TRAINING_LIBRARY_ROLE_GROUPS } from '../../data/index.js'

const TYPE_PILL = {
  scorm:         { variant: 'blue',   en: 'SCORM',         ar: 'SCORM' },
  video:         { variant: 'amber',  en: 'Video',         ar: 'فيديو' },
  pdf:           { variant: 'red',    en: 'PDF',           ar: 'PDF' },
  microlearning: { variant: 'green',  en: 'Microlearning', ar: 'تعلم مصغر' },
  simulation:    { variant: 'purple', en: 'Simulation',    ar: 'محاكاة' },
  youtube:       { variant: 'red',    en: 'YouTube',       ar: 'يوتيوب' },
  ppt:           { variant: 'amber',  en: 'Slides',        ar: 'شرائح' },
  doc:           { variant: 'blue',   en: 'Document',      ar: 'مستند' },
  audio:         { variant: 'teal',   en: 'Audio',         ar: 'صوت' },
  file:          { variant: 'gray',   en: 'File',          ar: 'ملف' },
  'web-course':  { variant: 'purple', en: 'Web Course',    ar: 'دورة ويب' },
  'web-article': { variant: 'teal',   en: 'Web Article',   ar: 'مقالة ويب' },
}

export default function Catalog() {
  const { t, courses, role, user, assignments, setSelectedCourse, setEditingCourseId, setModule, enrollInCourse, goto, logAction } = useApp()
  const [q, setQ] = useState('')
  const [therapy, setTherapy] = useState('all')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('active')
  const [roleGroup, setRoleGroup] = useState('all')
  const [assignTarget, setAssignTarget] = useState(null)
  const [toast, setToast] = useState(null)

  const myAssignments = useMemo(
    () => new Set(assignments.filter((a) => a.userId === user?.id).map((a) => a.courseId)),
    [assignments, user?.id]
  )

  const showToast = (msg, variant = 'green') => {
    setToast({ msg, variant })
    setTimeout(() => setToast(null), 2800)
  }

  const handleEdit = (courseId) => {
    setEditingCourseId(courseId)
    goto('builder')
    logAction('course_edit_opened', courseId)
  }

  const handleEnroll = (course) => {
    const a = enrollInCourse(course.id, { source: 'self-enrolled', deadlineDays: 30 })
    logAction('self_enrolled', course.id, { assignmentId: a?.id })
    showToast(t(`Added "${course.title}" — opens in My Courses`, `تمت الإضافة "${course.titleAr || course.title}"`))
  }

  const handleOpenInPlayer = (course) => {
    setSelectedCourse(course.id)
    setModule('my-courses')
  }

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (status !== 'all' && c.status !== status) return false
      if (therapy !== 'all' && c.therapyArea !== therapy) return false
      if (type !== 'all' && c.type !== type) return false
      if (roleGroup === 'library' && !c.roleGroup) return false
      if (roleGroup !== 'all' && roleGroup !== 'library' && c.roleGroup !== roleGroup) return false
      if (q && !(c.title + c.titleAr + c.product + (c.provider || '')).toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
  }, [courses, q, therapy, type, status, roleGroup])

  const therapies = ['all', ...Array.from(new Set(courses.map((c) => c.therapyArea)))]
  const types = ['all', 'scorm', 'video', 'pdf', 'microlearning', 'simulation', 'youtube', 'ppt', 'doc', 'audio', 'file', 'web-course', 'web-article']

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('Course catalog', 'كتالوج الدورات')}</h1>
          <div className="subtitle">
            {t(`${filtered.length} of ${courses.length} courses · master directory governed by L&D`,
               `${filtered.length} من ${courses.length} دورة · الكتالوج الرئيسي يديره قسم التدريب`)}
          </div>
        </div>
        {role === 'admin' && (
          <button className="btn primary" onClick={() => goto('builder')}>
            <Icon name="plus" size={14} /> &nbsp; {t('New course', 'دورة جديدة')}
          </button>
        )}
      </div>

      <div className="card mb-16">
        <div className="row" style={{ gap: 8 }}>
          <input className="filter-input" style={{ flex: 1, minWidth: 180 }} placeholder={t('Search title or product', 'ابحث في العنوان أو المنتج')} value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="filter-input" value={therapy} onChange={(e) => setTherapy(e.target.value)}>
            {therapies.map((tt) => <option key={tt} value={tt}>{tt === 'all' ? t('All therapy areas', 'كل المجالات') : tt}</option>)}
          </select>
          <select className="filter-input" value={type} onChange={(e) => setType(e.target.value)}>
            {types.map((tt) => <option key={tt} value={tt}>{tt === 'all' ? t('All types', 'كل الأنواع') : t(TYPE_PILL[tt]?.en, TYPE_PILL[tt]?.ar)}</option>)}
          </select>
          <select className="filter-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">{t('Active', 'نشط')}</option>
            <option value="archived">{t('Archived', 'مؤرشف')}</option>
            <option value="all">{t('All statuses', 'كل الحالات')}</option>
          </select>
          <select className="filter-input" value={roleGroup} onChange={(e) => setRoleGroup(e.target.value)} title={t('Filter by curated role', 'تصفية حسب الدور')}>
            <option value="all">{t('All courses', 'كل الدورات')}</option>
            <option value="library">{t('Curated library (all roles)', 'المكتبة المختارة (كل الأدوار)')}</option>
            {Object.entries(TRAINING_LIBRARY_ROLE_GROUPS).map(([id, g]) => (
              <option key={id} value={id}>{g.code} — {t(g.en, g.ar)}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
        {filtered.map((c) => {
          const tp = TYPE_PILL[c.type] || TYPE_PILL.scorm
          const isLibrary = !!c.roleGroup
          const groupMeta = isLibrary ? TRAINING_LIBRARY_ROLE_GROUPS[c.roleGroup] : null
          return (
            <div key={c.id} className="card" style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <Pill variant={tp.variant}>{t(tp.en, tp.ar)}</Pill>
                {isLibrary && <Pill variant="blue">{t('Library', 'المكتبة')}</Pill>}
                {groupMeta && <Pill variant="gray">{groupMeta.code}</Pill>}
                {c.mandatory && <Pill variant="purple">{t('Mandatory', 'إلزامي')}</Pill>}
                {c.status === 'archived' && <Pill variant="gray">{t('Archived', 'مؤرشف')}</Pill>}
              </div>
              <div style={{ fontWeight:700, fontSize:14 }}>{t(c.title, c.titleAr || c.title)}</div>
              <div className="muted" style={{ fontSize:11, lineHeight:1.45 }}>{t(c.description, c.descriptionAr || c.description)}</div>
              {c.provider && (
                <div style={{ fontSize:11, color:'var(--tx2)' }}>
                  <strong>{t('Provider', 'المزود')}</strong>: {c.provider}
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, fontSize:11, color:'var(--tx2)', marginTop:4 }}>
                <div><strong>{t('Therapy', 'المجال')}</strong>: {c.therapyArea}</div>
                <div><strong>{t('Product', 'المنتج')}</strong>: {c.product}</div>
                <div><strong>{t('Version', 'الإصدار')}</strong>: {c.version}</div>
                <div><strong>{t('Duration', 'المدة')}</strong>: ~{c.durationMin} {t('min', 'دقيقة')}</div>
                <div><strong>{t('Pass', 'النجاح')}</strong>: {c.passMark}%</div>
                <div><strong>{t('Valid until', 'صالحة حتى')}</strong>: {c.validUntil}</div>
              </div>
              <div className="row" style={{ marginTop:'auto', gap:6, flexWrap: 'wrap' }}>
                <button className="btn" onClick={() => { setSelectedCourse(c.id); goto('catalog'); }}>{t('View', 'عرض')}</button>
                {c.externalUrl && (
                  <a className="btn" href={c.externalUrl} target="_blank" rel="noopener noreferrer" onClick={() => logAction('library_external_opened', c.id)}>
                    <Icon name="play" size={11} /> &nbsp; {t('Open source', 'افتح المصدر')}
                  </a>
                )}
                {role === 'admin' && (
                  <>
                    <button className="btn" onClick={() => handleEdit(c.id)}>
                      <Icon name="edit" size={11} /> &nbsp; {t('Edit', 'تعديل')}
                    </button>
                    <button className="btn primary" onClick={() => setAssignTarget(c)}>
                      <Icon name="check" size={11} /> &nbsp; {t('Assign', 'تعيين')}
                    </button>
                  </>
                )}
                {role === 'manager' && (
                  <button className="btn primary" onClick={() => setAssignTarget(c)}>
                    <Icon name="check" size={11} /> &nbsp; {t('Assign to team', 'تعيين للفريق')}
                  </button>
                )}
                {role === 'learner' && (
                  myAssignments.has(c.id)
                    ? <button className="btn primary" onClick={() => handleOpenInPlayer(c)}>
                        <Icon name="play" size={11} /> &nbsp; {t('Open in player', 'افتح في المشغل')}
                      </button>
                    : <button className="btn primary" onClick={() => handleEnroll(c)}>
                        <Icon name="plus" size={11} /> &nbsp; {t('Add to my plan', 'أضف إلى خطتي')}
                      </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="ico"><Icon name="book" size={22} /></div>
          <h4>{t('No courses match', 'لا توجد دورات مطابقة')}</h4>
          <p>{t('Adjust filters or upload a new course.', 'عدّل الفلاتر أو ارفع دورة جديدة.')}</p>
        </div>
      )}

      {assignTarget && (
        <QuickAssignModal
          course={assignTarget}
          onClose={(result) => {
            setAssignTarget(null)
            if (result && result.count) {
              showToast(t(`Assigned "${assignTarget.title}" to ${result.count} user${result.count === 1 ? '' : 's'}`,
                          `تم تعيين "${assignTarget.titleAr || assignTarget.title}" لـ${result.count} مستخدمين`))
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
