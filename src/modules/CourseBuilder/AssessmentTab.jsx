import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Icon from '../../components/Icon.jsx'
import Pill from '../../components/Pill.jsx'
import { generateAssessmentFromCourse, claudeReady } from '../../lib/claude.js'

const TYPE_LABEL = {
  mcq:      { en: 'MCQ',         ar: 'اختيار' },
  multi:    { en: 'Multi',       ar: 'متعدد' },
  scenario: { en: 'Scenario',    ar: 'سيناريو' },
}

const newBlankQuestion = (type = 'mcq') => ({
  id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  type,
  text:  { en: '', ar: '' },
  options: [
    { text: { en: '', ar: '' } },
    { text: { en: '', ar: '' } },
    { text: { en: '', ar: '' } },
    { text: { en: '', ar: '' } },
  ],
  correct: type === 'multi' ? [] : 0,
  explanation: { en: '', ar: '' },
  difficulty: 'medium',
  source: 'manual',
  status: 'approved',
})

export default function AssessmentTab({ draft, setDraft }) {
  const { t, logAction } = useApp()
  const questions = draft.questions || []
  const [editing, setEditing] = useState(null)        // question being edited
  const [aiState, setAiState] = useState('idle')      // idle | running | review | error
  const [aiError, setAiError] = useState(null)
  const [aiBatch, setAiBatch] = useState([])          // generated questions awaiting review
  const [aiMeta, setAiMeta] = useState(null)

  const setQuestions = (next) =>
    setDraft((d) => ({ ...d, questions: typeof next === 'function' ? next(d.questions || []) : next }))

  const handleAdd = (type = 'mcq') => {
    const q = newBlankQuestion(type)
    setQuestions((prev) => [...prev, q])
    setEditing(q.id)
  }

  const handleDelete = (id) => {
    if (!confirm(t('Delete this question?', 'حذف هذا السؤال؟'))) return
    setQuestions((prev) => prev.filter((q) => q.id !== id))
    if (editing === id) setEditing(null)
  }

  const handleSaveEdit = (q) => {
    setQuestions((prev) => prev.map((x) => (x.id === q.id ? q : x)))
    setEditing(null)
  }

  const handleGenerateAI = async () => {
    if (!draft.contentUrl) {
      alert(t('Add a content source in the Content tab first (file, YouTube link, or SCORM).',
              'أضف مصدر محتوى أولًا في تبويب المحتوى.'))
      return
    }
    setAiState('running')
    setAiError(null)
    try {
      const result = await generateAssessmentFromCourse({
        title:           draft.title,
        titleAr:         draft.titleAr,
        description:     draft.description,
        therapyArea:     draft.therapyArea,
        product:         draft.product,
        version:         draft.version,
        passMark:        draft.passMark,
        type:            draft.type,
        contentUrl:      draft.contentUrl,
        youtubeId:       draft.youtubeId,
        contentFilename: draft.contentFilename,
      }, { numQuestions: 10 })

      const enriched = result.questions.map((q, i) => ({
        ...q,
        id: `ai-${Date.now()}-${i}`,
        status: 'pending-review',
        source: 'ai-generated',
      }))
      setAiBatch(enriched)
      setAiMeta({ model: result.model, source: result.source, generatedAt: result.generatedAt })
      setAiState('review')
      logAction('ai_assessment_generated', draft.title || 'untitled-course', {
        count: enriched.length,
        model: result.model,
        source: result.source,
      })
    } catch (err) {
      setAiState('error')
      setAiError(err?.message || String(err))
    }
  }

  const handleAcceptAI = (id) => {
    const q = aiBatch.find((x) => x.id === id)
    if (!q) return
    const approved = { ...q, status: 'approved', reviewedAt: new Date().toISOString() }
    setQuestions((prev) => [...prev, approved])
    setAiBatch((prev) => prev.filter((x) => x.id !== id))
    logAction('ai_question_approved', id)
  }

  const handleRejectAI = (id) => {
    setAiBatch((prev) => prev.filter((x) => x.id !== id))
    logAction('ai_question_rejected', id)
  }

  const handleAcceptAll = () => {
    const approved = aiBatch.map((q) => ({ ...q, status: 'approved', reviewedAt: new Date().toISOString() }))
    setQuestions((prev) => [...prev, ...approved])
    logAction('ai_questions_approved_bulk', draft.title || 'untitled-course', { count: approved.length })
    setAiBatch([])
    setAiState('idle')
  }

  const handleEditAI = (q) => {
    // Pull the AI question into the manual bank in edit mode
    const promoted = { ...q, status: 'approved', source: 'ai-generated' }
    setQuestions((prev) => [...prev, promoted])
    setAiBatch((prev) => prev.filter((x) => x.id !== q.id))
    setEditing(promoted.id)
  }

  const handleClearReview = () => {
    setAiBatch([])
    setAiState('idle')
    setAiMeta(null)
  }

  return (
    <div>
      {/* ── Configuration row ─────────────────────────────────────────────── */}
      <div className="row mb-12">
        <Pill variant="blue">{t('MCQ', 'اختيار من متعدد')}</Pill>
        <Pill variant="purple">{t('Multi-select', 'متعدد الإجابات')}</Pill>
        <Pill variant="amber">{t('Scenario', 'سيناريو')}</Pill>
        <span className="muted" style={{ fontSize: 11 }}>·</span>
        <Pill variant="gray">{t(`${questions.length} in bank`, `${questions.length} في البنك`)}</Pill>
        {aiBatch.length > 0 && <Pill variant="purple">{t(`${aiBatch.length} AI awaiting review`, `${aiBatch.length} ينتظر المراجعة`)}</Pill>}
      </div>

      <div className="builder-grid">
        {/* ── Left: exam configuration ───────────────────────────────────── */}
        <div>
          <h3>{t('Exam configuration', 'إعدادات الامتحان')}</h3>
          <Cfg label={t('Pull N from a bank of M',         'سحب N من بنك حجمه M')}      val={`${Math.min(10, questions.length)} / ${questions.length}`} />
          <Cfg label={t('Time limit',                      'الحد الزمني')}              val={`${draft.durationMin || 30} ${t('min', 'دقيقة')}`} />
          <Cfg label={t('Pass mark',                       'علامة النجاح')}             val={`${draft.passMark}%`} />
          <Cfg label={t('Attempts allowed',                'المحاولات المسموحة')}       val={draft.attemptsAllowed} />
          <Cfg label={t('Randomize order',                 'ترتيب عشوائي')}             val={t('Yes — questions + options', 'نعم — أسئلة وخيارات')} />
          <Cfg label={t('Show correct answers after passing','إظهار الإجابات بعد النجاح')} val={t('Yes', 'نعم')} />
          <Cfg label={t('Remediation rule',                'قاعدة المعالجة')}           val={t('< 75% → retake module', '< 75% → إعادة الوحدة')} />
          <Cfg label={t('Proctoring',                      'المراقبة')}                  val={t('Optional — webcam',     'اختياري — كاميرا')} />

          <div className="card-tight mt-16" style={{ background:'var(--blue-l)', border:'1px solid var(--blue-m)', borderRadius:'var(--r3)', padding:14 }}>
            <div className="row" style={{ alignItems:'center', gap:8 }}>
              <Icon name="sparkle" size={18} color="var(--blue-d)" />
              <div style={{ fontWeight:700, color:'var(--blue-d)' }}>{t('AI assessment generator', 'مولّد الاختبار بالذكاء')}</div>
            </div>
            <p style={{ fontSize:11, lineHeight:1.55, marginTop:8, color:'var(--blue-d)' }}>
              {t('Send the attached content (file, video, or YouTube link) to Claude. The model reads the source and produces a 10-question bilingual assessment. You review each question before it lands in the bank.',
                 'يرسل المحتوى المرفق (ملف، فيديو، أو رابط يوتيوب) إلى كلود. يقرأ النموذج المصدر وينتج اختبارًا ثنائي اللغة من 10 أسئلة، تراجعها قبل اعتمادها.')}
            </p>
            <div className="row" style={{ marginTop: 10, gap: 6 }}>
              <Pill variant="purple">claude-opus-4-7</Pill>
              {claudeReady ? <Pill variant="green">{t('API key set', 'المفتاح مهيّأ')}</Pill> : <Pill variant="amber">{t('Demo mode', 'وضع العرض')}</Pill>}
            </div>
            <button
              type="button"
              className="btn primary"
              style={{ marginTop: 12, width: '100%' }}
              onClick={handleGenerateAI}
              disabled={aiState === 'running'}
            >
              {aiState === 'running'
                ? <>{t('Analyzing content…', 'جاري تحليل المحتوى…')}</>
                : <><Icon name="sparkle" size={14} /> &nbsp; {t('Generate AI assessment', 'إنشاء اختبار بالذكاء')}</>}
            </button>
          </div>
        </div>

        {/* ── Right: question bank + AI review ───────────────────────────── */}
        <div>
          {/* Header row */}
          <div className="row" style={{ justifyContent:'space-between' }}>
            <h3 style={{ margin: 0 }}>{t('Question bank', 'بنك الأسئلة')}</h3>
            <div className="row">
              <button type="button" className="btn" onClick={() => handleAdd('mcq')}><Icon name="plus" size={12} /> &nbsp; {t('MCQ', 'اختيار')}</button>
              <button type="button" className="btn" onClick={() => handleAdd('multi')}><Icon name="plus" size={12} /> &nbsp; {t('Multi', 'متعدد')}</button>
              <button type="button" className="btn" onClick={() => handleAdd('scenario')}><Icon name="plus" size={12} /> &nbsp; {t('Scenario', 'سيناريو')}</button>
            </div>
          </div>

          {/* AI review panel */}
          {aiState === 'running' && (
            <div className="card mt-12" style={{ background: 'var(--blue-l)', borderColor: 'var(--blue-m)' }}>
              <div className="row" style={{ alignItems:'center', gap: 10 }}>
                <Icon name="sparkle" size={22} color="var(--blue-d)" />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--blue-d)' }}>{t('Reading the source…', 'قراءة المصدر…')}</div>
                  <div className="muted" style={{ fontSize: 11 }}>
                    {draft.type === 'youtube'
                      ? t('Fetching YouTube transcript and analyzing.', 'جلب نص يوتيوب وتحليله.')
                      : draft.type === 'video' || draft.type === 'audio'
                      ? t('Transcribing media and analyzing.',          'النسخ والتحليل.')
                      : t('Extracting text and analyzing.',              'استخراج النص والتحليل.')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {aiState === 'error' && (
            <div className="card mt-12" style={{ background: 'var(--red-l)', borderColor: 'var(--red-m)' }}>
              <div style={{ fontWeight: 700, color: 'var(--red)' }}>{t('Generation failed', 'فشل الإنشاء')}</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{aiError}</div>
              <button type="button" className="btn mt-12" onClick={() => setAiState('idle')}>{t('Dismiss', 'تجاهل')}</button>
            </div>
          )}

          {aiState === 'review' && aiBatch.length > 0 && (
            <div className="card mt-12" style={{ background: 'linear-gradient(135deg, var(--pur-l) 0%, white 70%)', borderColor: 'var(--pur-m)' }}>
              <div className="row" style={{ justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--pur)' }}>
                    <Icon name="sparkle" size={14} /> &nbsp; {t(`${aiBatch.length} AI-generated · awaiting your review`, `${aiBatch.length} مُنتجة بالذكاء · بانتظار المراجعة`)}
                  </div>
                  {aiMeta && <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>{aiMeta.model} · {new Date(aiMeta.generatedAt).toLocaleTimeString()} · {aiMeta.source}</div>}
                </div>
                <div className="row">
                  <button type="button" className="btn" onClick={handleClearReview}>{t('Discard all', 'تجاهل الكل')}</button>
                  <button type="button" className="btn primary" onClick={handleAcceptAll}>{t('Accept all', 'قبول الكل')}</button>
                </div>
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
                {t('Each question is bilingual and tagged "ai-generated". Approving moves it to the bank with a 21 CFR Part 11 audit entry. Edit before approval if you want to tweak wording.',
                   'كل سؤال ثنائي اللغة ومميز بأنه "مُنشأ بالذكاء". يضيفه القبول إلى البنك مع تسجيل في سجل المراجعة. عدّل قبل القبول إذا أردت ضبط الصياغة.')}
              </div>

              <div className="mt-12" style={{ display: 'grid', gap: 10 }}>
                {aiBatch.map((q, i) => (
                  <AIReviewCard
                    key={q.id}
                    q={q}
                    index={i + 1}
                    onAccept={() => handleAcceptAI(q.id)}
                    onReject={() => handleRejectAI(q.id)}
                    onEdit={() => handleEditAI(q)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Question bank list */}
          <div className="mt-12" style={{ display: 'grid', gap: 8 }}>
            {questions.length === 0 && (
              <div className="empty-state">
                <div className="ico"><Icon name="check" size={22} /></div>
                <h4>{t('No questions yet', 'لا توجد أسئلة بعد')}</h4>
                <p>{t('Add manually or generate with AI from the source content.', 'أضف يدويًا أو أنشئ بالذكاء من المحتوى.')}</p>
              </div>
            )}

            {questions.map((q, i) => (
              editing === q.id
                ? <QuestionEditor key={q.id} initial={q} onSave={handleSaveEdit} onCancel={() => setEditing(null)} />
                : <QuestionCard   key={q.id} q={q} index={i + 1} onEdit={() => setEditing(q.id)} onDelete={() => handleDelete(q.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Cfg({ label, val }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr auto', padding:'10px 0', borderTop:'1px solid var(--border)', alignItems:'center', gap:12 }}>
      <div style={{ fontSize:12, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:12, color:'var(--tx2)' }}>{val}</div>
    </div>
  )
}

function QuestionCard({ q, index, onEdit, onDelete }) {
  const { t, lang } = useApp()
  const correctList = Array.isArray(q.correct) ? q.correct : [q.correct]
  const tLabel = TYPE_LABEL[q.type] || TYPE_LABEL.mcq
  const variant = q.type === 'mcq' ? 'blue' : q.type === 'multi' ? 'purple' : 'amber'
  return (
    <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--r3)' }}>
      <div className="row" style={{ marginBottom: 6, justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: 6 }}>
          <Pill variant={variant}>{t(tLabel.en, tLabel.ar)}</Pill>
          {q.source === 'ai-generated' && <Pill variant="purple"><Icon name="sparkle" size={9} /> &nbsp; AI</Pill>}
          {q.difficulty && <Pill variant="gray">{q.difficulty}</Pill>}
          <span style={{ fontSize: 10, color: 'var(--tx3)' }}>Q{index}</span>
        </div>
        <div className="row">
          <button type="button" className="btn sm" onClick={onEdit}><Icon name="edit" size={11} /></button>
          <button type="button" className="btn sm" onClick={onDelete}><Icon name="x" size={11} /></button>
        </div>
      </div>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{lang === 'ar' && q.text?.ar ? q.text.ar : q.text?.en}</div>
      <div className="mt-12" style={{ display: 'grid', gap: 4 }}>
        {(q.options || []).map((opt, i) => {
          const isCorrect = correctList.includes(i)
          return (
            <div key={i} style={{ fontSize: 12, color: isCorrect ? 'var(--green)' : 'var(--tx2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ width: 18, fontWeight: 700, color: isCorrect ? 'var(--green)' : 'var(--tx3)' }}>
                {isCorrect ? '✓' : String.fromCharCode(65 + i)}
              </span>
              <span>{lang === 'ar' && opt.text?.ar ? opt.text.ar : opt.text?.en}</span>
            </div>
          )
        })}
      </div>
      {q.explanation?.en && (
        <div className="muted mt-12" style={{ fontSize: 11, padding: 8, background: 'var(--bg)', borderRadius: 'var(--r4)' }}>
          <strong>{t('Explanation:', 'الشرح:')}</strong> {lang === 'ar' && q.explanation.ar ? q.explanation.ar : q.explanation.en}
        </div>
      )}
    </div>
  )
}

function AIReviewCard({ q, index, onAccept, onReject, onEdit }) {
  const { t, lang } = useApp()
  const correctList = Array.isArray(q.correct) ? q.correct : [q.correct]
  const tLabel = TYPE_LABEL[q.type] || TYPE_LABEL.mcq
  return (
    <div style={{ padding: 12, background: 'white', border: '1px solid var(--pur-m)', borderRadius: 'var(--r3)' }}>
      <div className="row" style={{ marginBottom: 6, justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: 6 }}>
          <Pill variant="purple"><Icon name="sparkle" size={9} /> &nbsp; AI</Pill>
          <Pill variant={q.type === 'mcq' ? 'blue' : q.type === 'multi' ? 'purple' : 'amber'}>{t(tLabel.en, tLabel.ar)}</Pill>
          {q.difficulty && <Pill variant="gray">{q.difficulty}</Pill>}
          <span style={{ fontSize: 10, color: 'var(--tx3)' }}>#{index}</span>
        </div>
      </div>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{lang === 'ar' && q.text?.ar ? q.text.ar : q.text?.en}</div>
      <div className="mt-12" style={{ display: 'grid', gap: 4 }}>
        {(q.options || []).map((opt, i) => {
          const isCorrect = correctList.includes(i)
          return (
            <div key={i} style={{ fontSize: 12, color: isCorrect ? 'var(--green)' : 'var(--tx2)', display: 'flex', gap: 8 }}>
              <span style={{ width: 18, fontWeight: 700, color: isCorrect ? 'var(--green)' : 'var(--tx3)' }}>{isCorrect ? '✓' : String.fromCharCode(65 + i)}</span>
              <span>{lang === 'ar' && opt.text?.ar ? opt.text.ar : opt.text?.en}</span>
            </div>
          )
        })}
      </div>
      {q.explanation?.en && (
        <div className="muted mt-12" style={{ fontSize: 11, padding: 8, background: 'var(--bg)', borderRadius: 'var(--r4)' }}>
          <strong>{t('Why:', 'السبب:')}</strong> {lang === 'ar' && q.explanation.ar ? q.explanation.ar : q.explanation.en}
        </div>
      )}
      <div className="row mt-12" style={{ justifyContent: 'flex-end', gap: 6 }}>
        <button type="button" className="btn sm" onClick={onReject}><Icon name="x" size={11} /> &nbsp; {t('Reject', 'رفض')}</button>
        <button type="button" className="btn sm" onClick={onEdit}><Icon name="edit" size={11} /> &nbsp; {t('Edit & accept', 'تعديل وقبول')}</button>
        <button type="button" className="btn sm" style={{ background: 'var(--green)', color: 'white', borderColor: 'var(--green)' }} onClick={onAccept}>
          <Icon name="check" size={11} /> &nbsp; {t('Accept', 'قبول')}
        </button>
      </div>
    </div>
  )
}

function QuestionEditor({ initial, onSave, onCancel }) {
  const { t } = useApp()
  const [q, setQ] = useState(initial)

  const setText  = (lang, v) => setQ((x) => ({ ...x, text:        { ...x.text,        [lang]: v } }))
  const setExpl  = (lang, v) => setQ((x) => ({ ...x, explanation: { ...x.explanation, [lang]: v } }))
  const setOptText = (i, lang, v) =>
    setQ((x) => ({ ...x, options: x.options.map((o, idx) => idx === i ? { ...o, text: { ...o.text, [lang]: v } } : o) }))
  const addOption = () => setQ((x) => ({ ...x, options: [...x.options, { text: { en: '', ar: '' } }] }))
  const removeOption = (i) =>
    setQ((x) => ({
      ...x,
      options: x.options.filter((_, idx) => idx !== i),
      correct: Array.isArray(x.correct)
        ? x.correct.filter((c) => c !== i).map((c) => (c > i ? c - 1 : c))
        : (x.correct === i ? 0 : x.correct > i ? x.correct - 1 : x.correct),
    }))

  const toggleCorrectMulti = (i) =>
    setQ((x) => {
      const arr = Array.isArray(x.correct) ? x.correct : []
      return { ...x, correct: arr.includes(i) ? arr.filter((c) => c !== i) : [...arr, i] }
    })

  const setTypeAndAdjust = (type) =>
    setQ((x) => ({ ...x, type, correct: type === 'multi' ? (Array.isArray(x.correct) ? x.correct : [x.correct]) : (Array.isArray(x.correct) ? x.correct[0] || 0 : x.correct) }))

  const valid = q.text.en.trim() && q.options.every((o) => o.text.en.trim()) && q.options.length >= 2

  return (
    <div style={{ padding: 14, border: '2px solid var(--blue-m)', borderRadius: 'var(--r3)', background: 'var(--blue-l)' }}>
      <div className="row" style={{ marginBottom: 10 }}>
        <Pill variant="blue">{t('Editing', 'تحرير')}</Pill>
        <select value={q.type} onChange={(e) => setTypeAndAdjust(e.target.value)} className="filter-input">
          <option value="mcq">{t('MCQ — single answer',          'اختيار — إجابة واحدة')}</option>
          <option value="multi">{t('Multi — multiple answers',    'متعدد — عدة إجابات')}</option>
          <option value="scenario">{t('Scenario',                  'سيناريو')}</option>
        </select>
        <select value={q.difficulty} onChange={(e) => setQ((x) => ({ ...x, difficulty: e.target.value }))} className="filter-input">
          <option value="easy">{t('Easy', 'سهل')}</option>
          <option value="medium">{t('Medium', 'متوسط')}</option>
          <option value="hard">{t('Hard', 'صعب')}</option>
        </select>
      </div>

      <div className="field">
        <label>{t('Question (English)', 'السؤال (إنجليزي)')}</label>
        <input value={q.text.en} onChange={(e) => setText('en', e.target.value)} required style={{ width: '100%' }} />
      </div>
      <div className="field">
        <label>{t('Question (Arabic)', 'السؤال (عربي)')}</label>
        <input dir="rtl" value={q.text.ar} onChange={(e) => setText('ar', e.target.value)} style={{ width: '100%' }} />
      </div>

      <div className="field">
        <label>{t('Options', 'الخيارات')}</label>
        <div style={{ display: 'grid', gap: 6 }}>
          {q.options.map((opt, i) => {
            const isCorrect = Array.isArray(q.correct) ? q.correct.includes(i) : q.correct === i
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 32px', gap: 6, alignItems: 'center' }}>
                {q.type === 'multi'
                  ? <input type="checkbox" checked={isCorrect} onChange={() => toggleCorrectMulti(i)} title={t('Mark correct', 'إشارة صحيح')} />
                  : <input type="radio" name={`correct-${q.id}`} checked={isCorrect} onChange={() => setQ((x) => ({ ...x, correct: i }))} title={t('Mark correct', 'إشارة صحيح')} />}
                <input placeholder={`Option ${String.fromCharCode(65 + i)} — English`} value={opt.text.en} onChange={(e) => setOptText(i, 'en', e.target.value)} />
                <input dir="rtl" placeholder={`الخيار ${String.fromCharCode(65 + i)} — عربي`} value={opt.text.ar} onChange={(e) => setOptText(i, 'ar', e.target.value)} />
                <button type="button" className="btn sm" onClick={() => removeOption(i)} disabled={q.options.length <= 2}><Icon name="x" size={11} /></button>
              </div>
            )
          })}
        </div>
        {q.options.length < 6 && (
          <button type="button" className="btn sm mt-12" onClick={addOption}>
            <Icon name="plus" size={11} /> &nbsp; {t('Add option', 'إضافة خيار')}
          </button>
        )}
      </div>

      <div className="field">
        <label>{t('Explanation — shown after answering (English)', 'الشرح — يظهر بعد الإجابة (إنجليزي)')}</label>
        <input value={q.explanation.en} onChange={(e) => setExpl('en', e.target.value)} style={{ width: '100%' }} />
      </div>
      <div className="field">
        <label>{t('Explanation (Arabic)', 'الشرح (عربي)')}</label>
        <input dir="rtl" value={q.explanation.ar} onChange={(e) => setExpl('ar', e.target.value)} style={{ width: '100%' }} />
      </div>

      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn" onClick={onCancel}>{t('Cancel', 'إلغاء')}</button>
        <button type="button" className="btn primary" onClick={() => onSave(q)} disabled={!valid}>
          <Icon name="check" size={12} /> &nbsp; {t('Save question', 'حفظ السؤال')}
        </button>
      </div>
    </div>
  )
}
