import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Icon from '../../components/Icon.jsx'
import Pill from '../../components/Pill.jsx'

// ─────────────────────────────────────────────────────────────────────────────
// LEARNING PATH — backend format (Supabase 'learning_paths' table)
// ─────────────────────────────────────────────────────────────────────────────
//   create table learning_paths (
//     id uuid primary key default gen_random_uuid(),
//     name text not null,
//     name_ar text,
//     target_roles text[],
//     course_sequence jsonb,
//        -- Array<{
//        --   course_id: uuid,
//        --   order: int,
//        --   deadline_days: int,        // days from assignment date
//        --   pass_mark: int,            // 0–100, overrides course default
//        --   prerequisite: uuid | null  // course_id that must be passed first
//        -- }>
//     auto_triggers jsonb,
//        -- Array<{
//        --   type: 'role-change' | 'new-hire' | 'launch-readiness' |
//        --         'auto-version' | 'quality-event' | 'cert-expiry' | 'crm-trigger',
//        --   value?: string,             // e.g. role id for role-change, '60-days-before' for cert-expiry
//        -- }>
//     status text default 'active',  -- 'active' | 'archived' | 'draft'
//     created_by uuid references users(id),
//     created_at timestamptz default now()
//   );
//
//   create index idx_paths_target on learning_paths using gin (target_roles);
//
//   alter table learning_paths enable row level security;
//   create policy paths_admin_all on learning_paths
//     for all using (auth.uid() in (select id from users where role = 'admin'));
//   create policy paths_learner_read on learning_paths
//     for select using (status = 'active');
//
// API endpoint contract (server-side):
//   POST /api/learning-paths
//   Body: { name, nameAr, targetRoles, courseSequence, autoTriggers }
//   - Validates that every course_id exists and is active
//   - Validates that prerequisites form a DAG (no cycles)
//   - Resolves auto_triggers and schedules a CRON to fan-out assignments
//   - Returns the persisted path
//
// On trigger fire, server creates 'assignments' rows for each matched user with:
//   - assigned_at = now()
//   - due_at = now() + path.course_sequence[i].deadline_days
//   - source = 'auto-' + trigger.type
//   - status = 'not-started'
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { id: 'rep-oncology',    en: 'Rep — Oncology',    ar: 'مندوب — الأورام' },
  { id: 'rep-cardio',      en: 'Rep — Cardiology',  ar: 'مندوب — قلب' },
  { id: 'rep-diabetes',    en: 'Rep — Diabetes',    ar: 'مندوب — السكري' },
  { id: 'rep-primary',     en: 'Rep — Primary care',ar: 'مندوب — رعاية أولية' },
  { id: 'msl-oncology',    en: 'MSL — Oncology',    ar: 'MSL — الأورام' },
  { id: 'msl-cardio',      en: 'MSL — Cardiology',  ar: 'MSL — قلب' },
  { id: 'kam',             en: 'KAM',               ar: 'KAM' },
  { id: 'marketing',       en: 'Marketing',         ar: 'التسويق' },
]

const TRIGGER_OPTIONS = [
  { id: 'role-change',       en: 'HRIS role change',          ar: 'تغيير الدور (HRIS)' },
  { id: 'new-hire',          en: 'New hire onboarding',       ar: 'تأهيل موظف جديد' },
  { id: 'launch-readiness',  en: 'Product launch',            ar: 'إطلاق منتج' },
  { id: 'auto-version',      en: 'SOP / version update',      ar: 'تحديث الإجراء أو النسخة' },
  { id: 'quality-event',     en: 'Quality event (QMS)',       ar: 'حدث جودة (QMS)' },
  { id: 'cert-expiry',       en: 'Certificate expiry',        ar: 'انتهاء شهادة' },
  { id: 'crm-trigger',       en: 'CRM event (Veeva/SF)',      ar: 'حدث CRM' },
]

export default function NewPathModal({ onClose }) {
  const { t, courses, addLearningPath, logAction } = useApp()
  const activeCourses = courses.filter((c) => c.status === 'active')

  const [name, setName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [targetRoles, setTargetRoles] = useState([])
  const [sequence, setSequence] = useState([])    // [{ courseId, deadlineDays, passMark, prerequisite }]
  const [triggers, setTriggers] = useState([])    // [{ type, value }]

  const toggleRole = (id) => setTargetRoles((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  const toggleTrigger = (id) => setTriggers((p) => p.find((x) => x.type === id) ? p.filter((x) => x.type !== id) : [...p, { type: id }])

  const addCourseToSequence = () => {
    const next = activeCourses.find((c) => !sequence.some((s) => s.courseId === c.id))
    if (!next) return
    setSequence((s) => [...s, {
      courseId:    next.id,
      deadlineDays: 30,
      passMark:    next.passMark || 80,
      prerequisite: s.length > 0 ? s[s.length - 1].courseId : null,
    }])
  }

  const updateSequenceItem = (i, patch) =>
    setSequence((s) => s.map((x, idx) => idx === i ? { ...x, ...patch } : x))

  const removeSequenceItem = (i) =>
    setSequence((s) => s.filter((_, idx) => idx !== i)
      .map((item, idx, arr) => ({
        ...item,
        prerequisite: idx === 0 ? null : arr[idx - 1].courseId,
      })))

  const moveSequenceItem = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= sequence.length) return
    setSequence((s) => {
      const next = [...s]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next.map((item, idx, arr) => ({
        ...item,
        prerequisite: idx === 0 ? null : arr[idx - 1].courseId,
      }))
    })
  }

  const valid = name.trim().length > 0 && targetRoles.length > 0 && sequence.length > 0

  const handleSubmit = (e) => {
    e?.preventDefault?.()
    if (!valid) return
    const path = addLearningPath({
      name,
      nameAr,
      targetRoles,
      courses: sequence,
      autoAssignTriggers: triggers,
    })
    logAction('learning_path_created', path.id, {
      name: path.name,
      courseCount: path.courses.length,
      roleCount: path.targetRoles.length,
      triggerCount: path.autoAssignTriggers.length,
    })
    onClose(path)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 760 }}>
        <div className="modal-head">
          <h3>{t('Create learning path', 'إنشاء مسار تعلّم')}</h3>
          <button className="icon-btn" onClick={() => onClose(null)}><Icon name="x" size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* ── Basic info ─────────────────────────────────────────── */}
            <div className="row" style={{ gap: 10 }}>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label>{t('Path name (English) *', 'اسم المسار (إنجليزي) *')}</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Oncology Onboarding Path" required />
              </div>
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label>{t('Path name (Arabic)', 'اسم المسار (عربي)')}</label>
                <input dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: مسار تأهيل الأورام" />
              </div>
            </div>

            {/* ── Target roles ───────────────────────────────────────── */}
            <div className="field mt-16">
              <label>{t('Target roles *', 'الأدوار المستهدفة *')}</label>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                {ROLE_OPTIONS.map((r) => (
                  <button key={r.id} type="button"
                    className={`chip ${targetRoles.includes(r.id) ? 'active' : ''}`}
                    onClick={() => toggleRole(r.id)}>
                    {t(r.en, r.ar)}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Course sequence ────────────────────────────────────── */}
            <div className="field">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{t('Course sequence *', 'تسلسل الدورات *')}</span>
                <button type="button" className="btn sm" onClick={addCourseToSequence} disabled={activeCourses.length === sequence.length}>
                  <Icon name="plus" size={11} /> &nbsp; {t('Add course', 'إضافة دورة')}
                </button>
              </label>

              {sequence.length === 0 && (
                <div className="muted" style={{ fontSize: 11, padding: 10, background: 'var(--bg)', borderRadius: 'var(--r3)', textAlign: 'center' }}>
                  {t('No courses yet — add at least one to define the path.', 'لا توجد دورات بعد — أضف دورة واحدة على الأقل.')}
                </div>
              )}

              <div style={{ display: 'grid', gap: 6 }}>
                {sequence.map((item, i) => {
                  const c = activeCourses.find((x) => x.id === item.courseId)
                  const prereq = item.prerequisite ? activeCourses.find((x) => x.id === item.prerequisite) : null
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 90px 80px 24px 24px', gap: 6, alignItems: 'center', padding: 8, background: 'var(--bg)', borderRadius: 'var(--r3)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx3)', textAlign: 'center' }}>#{i + 1}</div>
                      <select className="filter-input" value={item.courseId} onChange={(e) => updateSequenceItem(i, { courseId: e.target.value })}>
                        {activeCourses
                          .filter((c) => c.id === item.courseId || !sequence.some((s) => s.courseId === c.id))
                          .map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                      <input type="number" className="filter-input" value={item.deadlineDays} onChange={(e) => updateSequenceItem(i, { deadlineDays: +e.target.value })} title={t('Deadline (days)', 'الموعد (أيام)')} placeholder="days" />
                      <input type="number" className="filter-input" value={item.passMark} onChange={(e) => updateSequenceItem(i, { passMark: +e.target.value })} title={t('Pass mark %', 'علامة النجاح %')} min="0" max="100" />
                      <button type="button" className="btn sm" onClick={() => moveSequenceItem(i, -1)} disabled={i === 0} title={t('Move up', 'لأعلى')}>↑</button>
                      <button type="button" className="btn sm" onClick={() => removeSequenceItem(i)} title={t('Remove', 'حذف')}><Icon name="x" size={11} /></button>
                      {prereq && (
                        <div style={{ gridColumn: '2 / -1', fontSize: 10, color: 'var(--tx3)' }}>
                          ↳ {t('Locked until', 'مغلقة حتى')} <strong>{prereq.title}</strong> {t('is passed', 'يُجتاز')}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {sequence.length > 0 && (
                <div className="muted" style={{ fontSize: 10, marginTop: 6 }}>
                  {t('Each course is locked until the previous one is passed (sequence enforcement).',
                     'كل دورة مغلقة حتى تُجتاز السابقة (تسلسل إجباري).')}
                </div>
              )}
            </div>

            {/* ── Auto-assign triggers ───────────────────────────────── */}
            <div className="field">
              <label>{t('Auto-assign triggers (optional)', 'مشغّلات التعيين التلقائي (اختياري)')}</label>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                {TRIGGER_OPTIONS.map((tr) => (
                  <button key={tr.id} type="button"
                    className={`chip ${triggers.find((x) => x.type === tr.id) ? 'active' : ''}`}
                    onClick={() => toggleTrigger(tr.id)}>
                    {t(tr.en, tr.ar)}
                  </button>
                ))}
              </div>
              <div className="muted" style={{ fontSize: 10, marginTop: 6, lineHeight: 1.5 }}>
                {t('When any selected trigger fires, the system auto-creates assignments for matching users with the deadlines defined above.',
                   'عند تشغيل أي محفّز، ينشئ النظام مهام تلقائيًا للمستخدمين المطابقين بالمواعيد المحددة.')}
              </div>
            </div>

            {/* ── Summary ─────────────────────────────────────────────── */}
            {valid && (
              <div className="card-tight mt-12" style={{ background: 'var(--blue-l)', border: '1px solid var(--blue-m)', borderRadius: 'var(--r3)', padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue-d)', marginBottom: 6 }}>
                  {t('Ready to publish', 'جاهز للنشر')}
                </div>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  <Pill variant="blue">{sequence.length} {t('courses', 'دورات')}</Pill>
                  <Pill variant="purple">{targetRoles.length} {t('roles', 'أدوار')}</Pill>
                  {triggers.length > 0 && <Pill variant="amber">{triggers.length} {t('triggers', 'محفّزات')}</Pill>}
                  <Pill variant="green">{sequence[sequence.length - 1]?.deadlineDays || 0} {t('days total', 'يومًا إجمالي')}</Pill>
                </div>
              </div>
            )}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn" onClick={() => onClose(null)}>{t('Cancel', 'إلغاء')}</button>
            <button type="submit" className="btn primary" disabled={!valid}>
              <Icon name="check" size={14} /> &nbsp; {t('Create path', 'إنشاء المسار')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
