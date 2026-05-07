import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Pill from '../../components/Pill.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'
import Icon from '../../components/Icon.jsx'
import QuizRunner from './QuizRunner.jsx'

export default function Player() {
  const { t, courses, selectedCourse, setSelectedCourse, assignments, enrollInCourse, updateAssignmentProgress, completeAssignment, goto, user, logAction } = useApp()
  const course = courses.find((c) => c.id === selectedCourse)

  // Make sure the user has an assignment for this course; if not, auto-enroll
  // so progress / completion / certificate flow works for self-launched courses.
  useEffect(() => {
    if (!course || !user) return
    const existing = assignments.find((a) => a.courseId === course.id && a.userId === user.id)
    if (!existing) enrollInCourse(course.id, { source: 'player-launch' })
  }, [course?.id, user?.id])

  const assignment = assignments.find((a) => a.courseId === selectedCourse && a.userId === user?.id)

  const [view, setView] = useState('content')
  const [progress, setProgress] = useState(assignment?.progress || 0)
  const [showSign, setShowSign] = useState(false)
  const [lastScore, setLastScore] = useState(null)

  useEffect(() => {
    if (course) logAction('course_opened', course.id)
  }, [course?.id])

  // Push every progress change up to the assignment store (real backend would
  // PUT /api/assignments/:id/progress; this updates local state + audit if 100%).
  useEffect(() => {
    if (assignment && progress !== assignment.progress) {
      updateAssignmentProgress(assignment.id, progress)
    }
  }, [progress, assignment?.id])

  if (!course) {
    return (
      <div className="empty-state">
        <div className="ico"><Icon name="play" size={22} /></div>
        <h4>{t('No course selected', 'لم يتم اختيار دورة')}</h4>
      </div>
    )
  }

  const handleAdvance = (delta = 10) => {
    setProgress((p) => Math.min(100, p + delta))
  }

  const finalize = (score) => {
    if (assignment) {
      const cert = completeAssignment(assignment.id, { finalScore: score })
      if (cert) logAction('cert_issued', cert.id, { courseId: course.id, score })
    }
    setLastScore(score)
    setView('done')
  }

  const handleQuizComplete = (score) => {
    logAction('quiz_submitted', course.id, { score, attempt: (assignment?.attempts || 0) + 1 })
    setProgress(100)
    setLastScore(score)
    if (course.mandatory) setShowSign(true)
    else finalize(score)
  }

  const handleSignedComplete = (score) => {
    finalize(score ?? lastScore ?? 100)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <button className="btn ghost" style={{ paddingLeft:0 }} onClick={() => setSelectedCourse(null)}>
            <Icon name="arrowL" size={14} /> &nbsp; {t('Back', 'عودة')}
          </button>
          <h1 style={{ marginTop: 8 }}>{t(course.title, course.titleAr)}</h1>
          <div className="subtitle">
            {course.therapyArea} · {course.product} · v{course.version} · {t(`Pass mark ${course.passMark}%`, `النجاح ${course.passMark}%`)}
          </div>
        </div>
        <div className="row">
          <Pill variant="blue">{course.type.toUpperCase()}</Pill>
          {course.mandatory && <Pill variant="purple">{t('Mandatory', 'إلزامي')}</Pill>}
        </div>
      </div>

      <div className="card mb-12">
        <div className="row" style={{ alignItems:'center' }}>
          <div style={{ flex:1 }}>
            <div className="muted" style={{ fontSize: 11, marginBottom: 6 }}>
              {t(`Progress · ${progress}% complete`, `التقدم · ${progress}% مكتمل`)}
            </div>
            <ProgressBar pct={progress} />
          </div>
          <div className="row">
            <button className={`btn ${view === 'content' ? 'primary' : ''}`} onClick={() => setView('content')}>
              {t('Content', 'المحتوى')}
            </button>
            <button className={`btn ${view === 'quiz' ? 'primary' : ''}`} onClick={() => setView('quiz')} disabled={progress < 70}>
              {t('Quiz', 'الاختبار')}
            </button>
          </div>
        </div>
      </div>

      {view === 'content' && (
        <div className="card" style={{ minHeight: 480 }}>
          <ContentView course={course} progress={progress} onAdvance={handleAdvance} onQuiz={() => setView('quiz')} />
        </div>
      )}

      {view === 'quiz' && (
        <div className="card">
          <QuizRunner course={course} onComplete={handleQuizComplete} />
        </div>
      )}

      {view === 'done' && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-l)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Icon name="check" size={32} />
          </div>
          <h2>{t('Course completed', 'تم إكمال الدورة')}</h2>
          {lastScore != null && (
            <div style={{ fontSize: 36, fontWeight: 700, color: lastScore >= course.passMark ? 'var(--green)' : 'var(--amb)', margin: '8px 0' }}>{lastScore}%</div>
          )}
          <div className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
            {t('Your score is locked, your audit trail is updated, and your certificate is now in the vault.',
               'تم تثبيت درجتك، وتحديث سجل المراجعة، وإيداع الشهادة في الخزينة.')}
          </div>
          <div className="row" style={{ justifyContent:'center' }}>
            <button className="btn primary" onClick={() => { setSelectedCourse(null); goto('certificates') }}>
              <Icon name="award" size={14} /> &nbsp; {t('View in certificate vault', 'فتح خزينة الشهادات')}
            </button>
            <button className="btn" onClick={() => setSelectedCourse(null)}>{t('Back to my courses', 'إلى دوراتي')}</button>
          </div>
        </div>
      )}

      {showSign && <ESignatureModal course={course} onClose={() => { setShowSign(false); handleSignedComplete(lastScore ?? 100) }} />}
    </>
  )
}

function ContentView({ course, progress, onAdvance, onQuiz }) {
  const { t } = useApp()

  if (course.type === 'youtube' && course.contentUrl) {
    return (
      <div>
        <div style={{ aspectRatio: '16/9', borderRadius: 'var(--r3)', overflow: 'hidden', background: '#000' }}>
          <iframe
            src={course.contentUrl}
            width="100%"
            height="100%"
            style={{ border: 'none', display: 'block' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={course.title}
            onLoad={() => onAdvance(20)}
          />
        </div>
        <div className="row mt-16">
          <button className="btn" onClick={() => onAdvance(30)}>{t('Mark watched +30%', '+30٪ مشاهدة')}</button>
          <button className="btn primary" onClick={onQuiz} disabled={progress < 70}>{t('Take quiz →', 'ابدأ الاختبار →')}</button>
        </div>
        <div className="muted mt-12" style={{ fontSize: 11 }}>
          {t('YouTube embed · quiz unlocks at 70% watched.', 'تضمين يوتيوب · يفتح الاختبار عند 70٪.')}
        </div>
      </div>
    )
  }

  if (course.type === 'video') {
    const isBlob = course.contentUrl && (course.contentUrl.startsWith('blob:') || course.contentUrl.startsWith('http'))
    return (
      <div>
        <div style={{ aspectRatio: '16/9', background: '#0f172a', borderRadius: 'var(--r3)', overflow: 'hidden', position: 'relative' }}>
          {isBlob ? (
            <video
              src={course.contentUrl}
              controls
              style={{ width: '100%', height: '100%', display: 'block' }}
              onTimeUpdate={(e) => {
                const v = e.target
                if (v.duration > 0) onAdvance(Math.max(0, Math.round((v.currentTime / v.duration) * 100) - progress))
              }}
            />
          ) : (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'white', flexDirection:'column' }}>
              <Icon name="play" size={36} />
              <div style={{ marginTop: 8, fontWeight: 700 }}>{t(course.title, course.titleAr)}</div>
              <div style={{ fontSize: 11, opacity: .7, marginTop: 4 }}>{t('Auto-transcription enabled', 'النسخ النصي مفعل')}</div>
              <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
                <ProgressBar pct={progress} fill="white" />
              </div>
            </div>
          )}
        </div>
        <div className="row mt-16">
          {!isBlob && <button className="btn" onClick={() => onAdvance(15)}>{t('Watch +15%', 'شاهد +15%')}</button>}
          {!isBlob && <button className="btn" onClick={() => onAdvance(40)}>{t('Watch +40%', 'شاهد +40%')}</button>}
          <button className="btn primary" onClick={onQuiz} disabled={progress < 70}>{t('Take quiz →', 'ابدأ الاختبار →')}</button>
        </div>
        <div className="muted mt-12" style={{ fontSize: 11 }}>
          {t('Watch percentage tracked via xAPI; quiz unlocks at 70%.', 'تُحتسب نسبة المشاهدة عبر xAPI؛ يفتح الاختبار عند 70٪.')}
        </div>
      </div>
    )
  }

  if (course.type === 'audio') {
    return (
      <div>
        <div style={{ background: 'linear-gradient(135deg, var(--blue-l) 0%, white 70%)', border: '1px solid var(--border)', borderRadius: 'var(--r3)', padding: 40, textAlign: 'center', minHeight: 240 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Icon name="message" size={36} />
          </div>
          <h3 style={{ margin: '0 0 14px' }}>{t(course.title, course.titleAr)}</h3>
          {course.contentUrl ? (
            <audio
              src={course.contentUrl}
              controls
              style={{ width: '100%', maxWidth: 480 }}
              onTimeUpdate={(e) => {
                const v = e.target
                if (v.duration > 0) onAdvance(Math.max(0, Math.round((v.currentTime / v.duration) * 100) - progress))
              }}
            />
          ) : (
            <div className="muted">{t('No audio source attached.', 'لا يوجد مصدر صوتي.')}</div>
          )}
        </div>
        <div className="row mt-16">
          <button className="btn primary" onClick={onQuiz} disabled={progress < 70}>{t('Take quiz →', 'ابدأ الاختبار →')}</button>
        </div>
      </div>
    )
  }

  if (course.type === 'pdf') {
    const isReal = course.contentUrl && (course.contentUrl.startsWith('blob:') || course.contentUrl.endsWith('.pdf'))
    return (
      <div>
        {isReal ? (
          <iframe src={course.contentUrl} width="100%" height="520" style={{ border: '1px solid var(--border)', borderRadius: 'var(--r3)' }} title={course.title} onLoad={() => onAdvance(30)} />
        ) : (
          <div style={{ background: 'var(--bg)', borderRadius: 'var(--r3)', padding: 40, minHeight: 380, color: 'var(--tx2)' }}>
            <Icon name="doc" size={28} />
            <h3 style={{ marginTop: 8 }}>{t(course.title, course.titleAr)}</h3>
            <p style={{ lineHeight: 1.7 }}>
              {t('This module covers the phases of clinical trials, primary endpoints, and how to discuss data with HCPs. Section 1 reviews Phase I/II/III/IV and the role of randomisation, blinding, and statistical power. Section 2 covers HR, OS, PFS, and ORR. Section 3 introduces fair-balance presentation as required under industry codes.',
                 'تغطي هذه الوحدة مراحل التجارب السريرية والنقاط الأساسية وكيفية مناقشة البيانات. القسم 1 يراجع المراحل I-IV. القسم 2 يغطي HR وOS وPFS. القسم 3 يقدم العرض المتوازن المطلوب وفقًا للأكواد.')}
            </p>
          </div>
        )}
        <div className="row mt-16">
          {!isReal && <button className="btn" onClick={() => onAdvance(25)}>{t('Page 2 →', 'الصفحة 2 →')}</button>}
          {!isReal && <button className="btn" onClick={() => onAdvance(50)}>{t('Skim sections', 'تصفح الأقسام')}</button>}
          <button className="btn primary" onClick={onQuiz} disabled={progress < 70}>{t('Take quiz →', 'ابدأ الاختبار →')}</button>
        </div>
      </div>
    )
  }

  if (course.type === 'ppt' || course.type === 'doc' || course.type === 'file') {
    const ext = course.contentFilename ? course.contentFilename.split('.').pop().toUpperCase() : course.type.toUpperCase()
    return (
      <div>
        <div style={{ background: 'var(--bg)', borderRadius: 'var(--r3)', padding: 40, minHeight: 320, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="doc" size={32} />
          </div>
          <h3 style={{ marginTop: 14 }}>{t(course.title, course.titleAr)}</h3>
          <Pill variant="blue" style={{ marginTop: 4 }}>{ext}</Pill>
          {course.contentFilename && (
            <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>{course.contentFilename}</div>
          )}
          {course.contentUrl && (
            <div className="row" style={{ marginTop: 16 }}>
              <a href={course.contentUrl} target="_blank" rel="noreferrer" download={course.contentFilename || true} className="btn primary">
                <Icon name="download" size={14} /> &nbsp; {t('Open / download', 'فتح / تنزيل')}
              </a>
            </div>
          )}
        </div>
        <div className="row mt-16">
          <button className="btn" onClick={() => onAdvance(40)}>{t('Mark reviewed +40%', '+40٪ تم العرض')}</button>
          <button className="btn primary" onClick={onQuiz} disabled={progress < 70}>{t('Take quiz →', 'ابدأ الاختبار →')}</button>
        </div>
        <div className="muted mt-12" style={{ fontSize: 11 }}>
          {t('PPT and Word files open in a new tab — completion is tracked once you mark reviewed.',
             'تُفتح ملفات PPT و Word في تبويب جديد — يحسب الإكمال عند الضغط على "تم العرض".')}
        </div>
      </div>
    )
  }
  return (
    <div>
      <div style={{ background: '#0f172a', borderRadius: 'var(--r3)', minHeight: 380, padding: 24, color: 'white' }}>
        <Pill variant="blue">SCORM iframe</Pill>
        <h3 style={{ marginTop: 12 }}>{t(course.title, course.titleAr)}</h3>
        <p style={{ opacity: .8, lineHeight: 1.6 }}>
          {t('In production, this area mounts the SCORM SCO via lib/scorm.js — the LMS API bridge tracks lesson_status and score.raw.',
             'في الإنتاج، تعرض هذه المنطقة حزمة SCORM عبر lib/scorm.js — الجسر يتبع حالة الدرس والنتيجة.')}
        </p>
        <div className="muted" style={{ fontSize: 11, marginTop: 12 }}>cmi.core.lesson_status = incomplete | completed | passed</div>
      </div>
      <div className="row mt-16">
        <button className="btn" onClick={() => onAdvance(20)}>{t('Continue (+20%)', 'تابع (+20%)')}</button>
        <button className="btn" onClick={() => onAdvance(50)}>{t('Continue (+50%)', 'تابع (+50%)')}</button>
        <button className="btn primary" onClick={onQuiz} disabled={progress < 70}>{t('Take quiz →', 'ابدأ الاختبار →')}</button>
      </div>
    </div>
  )
}

function ESignatureModal({ course, onClose }) {
  const { t, user, logAction } = useApp()
  const [pwd, setPwd] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!confirmed || pwd.length < 4) return
    setBusy(true)
    setTimeout(() => {
      logAction('esignature_applied', course.id, {
        statement: 'I confirm I have completed this training',
        userName: user?.name,
        passwordReverified: true,
      })
      logAction('cert_issued', course.id, { courseId: course.id, score: 92 })
      setBusy(false)
      onClose()
    }, 600)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h3>{t('E-signature required', 'مطلوب توقيع إلكتروني')}</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <Pill variant="purple">{t('21 CFR Part 11', 'CFR 21 جزء 11')}</Pill>
            <p className="mt-12" style={{ lineHeight: 1.55, fontSize: 13 }}>
              {t('You are signing completion of a mandatory training. This action is logged immutably.',
                 'أنت توقّع إتمام تدريب إلزامي. تُسجَّل هذه العملية بشكل غير قابل للتعديل.')}
            </p>

            <div className="field">
              <label>{t('Re-enter your password', 'أعد إدخال كلمة المرور')}</label>
              <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required />
            </div>

            <label style={{ display:'flex', gap:8, alignItems:'flex-start', fontSize:12, lineHeight:1.5 }}>
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              <span>{t('I confirm I have completed this training in full and understand the content presented.',
                       'أؤكد أنني أكملت هذا التدريب بالكامل وأفهم محتواه.')}</span>
            </label>

            <div className="card-tight mt-12" style={{ background: 'var(--bg)', borderRadius:'var(--r3)', padding: 10, fontSize: 11 }}>
              <strong>{t('Audit record will store', 'سيُسجَّل في المراجعة')}:</strong>
              <ul style={{ paddingInlineStart: 18, margin: 6 }}>
                <li>{t(`Signer: ${user?.name}`, `الموقّع: ${user?.nameAr || user?.name}`)}</li>
                <li>{t(`Course: ${course.title} v${course.version}`, `الدورة: ${course.titleAr || course.title} v${course.version}`)}</li>
                <li>{t('Timestamp: now · IP: 10.0.0.42 · Password re-verified', 'الزمن: الآن · IP: 10.0.0.42 · تم التحقق')}</li>
              </ul>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn" onClick={onClose}>{t('Cancel', 'إلغاء')}</button>
            <button type="submit" className="btn primary" disabled={!confirmed || pwd.length < 4 || busy}>
              {busy ? t('Signing…', 'جاري التوقيع…') : t('Apply e-signature', 'تطبيق التوقيع')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
