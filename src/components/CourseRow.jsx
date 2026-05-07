import { useApp } from '../context/AppContext.jsx'
import Pill from './Pill.jsx'
import ProgressBar from './ProgressBar.jsx'

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

export default function CourseRow({ course, assignment }) {
  const { t, setSelectedCourse, setModule, logAction } = useApp()
  const type = TYPE_PILL[course.type] || TYPE_PILL.scorm

  const dueLabel = (() => {
    if (!assignment) return null
    if (assignment.status === 'completed') {
      return <Pill variant="green">{t('Completed', 'مكتمل')}</Pill>
    }
    const days = Math.ceil((new Date(assignment.dueAt) - new Date('2026-05-06')) / (86400000))
    if (days < 0) return <Pill variant="red">{t('Overdue', 'متأخر')}</Pill>
    if (days <= 3) return <Pill variant="red">{t(`Due in ${days}d`, `بعد ${days} أيام`)}</Pill>
    if (days <= 7) return <Pill variant="amber">{t(`Due in ${days}d`, `بعد ${days} أيام`)}</Pill>
    return <Pill variant="blue">{t(`Due in ${days}d`, `بعد ${days} يوم`)}</Pill>
  })()

  const cta = (() => {
    if (!assignment) return t('View', 'عرض')
    if (assignment.status === 'completed') return t('Cert', 'شهادة')
    if (assignment.status === 'in-progress') return t('Resume', 'استكمال')
    return t('Start', 'بدء')
  })()

  const handleClick = () => {
    setSelectedCourse(course.id)
    setModule('my-courses')
    logAction(assignment?.status === 'completed' ? 'cert_viewed' : 'course_opened', course.id)
  }

  return (
    <div className="course-row">
      <div>
        <div className="pills">
          <Pill variant={type.variant}>{t(type.en, type.ar)}</Pill>
          {course.mandatory && <Pill variant="purple">{t('Mandatory', 'إلزامي')}</Pill>}
          {dueLabel}
        </div>
        <div className="title">{t(course.title, course.titleAr || course.title)}</div>
        {assignment && (
          <>
            <div style={{ marginTop: 6, marginBottom: 4, maxWidth: 460 }}>
              <ProgressBar pct={assignment.progress} />
            </div>
            <div className="meta">
              {assignment.status === 'completed'
                ? t(`Final score ${assignment.finalScore}%${assignment.certificateId ? ' · Certificate available' : ''}`,
                    `الدرجة النهائية ${assignment.finalScore}%${assignment.certificateId ? ' · شهادة متاحة' : ''}`)
                : t(`${assignment.progress}% · Pass mark ${course.passMark}% · ${course.durationMin} min`,
                    `${assignment.progress}% · علامة النجاح ${course.passMark}% · ${course.durationMin} دقيقة`)}
            </div>
          </>
        )}
        {!assignment && (
          <div className="meta">
            {course.therapyArea} · {course.product} · v{course.version} · {course.durationMin} {t('min', 'دقيقة')}
          </div>
        )}
      </div>
      <button className="btn primary" onClick={handleClick}>{cta}</button>
    </div>
  )
}
