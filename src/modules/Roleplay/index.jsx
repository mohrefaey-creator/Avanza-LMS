import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Pill from '../../components/Pill.jsx'
import Icon from '../../components/Icon.jsx'
import {
  chatAsRoleplayPersona,
  coachRoleplay,
  demoRoleplayReply,
  demoCoachFeedback,
  claudeReady,
} from '../../lib/claude.js'
import { DOCTOR_PERSONAS, COACH_TRIGGER } from '../../data/personas.js'

// ─────────────────────────────────────────────────────────────────────────────
// AI Roleplay Training — Six Doctor Personas
//
// Implements the training program from
// Medical_Rep_AI_RolePlay_Training_Manual.docx:
//   1. Trainee chooses one of six doctor personas (Evidence, Ego, Yes-Man,
//      Deal-Maker, Devil's Advocate, Friendly).
//   2. The doctor's full system prompt is sent to Claude. Claude stays in
//      character for the entire call, with full multi-turn memory.
//   3. When the trainee taps "End call & coach me", we send
//      COACH_TRIGGER ("COACH MODE: ACTIVATE") with the full transcript and
//      the persona's system prompt + coach suffix. Claude returns structured
//      JSON feedback (strengths, weaknesses, objections handled poorly,
//      score /100, key recommendation).
//   4. Voice mode (mic + TTS) is preserved from the previous implementation
//      — works in Chrome / Edge / Safari with the native Web Speech API.
//
// Falls back to deterministic demo replies when no Anthropic API key is set.
// ─────────────────────────────────────────────────────────────────────────────

const SR_CTOR = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null
const TTS_OK = typeof window !== 'undefined' && 'speechSynthesis' in window
const VOICE_SUPPORTED = !!SR_CTOR && TTS_OK

function pickVoice(lang) {
  if (!TTS_OK) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices?.length) return null
  const langPrefix = lang.split('-')[0]
  const matchLang = voices.filter((v) => v.lang?.toLowerCase().startsWith(langPrefix))
  const male = matchLang.find((v) => /male|david|daniel|alex|fred|tom|google.*male|microsoft.*\b(david|mark|guy|ryan)\b/i.test(v.name))
  return male || matchLang[0] || voices[0]
}

const DIFFICULTY_COLORS = {
  easy:   { bg: 'var(--green-l)', fg: 'var(--green)' },
  medium: { bg: 'var(--blue-l)',  fg: 'var(--blue-d)' },
  hard:   { bg: 'var(--amb-l)',   fg: 'var(--amb)' },
  expert: { bg: 'var(--red-l)',   fg: 'var(--red)' },
}

export default function Roleplay() {
  const { t, lang, logAction } = useApp()
  const [persona, setPersona] = useState(DOCTOR_PERSONAS[0])
  const [started, setStarted] = useState(false)
  const [history, setHistory] = useState([])  // [{ role: 'user'|'assistant', content: string }]
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [scored, setScored] = useState(null)
  const [coachLoading, setCoachLoading] = useState(false)
  const [callError, setCallError] = useState(null)
  const logRef = useRef(null)

  // Voice state
  const [voiceMode, setVoiceMode] = useState(false)
  const [handsFree, setHandsFree] = useState(false)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [voiceError, setVoiceError] = useState(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [history, busy])

  // Warm up TTS voices (Chrome populates async)
  useEffect(() => {
    if (!TTS_OK) return
    const handler = () => {}
    window.speechSynthesis.onvoiceschanged = handler
    window.speechSynthesis.getVoices()
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])

  // Build SpeechRecognition instance for the current lang
  useEffect(() => {
    if (!SR_CTOR) return
    const r = new SR_CTOR()
    r.continuous = false
    r.interimResults = true
    r.maxAlternatives = 1
    r.lang = lang === 'ar' ? 'ar-SA' : 'en-US'
    recognitionRef.current = r
    return () => { try { r.abort() } catch (_) {} }
  }, [lang])

  const speak = (text) => {
    if (!TTS_OK || !voiceMode) return
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang === 'ar' ? 'ar-SA' : 'en-US'
      const v = pickVoice(u.lang)
      if (v) u.voice = v
      u.rate = 1.0
      u.pitch = 0.95
      u.onstart = () => setSpeaking(true)
      u.onend = () => {
        setSpeaking(false)
        if (handsFree && voiceMode && started) {
          setTimeout(() => startListening(), 250)
        }
      }
      u.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(u)
    } catch (_) { setSpeaking(false) }
  }

  const stopSpeaking = () => {
    if (TTS_OK) window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  const startListening = () => {
    if (!recognitionRef.current || listening) return
    setVoiceError(null)
    setInterim('')
    const r = recognitionRef.current
    let finalTranscript = ''
    r.onresult = (e) => {
      let interimText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript
        if (e.results[i].isFinal) finalTranscript += text
        else interimText += text
      }
      setInterim((finalTranscript + ' ' + interimText).trim())
    }
    r.onerror = (e) => {
      setListening(false)
      setInterim('')
      const map = {
        'not-allowed':   t('Microphone access denied. Allow it in browser settings.', 'تم رفض الميكروفون. اسمح به في إعدادات المتصفح.'),
        'no-speech':     t('No speech detected — try again.',                          'لم يُكتشف صوت — حاول مجددًا.'),
        'audio-capture': t('No microphone found.',                                     'لم يتم العثور على ميكروفون.'),
        'network':       t('Network error during transcription.',                      'خطأ شبكة أثناء النسخ.'),
      }
      setVoiceError(map[e.error] || `Speech error: ${e.error}`)
    }
    r.onend = () => {
      setListening(false)
      const cleaned = finalTranscript.trim()
      setInterim('')
      if (cleaned) send(cleaned)
    }
    try { r.start(); setListening(true) }
    catch (e) { setListening(false); setVoiceError(e?.message || 'Could not start mic') }
  }

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      try { recognitionRef.current.stop() } catch (_) {}
    }
  }

  const start = () => {
    setStarted(true)
    setScored(null)
    setHistory([])
    setCallError(null)
    logAction('roleplay_started', persona.id, { persona: persona.code, voice: voiceMode })
  }

  const reset = () => {
    stopSpeaking()
    stopListening()
    setStarted(false)
    setHistory([])
    setDraft('')
    setScored(null)
    setCallError(null)
  }

  const send = async (overrideText) => {
    const text = (overrideText ?? draft).trim()
    if (!text || busy || coachLoading) return

    // Block COACH_TRIGGER from being used as a regular message — it goes
    // through endCallAndCoach() so we can capture structured feedback.
    if (text.toUpperCase().startsWith(COACH_TRIGGER)) {
      endCallAndCoach()
      return
    }

    const nextHistory = [...history, { role: 'user', content: text }]
    setHistory(nextHistory)
    setDraft('')
    setBusy(true)
    setCallError(null)

    try {
      let reply
      if (claudeReady) {
        reply = await chatAsRoleplayPersona(nextHistory, persona.systemPrompt, { max_tokens: 600 })
      } else {
        // Demo mode — cycle the persona's pre-written demo replies.
        await new Promise((r) => setTimeout(r, 700))
        const turnIndex = nextHistory.filter((m) => m.role === 'user').length - 1
        reply = demoRoleplayReply(persona, turnIndex)
      }
      setHistory((h) => [...h, { role: 'assistant', content: reply }])
      if (voiceMode) speak(reply)
    } catch (e) {
      setCallError(e?.message || 'Claude request failed')
    } finally {
      setBusy(false)
    }
  }

  const endCallAndCoach = async () => {
    if (!history.length || coachLoading) return
    stopSpeaking()
    stopListening()
    setCoachLoading(true)
    setCallError(null)
    try {
      let feedback
      if (claudeReady) {
        feedback = await coachRoleplay(history, persona)
      } else {
        await new Promise((r) => setTimeout(r, 1100))
        feedback = demoCoachFeedback(history, persona)
      }
      setScored(feedback)
      logAction('roleplay_scored', persona.id, {
        totalScore: feedback.totalScore,
        persona: persona.code,
        repTurns: history.filter((m) => m.role === 'user').length,
      })
    } catch (e) {
      setCallError(e?.message || 'Coach mode failed')
    } finally {
      setCoachLoading(false)
    }
  }

  const useOpener = () => setDraft(lang === 'ar' ? persona.openingLineAr : persona.openingLine)

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('AI Roleplay Training', 'محاكاة بالذكاء الاصطناعي')}</h1>
          <div className="subtitle">
            {t('Six doctor personas. Practice real medical-rep calls. AI stays in character — Claude scores you when you tap "End call & coach me".',
               'ست شخصيات طبية. تدرب على مكالمات مندوب طبي حقيقية. الذكاء الاصطناعي يبقى في الشخصية ويقيّم أداءك عند انتهاء المكالمة.')}
          </div>
        </div>
        <div className="row">
          <Pill variant="purple">claude-opus-4-7</Pill>
          {!claudeReady && <Pill variant="amber">{t('Demo mode', 'وضع العرض')}</Pill>}
          {VOICE_SUPPORTED && (
            <button
              className={`btn ${voiceMode ? 'primary' : ''}`}
              onClick={() => {
                if (voiceMode) { stopListening(); stopSpeaking() }
                setVoiceMode((v) => !v)
              }}
              title={t('Toggle voice mode', 'تبديل وضع الصوت')}
            >
              <Icon name={voiceMode ? 'message' : 'play'} size={14} /> &nbsp;
              {voiceMode ? t('Voice ON', 'الصوت مفعّل') : t('Voice OFF', 'الصوت معطل')}
            </button>
          )}
        </div>
      </div>

      {!VOICE_SUPPORTED && voiceMode && (
        <div className="card mb-12" style={{ background: 'var(--amb-l)', borderColor: 'var(--amb-m)' }}>
          <div className="row" style={{ alignItems: 'center', gap: 8 }}>
            <Icon name="bell" size={14} color="var(--amb)" />
            <div style={{ fontSize: 12 }}>
              {t('Voice mode is not supported in this browser. Use Chrome / Edge / Safari for mic + speech.',
                 'الوضع الصوتي غير مدعوم. استخدم Chrome / Edge / Safari لتفعيل الميكروفون والتحدث.')}
            </div>
          </div>
        </div>
      )}

      {!started && (
        <PersonaPicker
          t={t}
          lang={lang}
          selected={persona}
          onSelect={setPersona}
          onStart={start}
        />
      )}

      {started && (
        <div className="rp-call-grid">
          <div className="chat-pane">
            <div className="rp-call-header">
              <div className="team-avatar" style={{ width: 36, height: 36, fontSize: 12, background: persona.bg, color: persona.color }}>
                {persona.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{lang === 'ar' ? persona.nameAr : persona.name}</div>
                <div className="muted" style={{ fontSize: 11 }}>
                  {lang === 'ar' ? persona.specialtyAr : persona.specialty} · {persona.position}
                </div>
              </div>
              <button className="btn sm" onClick={reset}>
                <Icon name="x" size={11} /> &nbsp; {t('New call', 'مكالمة جديدة')}
              </button>
            </div>

            <div className="chat-log" ref={logRef}>
              {history.length === 0 && (
                <div className="rp-empty">
                  <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 8 }}>
                    {t('Open the call as if you just walked into the doctor\'s office.',
                       'ابدأ المكالمة كأنك دخلت لتوّك إلى عيادة الطبيب.')}
                  </div>
                  <button className="btn" onClick={useOpener}>
                    <Icon name="message" size={12} /> &nbsp; {t('Use suggested opener', 'استخدم الافتتاحية المقترحة')}
                  </button>
                </div>
              )}

              {history.map((m, i) => (
                <div key={i} className={`chat-msg ${m.role === 'user' ? 'me' : 'them'}`}>{m.content}</div>
              ))}

              {busy && <div className="chat-msg them" style={{ opacity:.6 }}>{t('Doctor is responding…', 'الطبيب يرد…')}</div>}
              {voiceMode && interim && (
                <div className="chat-msg me" style={{ opacity: .65, fontStyle: 'italic' }}>{interim}…</div>
              )}
            </div>

            {voiceMode && (
              <div className="rp-voice-strip" style={{
                background: listening ? 'var(--red-l)' : speaking ? 'var(--blue-l)' : 'var(--bg)',
                color: listening ? 'var(--red)' : speaking ? 'var(--blue-d)' : 'var(--tx2)',
              }}>
                {listening && (
                  <>
                    <span className="rp-pulse-dot" />
                    {t('Listening… speak now', 'يستمع… تحدث الآن')}
                  </>
                )}
                {speaking && (
                  <>
                    <Icon name="message" size={12} />
                    {t('Doctor speaking…', 'الطبيب يتحدث…')}
                    <button className="btn sm" style={{ marginInlineStart: 'auto' }} onClick={stopSpeaking}>
                      <Icon name="x" size={11} /> &nbsp; {t('Stop', 'إيقاف')}
                    </button>
                  </>
                )}
                {!listening && !speaking && (
                  <>
                    <Icon name="play" size={12} />
                    {t('Tap the mic to speak', 'اضغط الميكروفون للتحدث')}
                    <label style={{ marginInlineStart: 'auto', display: 'flex', gap: 6, alignItems: 'center', fontSize: 10 }}>
                      <input type="checkbox" checked={handsFree} onChange={(e) => setHandsFree(e.target.checked)} />
                      {t('Hands-free', 'بدون يدين')}
                    </label>
                  </>
                )}
              </div>
            )}

            {(voiceError || callError) && (
              <div style={{ padding: '8px 12px', background: 'var(--red-l)', color: 'var(--red)', fontSize: 11, borderTop: '1px solid var(--red-m)' }}>
                {voiceError || callError}
              </div>
            )}

            {voiceMode ? (
              <div className="rp-voice-input">
                <button
                  type="button"
                  onClick={listening ? stopListening : startListening}
                  disabled={busy || speaking || coachLoading}
                  title={listening ? t('Stop recording', 'إيقاف التسجيل') : t('Start recording', 'بدء التسجيل')}
                  className="rp-mic-btn"
                  style={{
                    background: listening ? 'var(--red)' : 'var(--blue)',
                    boxShadow: listening
                      ? '0 0 0 6px rgba(220,38,38,.18), 0 6px 18px rgba(220,38,38,.32)'
                      : '0 6px 18px rgba(37,99,235,.30)',
                  }}
                >
                  {listening
                    ? <svg width="24" height="24" viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2" fill="white" /></svg>
                    : <MicIcon />}
                </button>
                <div style={{ fontSize: 11, color: 'var(--tx2)', maxWidth: 180, lineHeight: 1.4 }}>
                  {listening
                    ? t('Click again or stop talking to send.', 'اضغط مجددًا أو توقف عن الكلام للإرسال.')
                    : busy
                    ? t('Doctor is thinking…', 'الطبيب يفكر…')
                    : speaking
                    ? t('Wait for the doctor to finish.', 'انتظر حتى ينتهي الطبيب.')
                    : t('Click the mic and speak as if you\'re on a real doctor call.', 'اضغط الميكروفون وتحدث كأنك في مكالمة حقيقية.')}
                </div>
              </div>
            ) : (
              <div className="chat-input">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t('Type your message as the medical rep…', 'اكتب رسالتك كمندوب طبي…')}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                />
                <button className="btn primary" onClick={() => send()} disabled={!draft.trim() || busy || coachLoading}>
                  <Icon name="arrow" size={14} />
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
            <div className="card">
              <h3>{t('How to win this doctor', 'كيف تكسب هذا الطبيب')}</h3>
              <div className="muted" style={{ fontSize: 11, lineHeight: 1.6 }}>{persona.wins}</div>
              <div className="mt-12" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--tx2)' }}>
                  {t('Persona traits', 'سمات الشخصية')}
                </div>
                <ul style={{ paddingInlineStart: 16, fontSize: 11, lineHeight: 1.6, margin: '6px 0 0' }}>
                  {persona.traits.slice(0, 4).map((tr, i) => <li key={i}>{tr}</li>)}
                </ul>
              </div>
            </div>

            <div className="card">
              <h3>{t('Live cues', 'تلميحات حية')}</h3>
              <ul style={{ paddingInlineStart: 18, fontSize: 12, lineHeight: 1.7, margin: 0 }}>
                <li>{t('Stay on-label', 'التزم بالتسمية')}</li>
                <li>{t('Provide fair balance', 'قدّم عرضًا متوازنًا')}</li>
                <li>{t('Reference SmPC', 'استند إلى SmPC')}</li>
                <li>{t('Capture AE if mentioned', 'سجّل أي أثر جانبي')}</li>
                <li>{t('Close with a concrete next step', 'اختم بخطوة ملموسة')}</li>
              </ul>
              <button
                className="btn primary mt-16"
                style={{ width: '100%' }}
                onClick={endCallAndCoach}
                disabled={!history.length || busy || coachLoading}
              >
                <Icon name="award" size={14} /> &nbsp;
                {coachLoading
                  ? t('Coach is reviewing…', 'المدرب يراجع…')
                  : t('End call & coach me', 'إنهاء وتقييم')}
              </button>
              <div className="muted" style={{ fontSize: 10, marginTop: 6 }}>
                {t('Sends "COACH MODE: ACTIVATE" to Claude with the full transcript.',
                   'يرسل "COACH MODE: ACTIVATE" مع نص المكالمة الكامل.')}
              </div>
            </div>

            {scored && <CoachReport feedback={scored} persona={persona} t={t} />}
          </div>
        </div>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Persona picker — landing screen before a call starts
// ─────────────────────────────────────────────────────────────────────────────
function PersonaPicker({ t, lang, selected, onSelect, onStart }) {
  return (
    <>
      <div className="card mb-16">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ marginTop: 0 }}>{t('Choose your training persona', 'اختر شخصية التدريب')}</h3>
            <div className="muted" style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 640 }}>
              {t('Each persona stress-tests a different selling skill. Recommended order: Friendly → Yes-Man → Devil\'s Advocate → Deal-Maker → Ego → Evidence.',
                 'كل شخصية تختبر مهارة بيع مختلفة. الترتيب الموصى به: الودود → الموافق → المعترضة → التاجر → المكانة → الدليل.')}
            </div>
          </div>
          <button className="btn primary" onClick={onStart}>
            <Icon name="play" size={14} /> &nbsp;
            {t('Begin call with', 'ابدأ مع')} {lang === 'ar' ? selected.nameAr : selected.name}
          </button>
        </div>
      </div>

      <div className="rp-persona-grid">
        {DOCTOR_PERSONAS.map((p) => (
          <PersonaCard
            key={p.id}
            persona={p}
            active={selected.id === p.id}
            onClick={() => onSelect(p)}
            lang={lang}
            t={t}
          />
        ))}
      </div>
    </>
  )
}

function PersonaCard({ persona, active, onClick, lang, t }) {
  const diff = DIFFICULTY_COLORS[persona.difficulty] || DIFFICULTY_COLORS.medium
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rp-persona-card ${active ? 'active' : ''}`}
      style={{ borderColor: active ? persona.color : 'var(--border)', boxShadow: active ? `0 0 0 2px ${persona.color}33` : undefined }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div className="team-avatar" style={{ width: 40, height: 40, fontSize: 13, background: persona.bg, color: persona.color }}>
          {persona.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'start' }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{lang === 'ar' ? persona.nameAr : persona.name}</div>
          <div className="muted" style={{ fontSize: 11 }}>{lang === 'ar' ? persona.specialtyAr : persona.specialty}</div>
        </div>
        <span style={{
          background: diff.bg,
          color: diff.fg,
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          padding: '3px 7px',
          borderRadius: 999,
          letterSpacing: 0.4,
        }}>
          {persona.difficulty}
        </span>
      </div>
      <div style={{ textAlign: 'start' }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: persona.color, marginBottom: 4 }}>
          {lang === 'ar' ? persona.titleAr : persona.title}
        </div>
        <div className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
          {lang === 'ar' ? persona.summaryAr : persona.summary}
        </div>
      </div>
      <div className="row" style={{ marginTop: 10, gap: 6, flexWrap: 'wrap' }}>
        <span className="rp-tag">{persona.durationMin} {t('min call', 'دقيقة')}</span>
        <span className="rp-tag">{t('Age', 'العمر')} {persona.age}</span>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Coach report — structured feedback from Claude (or demo equivalent)
// ─────────────────────────────────────────────────────────────────────────────
function CoachReport({ feedback, persona, t }) {
  const total = Number(feedback.totalScore) || 0
  const passing = total >= 80
  const tone = total >= 80 ? 'var(--green)' : total >= 60 ? 'var(--amb)' : 'var(--red)'

  return (
    <div className="card" style={{ background: 'var(--bg)' }}>
      <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>{t('Coach Report', 'تقرير المدرب')}</h3>
        <span style={{
          background: passing ? 'var(--green-l)' : 'var(--amb-l)',
          color: passing ? 'var(--green)' : 'var(--amb)',
          fontSize: 9,
          fontWeight: 700,
          padding: '3px 7px',
          borderRadius: 999,
          textTransform: 'uppercase',
        }}>
          {passing ? t('Pass', 'نجح') : t('Needs practice', 'يحتاج تدريب')}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: tone, lineHeight: 1 }}>{total}</div>
        <div className="muted" style={{ fontSize: 11 }}>/ 100 · {persona.code}</div>
      </div>

      <div className="mt-12" style={{ display: 'grid', gap: 4, fontSize: 11 }}>
        <ScoreRow k={t('Clinical accuracy', 'دقة سريرية')}     v={feedback.clinicalAccuracy} />
        <ScoreRow k={t('Compliance',         'الامتثال')}      v={feedback.compliance} />
        <ScoreRow k={t('Objection handling', 'الاعتراضات')}    v={feedback.objectionHandling} />
        <ScoreRow k={t('Closing',            'الاختتام')}     v={feedback.closing} />
      </div>

      {feedback.strengths?.length > 0 && (
        <FeedbackBlock label={t('Strengths', 'نقاط القوة')} color="var(--green)" items={feedback.strengths} />
      )}
      {feedback.weaknesses?.length > 0 && (
        <FeedbackBlock label={t('Areas to improve', 'نقاط للتحسين')} color="var(--amb)" items={feedback.weaknesses} />
      )}

      {feedback.objectionsHandledPoorly?.length > 0 && (
        <div className="mt-12">
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', marginBottom: 6 }}>
            {t('Objections handled poorly', 'اعتراضات لم تُعالج جيدًا')}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {feedback.objectionsHandledPoorly.map((o, i) => (
              <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r3)', padding: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{o.objection}</div>
                <div className="muted" style={{ fontSize: 11, marginBottom: 6 }}>
                  <strong>{t('You said:', 'قلت:')}</strong> {o.repResponse}
                </div>
                <div style={{ fontSize: 11, color: 'var(--green)' }}>
                  <strong>{t('Better:', 'أفضل:')}</strong> {o.betterResponse}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {feedback.keyRecommendation && (
        <div className="mt-12" style={{ background: 'var(--blue-l)', border: '1px solid var(--blue-m)', borderRadius: 'var(--r3)', padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue-d)', textTransform: 'uppercase', marginBottom: 4 }}>
            {t('Key recommendation', 'التوصية الرئيسية')}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>{feedback.keyRecommendation}</div>
        </div>
      )}
    </div>
  )
}

function ScoreRow({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid var(--border)' }}>
      <span>{k}</span>
      <span style={{ fontWeight: 700 }}>{v ?? '—'}</span>
    </div>
  )
}

function FeedbackBlock({ label, color, items }) {
  return (
    <div className="mt-12">
      <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <ul style={{ paddingInlineStart: 16, margin: 0, fontSize: 11, lineHeight: 1.6 }}>
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M9 21h6" />
    </svg>
  )
}
