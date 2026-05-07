import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Pill from '../../components/Pill.jsx'
import Icon from '../../components/Icon.jsx'

const SAMPLE_BANK = [
  {
    id: 'q1',
    type: 'mcq',
    en: 'Which adverse event must be reported to the PV team within 24 hours?',
    ar: 'أي أثر جانبي يجب الإبلاغ عنه خلال 24 ساعة؟',
    options: [
      { en: 'Mild headache that resolves',                       ar: 'صداع خفيف ينتهي' },
      { en: 'Suspected unexpected serious adverse reaction (SUSAR)', ar: 'تفاعل خطير غير متوقع (SUSAR)' },
      { en: 'Common nausea after meals',                          ar: 'غثيان معتاد بعد الأكل' },
      { en: 'Mild skin redness lasting one day',                  ar: 'احمرار جلدي ليوم واحد' },
    ],
    correct: 1,
  },
  {
    id: 'q2',
    type: 'mcq',
    en: 'A doctor objects: "your safety profile is weaker than competitor X." Best response?',
    ar: 'يعترض طبيب: "ملف السلامة أضعف من المنافس X." أفضل رد؟',
    options: [
      { en: 'Dismiss the comparison and pivot to efficacy',                            ar: 'تجاهل المقارنة والانتقال للفعالية' },
      { en: 'Acknowledge, share head-to-head data with fair balance, offer SmPC',      ar: 'الاعتراف، عرض البيانات المتوازنة وتقديم SmPC' },
      { en: 'Promise off-label combination use',                                       ar: 'الوعد باستخدام خارج التسمية' },
      { en: 'Refer to KOL anecdote',                                                   ar: 'الاستناد لحادثة من خبير' },
    ],
    correct: 1,
  },
  {
    id: 'q3',
    type: 'mcq',
    en: 'Pass mark on a mandatory PV course is set to:',
    ar: 'علامة النجاح على دورة اليقظة الإلزامية:',
    options: [
      { en: '60%', ar: '60%' },
      { en: '70%', ar: '70%' },
      { en: '80%', ar: '80%' },
      { en: '90%', ar: '90%' },
    ],
    correct: 3,
  },
  {
    id: 'q4',
    type: 'mcq',
    en: 'KEYNORX dose adjustment is required in:',
    ar: 'تعديل جرعة كاينوركس مطلوب في:',
    options: [
      { en: 'Pregnancy only',                ar: 'الحمل فقط' },
      { en: 'Hepatic and renal impairment',  ar: 'القصور الكبدي والكلوي' },
      { en: 'Pediatrics under 12 only',      ar: 'الأطفال دون 12 فقط' },
      { en: 'No adjustment ever needed',     ar: 'لا يلزم تعديل' },
    ],
    correct: 1,
  },
  {
    id: 'q5',
    type: 'mcq',
    en: 'Under 21 CFR Part 11, e-signatures must include:',
    ar: 'وفقًا لـ 21 CFR Part 11، يجب أن يتضمن التوقيع الإلكتروني:',
    options: [
      { en: 'Only a checkbox',                                              ar: 'مربع اختيار فقط' },
      { en: 'A handwritten upload',                                         ar: 'رفع توقيع يدوي' },
      { en: 'Two distinct identification components, one being a password', ar: 'مكونين، أحدهما كلمة مرور' },
      { en: 'A manager approval afterward',                                 ar: 'موافقة مدير لاحقة' },
    ],
    correct: 2,
  },
]

export default function QuizRunner({ course, onComplete }) {
  const { t, logAction } = useApp()
  // Prefer the course's own approved questions (set by Course Builder).
  // Fall back to the seeded sample bank for the legacy mock courses.
  const questions = useMemo(() => {
    const own = (course.questions || []).filter((q) => q.status !== 'pending-review')
    if (own.length > 0) {
      return own.map((q) => ({
        id: q.id,
        type: q.type,
        en: q.text?.en || q.en || '',
        ar: q.text?.ar || q.ar || '',
        options: (q.options || []).map((o) => ({
          en: o.text?.en || o.en || '',
          ar: o.text?.ar || o.ar || '',
        })),
        correct: Array.isArray(q.correct) ? q.correct[0] : q.correct,
      }))
    }
    return SAMPLE_BANK.slice(0, 5)
  }, [course])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(course.durationMin * 60)

  const q = questions[idx]
  const total = questions.length
  const answeredCount = Object.keys(answers).length

  const select = (i) => {
    if (submitted) return
    setAnswers((a) => ({ ...a, [q.id]: i }))
  }

  const next = () => setIdx((i) => Math.min(total - 1, i + 1))
  const prev = () => setIdx((i) => Math.max(0, i - 1))

  const submit = () => {
    let correct = 0
    questions.forEach((qq) => { if (answers[qq.id] === qq.correct) correct += 1 })
    const score = Math.round((correct / total) * 100)
    setSubmitted(true)
    logAction('quiz_submitted', course.id, { score, answers, attempt: 1 })
    setTimeout(() => onComplete(score), 1200)
  }

  if (submitted) {
    let correct = 0
    questions.forEach((qq) => { if (answers[qq.id] === qq.correct) correct += 1 })
    const score = Math.round((correct / total) * 100)
    const passed = score >= course.passMark
    return (
      <div style={{ textAlign: 'center', padding: 30 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: passed ? 'var(--green-l)' : 'var(--red-l)', color: passed ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <Icon name={passed ? 'check' : 'x'} size={32} />
        </div>
        <h2>{passed ? t('You passed!', 'لقد نجحت!') : t('Not yet passed', 'لم تنجح بعد')}</h2>
        <div style={{ fontSize: 36, fontWeight: 700, color: passed ? 'var(--green)' : 'var(--red)' }}>{score}%</div>
        <div className="muted mt-12">
          {t(`${correct} of ${total} correct · pass mark ${course.passMark}%`,
             `${correct} من ${total} صحيحة · النجاح ${course.passMark}%`)}
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-shell">
      <div className="row mb-12" style={{ justifyContent:'space-between' }}>
        <Pill variant="blue">{t(`Question ${idx + 1} of ${total}`, `سؤال ${idx + 1} من ${total}`)}</Pill>
        <div className="row">
          <Pill variant="amber">
            <Icon name="clock" size={10} /> &nbsp;
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </Pill>
          <Pill variant="purple">{t(`${answeredCount} answered`, `${answeredCount} مُجاب`)}</Pill>
        </div>
      </div>

      <div className="quiz-question">{t(q.en, q.ar)}</div>

      <div className="quiz-options">
        {q.options.map((opt, i) => {
          const selected = answers[q.id] === i
          return (
            <button key={i} className={`quiz-option ${selected ? 'selected' : ''}`} onClick={() => select(i)}>
              <div className="marker">{String.fromCharCode(65 + i)}</div>
              <div>{t(opt.en, opt.ar)}</div>
            </button>
          )
        })}
      </div>

      <div className="row mt-16" style={{ justifyContent:'space-between' }}>
        <button className="btn" onClick={prev} disabled={idx === 0}>{t('Previous', 'السابق')}</button>
        {idx < total - 1
          ? <button className="btn primary" onClick={next} disabled={answers[q.id] === undefined}>{t('Next →', 'التالي →')}</button>
          : <button className="btn success" onClick={submit} disabled={answeredCount < total}>{t('Submit quiz', 'إرسال الإجابات')}</button>}
      </div>
      <div className="muted mt-16" style={{ fontSize: 11, textAlign:'center' }}>
        {t('Each attempt is timestamped, signed, and stored immutably in your training record.',
           'كل محاولة موقّعة بزمنها وغير قابلة للتعديل في سجلك التدريبي.')}
      </div>
    </div>
  )
}
