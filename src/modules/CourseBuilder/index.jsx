import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Icon from '../../components/Icon.jsx'
import ContentTab from './ContentTab.jsx'
import AssessmentTab from './AssessmentTab.jsx'
import AssignmentTab from './AssignmentTab.jsx'
import AIAuthor from './AIAuthor.jsx'

const TABS = [
  { id: 'content',    en: 'Content',    ar: 'المحتوى',     icon: 'book' },
  { id: 'assessment', en: 'Assessment', ar: 'التقييم',     icon: 'check' },
  { id: 'assignment', en: 'Assignment', ar: 'التعيين',     icon: 'users' },
  { id: 'ai',         en: 'AI Author',  ar: 'مؤلف الذكاء',  icon: 'sparkle' },
]

const DEFAULT_DRAFT = {
  title: 'KEYNORX — Adverse Events Update',
  titleAr: 'كاينوركس — تحديث الآثار الجانبية',
  description: '',
  descriptionAr: '',
  type: 'video',
  therapyArea: 'Oncology',
  product: 'KEYNORX',
  version: 'v2.1.1',
  durationMin: 15,
  passMark: 85,
  attemptsAllowed: 3,
  mandatory: true,
  language: 'both',
  targetRoles: ['rep-oncology'],
  tags: ['safety-update'],
  validFrom: '2026-05-15',
  validUntil: '2027-05-15',
  modules: [
    { id: 'm1', title: 'New AE profile (rev. v2.1.1)', titleAr: 'الآثار الجانبية الجديدة', mins: 5 },
    { id: 'm2', title: 'Reporting workflow',           titleAr: 'سير الإبلاغ',              mins: 5 },
    { id: 'm3', title: 'Mini-quiz',                    titleAr: 'اختبار قصير',              mins: 5 },
  ],
  questions: [],
}

export default function CourseBuilder() {
  const { t, logAction, addCourse, updateCourse, goto, courses, editingCourseId, setEditingCourseId } = useApp()
  const [tab, setTab] = useState('content')
  const [savedToast, setSavedToast] = useState(null)

  // If admin clicked Edit on a catalog card, load that course into the draft.
  // Otherwise start from the demo defaults.
  const initialDraft = (() => {
    if (editingCourseId) {
      const existing = courses.find((c) => c.id === editingCourseId)
      if (existing) {
        return {
          ...DEFAULT_DRAFT,
          ...existing,
          modules: existing.modules || DEFAULT_DRAFT.modules,
          questions: existing.questions || [],
        }
      }
    }
    return DEFAULT_DRAFT
  })()
  const [draft, setDraft] = useState(initialDraft)

  // When the admin navigates away or saves, clear the editing pointer.
  useEffect(() => () => setEditingCourseId(null), [])

  const isEditing = Boolean(editingCourseId)

  // Build the course payload from the current draft. Used by both Save
  // draft (status='draft') and Publish (status='active').
  const buildPayload = (status) => ({
    title: draft.title,
    titleAr: draft.titleAr,
    description: draft.description,
    descriptionAr: draft.descriptionAr,
    type: draft.type,
    contentUrl: draft.contentUrl,
    youtubeId: draft.youtubeId,
    contentFilename: draft.contentFilename,
    contentSize: draft.contentSize,
    therapyArea: draft.therapyArea,
    product: draft.product,
    version: draft.version,
    validFrom: draft.validFrom,
    validUntil: draft.validUntil,
    durationMin: draft.durationMin,
    passMark: draft.passMark,
    attemptsAllowed: draft.attemptsAllowed,
    mandatory: draft.mandatory,
    language: draft.language,
    targetRoles: draft.targetRoles,
    tags: draft.tags,
    questions: (draft.questions || []).filter((q) => q.status !== 'pending-review'),
    status,
  })

  const showSavedToast = (msg) => {
    setSavedToast(msg)
    setTimeout(() => setSavedToast(null), 2400)
  }

  // Save draft — no validation (other than a title), so the user can park
  // partial edits without losing them. If editing an existing course, the
  // record updates in place; otherwise a new one is created with status
  // 'draft' so it doesn't pollute the live catalog.
  const handleSaveDraft = () => {
    if (!draft.title) {
      alert(t('Add a title before saving.', 'أضف عنوانًا قبل الحفظ.'))
      return
    }
    if (isEditing) {
      const updated = updateCourse(editingCourseId, buildPayload(draft.status || 'active'))
      if (updated) {
        logAction('course_updated', updated.id, { title: updated.title, version: updated.version })
        showSavedToast(t('Draft saved', 'تم حفظ المسودة'))
      }
    } else {
      const created = addCourse(buildPayload('draft'))
      logAction('course_uploaded', created.id, { title: created.title, status: 'draft' })
      setEditingCourseId(created.id)  // continue editing the same record
      showSavedToast(t('Draft saved — keep editing or click Publish', 'تم حفظ المسودة — تابع التحرير أو اضغط نشر'))
    }
  }

  // Publish — full validation, then activate. Updates in place when editing.
  const handleSave = () => {
    if (!draft.title) {
      alert(t('Add a title before publishing.', 'أضف عنوانًا قبل النشر.'))
      return
    }
    if (!draft.contentUrl) {
      alert(t('Add a content source (file, YouTube link, or SCORM package) before publishing.',
              'أضف مصدر المحتوى (ملف، رابط يوتيوب، أو حزمة SCORM) قبل النشر.'))
      return
    }
    if (isEditing) {
      const updated = updateCourse(editingCourseId, buildPayload('active'))
      logAction('course_updated', editingCourseId, {
        title: updated?.title,
        type: updated?.type,
        version: updated?.version,
        questionCount: updated?.questions?.length || 0,
      })
    } else {
      const created = addCourse(buildPayload('active'))
      logAction('course_uploaded', created.id, {
        title: created.title,
        type: created.type,
        version: created.version,
        questionCount: created.questions?.length || 0,
      })
    }
    goto('catalog')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{isEditing
            ? t(`Editing — ${draft.title}`, `تحرير — ${draft.titleAr || draft.title}`)
            : t('Course builder', 'منشئ الدورات')}
          </h1>
          <div className="subtitle">{isEditing
            ? t('Update fields, content, or assessment. Publishing creates a new course version.',
                'حدّث الحقول والمحتوى أو الاختبار. النشر ينتج إصدارًا جديدًا.')
            : t('Edit content, configure exams, target roles, or generate from a PDF.',
                'حرر المحتوى، اضبط الاختبارات، استهدف الأدوار، أو أنشئ من PDF.')}</div>
        </div>
        <div className="row">
          {isEditing && (
            <button className="btn" onClick={() => { setEditingCourseId(null); goto('catalog') }}>
              <Icon name="arrowL" size={14} /> &nbsp; {t('Cancel edit', 'إلغاء')}
            </button>
          )}
          <button className="btn" onClick={handleSaveDraft}>{t('Save draft', 'حفظ المسودة')}</button>
          <button className="btn primary" onClick={handleSave}>
            <Icon name="upload" size={14} /> &nbsp;
            {isEditing
              ? t(`Publish ${draft.version || 'v1.0.0'}`, `نشر ${draft.version || 'v1.0.0'}`)
              : t('Publish', 'نشر')}
          </button>
        </div>
      </div>

      {savedToast && (
        <div className="fade-in" style={{
          position: 'fixed', bottom: 28, insetInlineEnd: 28,
          background: '#DCFCE7', color: '#15803D',
          border: '1px solid #86EFAC',
          padding: '12px 16px', borderRadius: 'var(--r3)',
          fontWeight: 600, fontSize: 13, zIndex: 60,
          boxShadow: '0 8px 24px rgba(0,0,0,.14)',
          maxWidth: 360,
        }}>
          {savedToast}
        </div>
      )}

      <div className="card">
        <div className="tabs">
          {TABS.map((tt) => (
            <button key={tt.id} className={`tab ${tab === tt.id ? 'active' : ''}`} onClick={() => setTab(tt.id)}>
              <Icon name={tt.icon} size={12} /> &nbsp; {t(tt.en, tt.ar)}
            </button>
          ))}
        </div>
        {tab === 'content'    && <ContentTab    draft={draft} setDraft={setDraft} />}
        {tab === 'assessment' && <AssessmentTab draft={draft} setDraft={setDraft} />}
        {tab === 'assignment' && <AssignmentTab draft={draft} />}
        {tab === 'ai'         && <AIAuthor      draft={draft} setDraft={setDraft} />}
      </div>
    </>
  )
}
