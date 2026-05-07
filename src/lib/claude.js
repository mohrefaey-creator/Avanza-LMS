// Anthropic Claude client wrapper. All AI calls flow through this module.
//
// ─────────────────────────────────────────────────────────────────────────────
// BACKEND CONTRACT (production deployment)
// ─────────────────────────────────────────────────────────────────────────────
// In production these calls go server-side (Edge function / Next.js route /
// Vercel Function) so the API key is never exposed to the browser. The browser
// posts to /api/claude/* with a JSON body, the server attaches the key and
// proxies to api.anthropic.com.
//
// Endpoint contract:
//
//   POST /api/claude/generate-assessment
//   Body: {
//     courseId:     string,
//     courseTitle:  string,
//     therapyArea:  string,
//     product:      string,
//     contentType:  'pdf'|'video'|'youtube'|'audio'|'ppt'|'doc'|'scorm',
//     contentUrl:   string,            // signed URL to file in object storage
//     youtubeId?:   string,            // when contentType === 'youtube'
//     transcript?:  string,            // pre-extracted transcript (for video/audio)
//     language:     'en'|'ar'|'both',
//     numQuestions: number,            // default 10
//     mix:          { mcq: 6, multi: 2, scenario: 2 },
//     passMark:     number,
//   }
//
//   Server-side pipeline:
//     1. Resolve content
//        - pdf/doc/ppt → text extraction (pdf.js / mammoth / officegen)
//        - video/audio → Whisper-1 transcription via OpenAI or Deepgram
//        - youtube     → youtube-transcript-api (or yt-dlp + Whisper fallback)
//        - scorm       → unzip and extract HTML/SCO text
//     2. Chunk text to fit Claude's context window (claude-opus-4-7: 200K tokens)
//     3. Call Anthropic Messages API with the prompt below + extracted content
//     4. Parse JSON response, validate against schema
//     5. Persist questions in 'questions' table with source='ai-generated',
//        status='pending-review'
//     6. Return generated questions for admin review
//
//   Response: {
//     questions: Question[],
//     model: 'claude-opus-4-7',
//     promptTokens, completionTokens,
//     generatedAt: ISO8601,
//   }
//
// ─────────────────────────────────────────────────────────────────────────────
// QUESTION SCHEMA (matches Supabase 'questions' table)
// ─────────────────────────────────────────────────────────────────────────────
//   {
//     id: uuid,
//     courseId: uuid,
//     type: 'mcq' | 'multi' | 'scenario' | 'free-text' | 'hotspot' | 'drag-drop',
//     text: { en: string, ar: string },
//     options: [{ id: string, text: { en: string, ar: string } }] | null,
//     correctAnswers: string[],                    // option ids
//     explanation: { en: string, ar: string },
//     difficulty: 'easy' | 'medium' | 'hard',
//     source: 'manual' | 'ai-generated',
//     reviewedBy: uuid | null,
//     reviewedAt: ISO8601 | null,
//     status: 'draft' | 'pending-review' | 'approved' | 'archived',
//     createdAt: ISO8601,
//   }
// ─────────────────────────────────────────────────────────────────────────────

import { COACH_PROMPT_SUFFIX } from '../data/personas.js'

// All Claude calls go through our own /api/claude serverless function so the
// real ANTHROPIC_API_KEY stays on the server. The browser never sees it.
//
// Local dev:    run `vercel dev` (NOT `npm run dev`) so the /api route works.
//               Set VITE_AI_ENABLED=true and ANTHROPIC_API_KEY=... in .env.local
// Production:   set both env vars in Vercel project settings.
const API_URL = '/api/claude'
// Tolerate stray BOM / whitespace some shells inject when piping env values.
const AI_ENABLED = String(import.meta.env.VITE_AI_ENABLED || '').replace(/^﻿/, '').trim() === 'true'
const MODEL_OPUS = 'claude-opus-4-7'
const MODEL_HAIKU = 'claude-haiku-4-5-20251001'

export const claudeReady = AI_ENABLED

async function callClaude(messages, { model = MODEL_OPUS, max_tokens = 4096, system } = {}) {
  if (!AI_ENABLED) throw new Error('AI is not enabled. Set VITE_AI_ENABLED=true and run via `vercel dev` or deploy to Vercel.')
  const body = { model, max_tokens, messages }
  if (system) body.system = system
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.error || `Claude proxy error: ${res.status}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

export async function generateMicrolearningFromPDF(base64Data) {
  return callClaude([{
    role: 'user',
    content: [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } },
      { type: 'text', text: `You are a pharma L&D content designer. From this product PDF, generate:
1. A 5-minute microlearning module in JSON: { title, titleAr, sections: [{ heading, body, keyPoint }] }
2. A 12-question quiz bank (MCQ, multiple-response, scenario) in JSON.
Output JSON only, with both English and Arabic versions.` }
    ]
  }], { model: MODEL_OPUS, max_tokens: 8000 })
}

export async function generateQuizFromText(text) {
  return callClaude([{
    role: 'user',
    content: `Generate 10 MCQ pharma quiz questions (4 options each) from the following content. Output JSON array.
Content:
${text}`
  }], { model: MODEL_HAIKU, max_tokens: 2000 })
}

export async function scoreRoleplayTranscript(transcript, persona, scenario) {
  return callClaude([{
    role: 'user',
    content: `You are a pharma compliance and selling-skills evaluator.
Persona: ${persona}
Scenario: ${scenario}
Transcript:
${transcript}

Score the rep's performance from 0-100 across:
- Clinical accuracy (no off-label claims, fair balance)
- Compliance (ABPI/PhRMA codes, AE reporting awareness)
- Objection handling
- Closing technique

Output JSON: { totalScore, clinicalAccuracy, compliance, objectionHandling, closing, strengths, improvements }`
  }], { model: MODEL_OPUS, max_tokens: 2000 })
}

export async function chatAsPersona(history, persona) {
  return callClaude([{
    role: 'user',
    content: `Roleplay as ${persona}. Stay in character. Push back on weak claims. Last messages:\n${history}`
  }], { model: MODEL_OPUS, max_tokens: 600 })
}

// ─────────────────────────────────────────────────────────────────────────────
// Roleplay Training (Medical_Rep_AI_RolePlay_Training_Manual.docx)
// ─────────────────────────────────────────────────────────────────────────────
// chatAsRoleplayPersona — routes a multi-turn conversation through the persona
// system prompt so Claude stays in character for the entire call. The caller
// owns the message history and just appends new user/assistant turns.
//
// History shape (matches Anthropic Messages API):
//   [{ role: 'user' | 'assistant', content: string }, ...]
//
// Returns the assistant's next reply string. Throws if no API key configured;
// the UI falls back to demoRoleplayReply() in that case.
export async function chatAsRoleplayPersona(messages, systemPrompt, opts = {}) {
  return callClaude(messages, {
    model: opts.model || MODEL_OPUS,
    max_tokens: opts.max_tokens || 600,
    system: systemPrompt,
  })
}

// coachRoleplay — sends the full transcript back to Claude with the same
// persona system prompt + a coach-mode suffix and asks for structured JSON
// feedback. Returns the parsed feedback object.
export async function coachRoleplay(transcript, persona) {
  const systemPrompt = persona.systemPrompt + COACH_PROMPT_SUFFIX

  const messages = [
    ...transcript,
    { role: 'user', content: 'COACH MODE: ACTIVATE' },
  ]

  const raw = await callClaude(messages, {
    model: MODEL_OPUS,
    max_tokens: 2000,
    system: systemPrompt,
  })

  // Strip any accidental markdown fencing before parsing.
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    throw new Error('Coach mode returned invalid JSON: ' + cleaned.slice(0, 200))
  }
}

// demoRoleplayReply — deterministic stand-in used when no API key is set.
// Cycles through the persona's `demoReplies` based on conversation depth so
// the trainer can demo the UI end-to-end without an Anthropic key.
export function demoRoleplayReply(persona, turnIndex) {
  const replies = persona.demoReplies || []
  if (!replies.length) return "Yes, go ahead — I'm listening."
  return replies[Math.min(turnIndex, replies.length - 1)]
}

// demoCoachFeedback — deterministic structured feedback used when no API key
// is set. Score is based on transcript length so longer, more substantive
// calls land closer to a passing grade.
export function demoCoachFeedback(transcript, persona) {
  const repTurns = transcript.filter((m) => m.role === 'user').length
  const totalChars = transcript.filter((m) => m.role === 'user').reduce((s, m) => s + m.content.length, 0)
  const base = Math.min(92, 55 + Math.floor(totalChars / 60) + repTurns * 2)
  const jitter = (n, d = 6) => Math.max(40, Math.min(98, n + Math.floor(Math.random() * d) - Math.floor(d / 2)))

  return {
    totalScore: base,
    clinicalAccuracy: jitter(base - 2),
    compliance: jitter(base + 4),
    objectionHandling: jitter(base - 6),
    closing: jitter(base - 4),
    strengths: [
      'Opened with a clear purpose statement and respected the doctor\'s time.',
      'Acknowledged the doctor\'s concerns before responding instead of getting defensive.',
      'Referenced data points (study name, endpoint) rather than relying on adjectives.',
    ],
    weaknesses: [
      'Did not extract a concrete behavioral commitment before closing the call.',
      'Missed an opportunity to redirect a borderline request to medical affairs.',
      'Closing lacked a specific next step with a date and deliverable.',
    ],
    objectionsHandledPoorly: [
      {
        objection: '"All companies say that — where\'s your head-to-head data?"',
        repResponse: 'Generic efficacy claim with no comparator data offered.',
        betterResponse: 'Acknowledge the challenge, name the head-to-head trial, cite the primary endpoint and p-value, then offer to leave a reprint.',
      },
    ],
    keyRecommendation: `Focus next attempt on ${persona.coachFocus}. Re-run this persona until you score 8/10 consistently before rotating.`,
    personaSpecificFocus: persona.coachFocus,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// generateAssessmentFromCourse
// ─────────────────────────────────────────────────────────────────────────────
// Sends course metadata + extracted content to Claude and returns a structured
// question bank. Falls back to a deterministic mock when no API key is set so
// the UI flow can be demoed end-to-end.
//
// In production, never call this from the browser — proxy via your backend so
// the API key stays private and the heavy content extraction (PDF parsing,
// Whisper transcription, YouTube transcript fetch) happens server-side.

const SYSTEM_PROMPT = `You are a pharmaceutical L&D content designer building assessments for medical reps, MSLs, KAMs, and marketing teams.

When generating quiz questions you MUST:
- Stay strictly on-label for the product mentioned. Never invent off-label claims.
- Apply fair balance — every efficacy claim has a counterpoint or AE consideration where appropriate.
- Reference SmPC / prescribing information as the source of truth.
- Cover MoA, clinical evidence, dosing, AE/PV reporting, drug-drug interactions, contraindications, and selling-skills.
- Use bilingual content (English + Arabic) for every question, option, and explanation.
- Output JSON only. No prose, no markdown fences.

Schema:
{
  "questions": [{
    "type": "mcq" | "multi" | "scenario",
    "text": { "en": string, "ar": string },
    "options": [{ "text": { "en": string, "ar": string } }],
    "correct": number | number[],   // index for mcq/scenario, array for multi
    "explanation": { "en": string, "ar": string },
    "difficulty": "easy" | "medium" | "hard"
  }]
}`

export async function generateAssessmentFromCourse(course, opts = {}) {
  const numQuestions = opts.numQuestions || 10
  const mix = opts.mix || { mcq: 6, multi: 2, scenario: 2 }

  if (!claudeReady) {
    // Deterministic mock used in browser demo. In production this branch is
    // unreachable — the server always has the key.
    await new Promise((r) => setTimeout(r, 1400))
    return mockAssessment(course, numQuestions)
  }

  const userMessage = buildAssessmentPrompt(course, numQuestions, mix)

  const raw = await callClaude(
    [{ role: 'user', content: userMessage }],
    { model: MODEL_OPUS, max_tokens: 8000, system: SYSTEM_PROMPT },
  )

  try {
    const parsed = JSON.parse(raw)
    return {
      questions: parsed.questions || [],
      model: MODEL_OPUS,
      generatedAt: new Date().toISOString(),
      source: 'claude',
    }
  } catch (e) {
    throw new Error('Claude returned invalid JSON: ' + raw.slice(0, 200))
  }
}

function buildAssessmentPrompt(course, numQuestions, mix) {
  const contentLine = (() => {
    if (course.type === 'youtube' && course.youtubeId) {
      return `YouTube source: https://www.youtube.com/watch?v=${course.youtubeId}\n(Server should attach the auto-fetched transcript before sending; if absent, infer from title and metadata.)`
    }
    if (course.contentFilename) {
      return `Uploaded file: ${course.contentFilename} (${course.type.toUpperCase()})\n(Server should attach extracted text/transcript here.)`
    }
    return `Content URL: ${course.contentUrl || 'n/a'}`
  })()

  return `Generate a ${numQuestions}-question pharma assessment for this course.

Course title: ${course.title}
Therapy area: ${course.therapyArea}
Product: ${course.product}
Version: ${course.version}
Pass mark: ${course.passMark}%
Description: ${course.description || '(none)'}

${contentLine}

Question mix:
- ${mix.mcq} MCQ (single correct answer, 4 options each)
- ${mix.multi} multi-select (2–3 correct from 4 options)
- ${mix.scenario} scenario-based (rep is in front of an HCP, choose best response)

Each question must include English and Arabic for the question, every option, and the explanation. Output JSON only.`
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic mock — used only when no API key is configured.
// Tailors questions to the course's therapy area + product so the demo feels
// realistic without an actual backend.
// ─────────────────────────────────────────────────────────────────────────────
function mockAssessment(course, n) {
  const ta = (course.therapyArea || 'General').toLowerCase()
  const prod = course.product || 'this product'
  const taProduct = `${course.therapyArea} / ${prod}`

  const bank = [
    {
      type: 'mcq',
      text: {
        en: `According to current ${course.therapyArea} guidance, ${prod} is FIRST-LINE in which patient profile?`,
        ar: `وفقًا للإرشادات الحالية لـ${course.therapyArea}، ${prod} هو الخط الأول في أي ملف للمريض؟`,
      },
      options: [
        { text: { en: 'Treatment-naïve adults with eligible biomarker',                      ar: 'بالغون لم يُعالجوا سابقًا ولديهم العلامة الحيوية المناسبة' } },
        { text: { en: 'Patients who failed three prior lines of therapy',                    ar: 'مرضى فشل لديهم ثلاثة خطوط علاجية سابقة' } },
        { text: { en: 'Pediatric patients under 12',                                          ar: 'الأطفال دون سن 12' } },
        { text: { en: 'Pregnant patients with gestational disease',                           ar: 'المريضات الحوامل بمرض حملي' } },
      ],
      correct: 0,
      explanation: {
        en: `Per the SmPC, ${prod} is indicated as first-line therapy in eligible adult patients with the appropriate biomarker.`,
        ar: `وفقًا لـ SmPC، يُستخدم ${prod} كعلاج خط أول في البالغين المؤهلين الذين يحملون العلامة الحيوية المناسبة.`,
      },
      difficulty: 'medium',
    },
    {
      type: 'mcq',
      text: {
        en: `Which adverse event must be reported to Pharmacovigilance within 24 hours under EU GVP?`,
        ar: 'أي أثر جانبي يجب الإبلاغ عنه لقسم اليقظة الدوائية خلال 24 ساعة وفقًا لـ EU GVP؟',
      },
      options: [
        { text: { en: 'Mild headache that self-resolves',                                     ar: 'صداع خفيف يزول من تلقاء نفسه' } },
        { text: { en: 'Suspected unexpected serious adverse reaction (SUSAR)',                ar: 'تفاعل خطير غير متوقع مشتبه به (SUSAR)' } },
        { text: { en: 'Common nausea after a single dose',                                    ar: 'غثيان شائع بعد جرعة واحدة' } },
        { text: { en: 'Mild skin redness at the injection site lasting one day',              ar: 'احمرار جلدي خفيف في موضع الحقن يستمر يومًا واحدًا' } },
      ],
      correct: 1,
      explanation: {
        en: 'SUSARs are reported within 24 hours per EU GVP module VI. Mild self-resolving events follow standard reporting timelines.',
        ar: 'يتم الإبلاغ عن SUSAR خلال 24 ساعة وفقًا لـ EU GVP الوحدة السادسة.',
      },
      difficulty: 'easy',
    },
    {
      type: 'multi',
      text: {
        en: `Which of the following are TRUE about ${prod} dose adjustment? (Select all that apply)`,
        ar: `أي من العبارات التالية صحيحة بشأن تعديل جرعة ${prod}؟ (اختر كل ما ينطبق)`,
      },
      options: [
        { text: { en: 'Reduce dose in moderate hepatic impairment',                           ar: 'تقليل الجرعة عند القصور الكبدي المتوسط' } },
        { text: { en: 'Reduce dose in severe renal impairment',                               ar: 'تقليل الجرعة عند القصور الكلوي الشديد' } },
        { text: { en: 'No adjustment needed in geriatric patients',                           ar: 'لا حاجة لتعديل عند كبار السن' } },
        { text: { en: 'Discontinue if Grade 3 immune-mediated AE occurs',                     ar: 'إيقاف الدواء عند ظهور أثر مناعي من الدرجة 3' } },
      ],
      correct: [0, 1, 3],
      explanation: {
        en: 'Both hepatic and renal impairment require dose reduction; Grade 3 AEs typically require discontinuation per the SmPC. Geriatric patients still need monitoring.',
        ar: 'يتطلب القصور الكبدي والكلوي تخفيض الجرعة. الأعراض من الدرجة الثالثة تستوجب الإيقاف.',
      },
      difficulty: 'medium',
    },
    {
      type: 'scenario',
      text: {
        en: `A consultant says: "Your safety data is weaker than competitor X." Best response?`,
        ar: 'يقول الاستشاري: "بيانات السلامة لديكم أضعف من المنافس X." ما أفضل رد؟',
      },
      options: [
        { text: { en: 'Dismiss the comparison and pivot to efficacy',                         ar: 'تجاهل المقارنة والانتقال للفعالية' } },
        { text: { en: 'Acknowledge the concern, share head-to-head data with fair balance, offer SmPC',  ar: 'الاعتراف بالاهتمام، عرض البيانات المتوازنة وتقديم SmPC' } },
        { text: { en: 'Promise off-label combination use',                                    ar: 'الوعد باستخدام خارج التسمية' } },
        { text: { en: 'Refer to a single KOL anecdote',                                       ar: 'الاستناد لحادثة من خبير واحد' } },
      ],
      correct: 1,
      explanation: {
        en: 'Fair balance requires acknowledging the concern, presenting peer-reviewed comparative data, and pointing to the SmPC. Off-label promises and dismissals breach the promotional code.',
        ar: 'العرض المتوازن يتطلب الاعتراف بالقلق وتقديم بيانات مقارنة موثقة والإشارة إلى SmPC.',
      },
      difficulty: 'hard',
    },
    {
      type: 'mcq',
      text: {
        en: `Pass mark on a mandatory ${course.therapyArea} compliance course is typically:`,
        ar: `علامة النجاح على دورة امتثال إلزامية في ${course.therapyArea} عادةً:`,
      },
      options: [
        { text: { en: '60%', ar: '60%' } },
        { text: { en: '70%', ar: '70%' } },
        { text: { en: '80%', ar: '80%' } },
        { text: { en: '90%+', ar: '90%+' } },
      ],
      correct: 3,
      explanation: {
        en: 'Mandatory compliance courses (PV, GxP) require 90%+ to ensure full understanding of the regulatory requirements.',
        ar: 'تتطلب الدورات الإلزامية للامتثال (PV، GxP) 90% أو أكثر لضمان الفهم الكامل.',
      },
      difficulty: 'easy',
    },
    {
      type: 'mcq',
      text: {
        en: `Under 21 CFR Part 11, an electronic signature must include:`,
        ar: 'وفقًا لـ 21 CFR Part 11، يجب أن يتضمن التوقيع الإلكتروني:',
      },
      options: [
        { text: { en: 'Only a checkbox',                                                       ar: 'مربع اختيار فقط' } },
        { text: { en: 'A handwritten signature uploaded as an image',                          ar: 'توقيع يدوي مرفوع كصورة' } },
        { text: { en: 'Two distinct identification components, one being a password',         ar: 'مكونان مميزان للتعريف، أحدهما كلمة مرور' } },
        { text: { en: 'A manager approval after the fact',                                    ar: 'موافقة المدير لاحقًا' } },
      ],
      correct: 2,
      explanation: {
        en: '21 CFR §11.200 requires e-signatures to use at least two distinct identification components.',
        ar: 'يتطلب 21 CFR §11.200 توقيعًا إلكترونيًا يستخدم مكونين مميزين على الأقل للتعريف.',
      },
      difficulty: 'medium',
    },
    {
      type: 'mcq',
      text: {
        en: `When discussing ${prod} efficacy with an HCP, you should ALWAYS:`,
        ar: `عند مناقشة فعالية ${prod} مع طبيب، يجب دائمًا:`,
      },
      options: [
        { text: { en: 'Quote the most favorable subgroup analysis',                            ar: 'الاستشهاد بأكثر تحليل فرعي إيجابية' } },
        { text: { en: 'Provide fair balance — efficacy + safety + limitations',                ar: 'تقديم عرض متوازن — الفعالية والسلامة والحدود' } },
        { text: { en: 'Skip safety data unless asked',                                         ar: 'تجاهل بيانات السلامة ما لم يُسأل' } },
        { text: { en: 'Compare to a placebo result from a different trial',                    ar: 'المقارنة بنتائج من تجربة مختلفة' } },
      ],
      correct: 1,
      explanation: {
        en: 'Fair balance is mandatory under ABPI/PhRMA codes — efficacy claims must be presented with relevant safety information.',
        ar: 'العرض المتوازن إلزامي وفقًا لأكواد ABPI/PhRMA.',
      },
      difficulty: 'easy',
    },
    {
      type: 'mcq',
      text: {
        en: `If a learner's mandatory ${ta} certification expires, the system should:`,
        ar: `إذا انتهت صلاحية الشهادة الإلزامية للمتعلم في ${ta}، يجب على النظام:`,
      },
      options: [
        { text: { en: 'Allow continued field activity unchanged',                             ar: 'السماح بالنشاط الميداني دون تغيير' } },
        { text: { en: 'Flip the user to "inactive duty" until renewed',                       ar: 'تحويل المستخدم إلى "خارج الخدمة" حتى التجديد' } },
        { text: { en: 'Send a reminder only',                                                  ar: 'إرسال تذكير فقط' } },
        { text: { en: 'Archive their entire training record',                                  ar: 'أرشفة سجلات التدريب بالكامل' } },
      ],
      correct: 1,
      explanation: {
        en: 'Per the compliance design, expiry of a mandatory cert flips activeDuty to false until the refresh is completed and re-signed.',
        ar: 'يقوم النظام تلقائيًا بإلغاء تفعيل الخدمة عند انتهاء الشهادة الإلزامية حتى يتم التجديد.',
      },
      difficulty: 'medium',
    },
    {
      type: 'scenario',
      text: {
        en: `A pharmacist asks for off-label dosing data for ${prod}. You should:`,
        ar: `يطلب صيدلي بيانات جرعات خارج التسمية لـ${prod}. يجب أن:`,
      },
      options: [
        { text: { en: 'Provide what you know from KOL discussions',                           ar: 'تقدم ما تعرفه من نقاشات الخبراء' } },
        { text: { en: 'Decline politely and route the request to Medical Affairs / MSL',      ar: 'الرفض بأدب وتحويل الطلب إلى الشؤون الطبية / MSL' } },
        { text: { en: 'Share an unpublished investigator slide deck',                          ar: 'مشاركة شريحة من باحث غير منشورة' } },
        { text: { en: 'Recommend an unapproved combination',                                   ar: 'توصية بمزيج غير معتمد' } },
      ],
      correct: 1,
      explanation: {
        en: 'Off-label inquiries must be routed to Medical Affairs / MSL via a documented Medical Information Request — never answered by Sales.',
        ar: 'يجب توجيه استفسارات خارج التسمية إلى الشؤون الطبية / MSL وليس الإجابة عليها من قبل المبيعات.',
      },
      difficulty: 'hard',
    },
    {
      type: 'multi',
      text: {
        en: `Which of the following are red flags requiring immediate AE reporting? (Select all that apply)`,
        ar: 'أيٌّ من التالي يستوجب الإبلاغ الفوري عن أثر جانبي؟ (اختر كل ما ينطبق)',
      },
      options: [
        { text: { en: 'Hospitalization',                                                       ar: 'الإدخال للمستشفى' } },
        { text: { en: 'Life-threatening event',                                                ar: 'حدث يهدد الحياة' } },
        { text: { en: 'Mild rash, day 2, resolving',                                           ar: 'طفح خفيف، اليوم 2، يتراجع' } },
        { text: { en: 'Permanent disability',                                                  ar: 'إعاقة دائمة' } },
      ],
      correct: [0, 1, 3],
      explanation: {
        en: 'Hospitalization, life-threatening events, and permanent disability are all serious AEs per ICH E2A and require expedited reporting.',
        ar: 'الإدخال للمستشفى والأحداث المهددة للحياة والإعاقة الدائمة تُعتبر جميعها آثارًا خطيرة وفقًا لـ ICH E2A.',
      },
      difficulty: 'medium',
    },
  ]

  return {
    questions: bank.slice(0, n).map((q) => ({ ...q, source: 'ai-generated', status: 'pending-review' })),
    model: 'mock-claude-opus-4-7',
    generatedAt: new Date().toISOString(),
    source: 'mock',
    metadata: { taProduct, courseTitle: course.title },
  }
}
