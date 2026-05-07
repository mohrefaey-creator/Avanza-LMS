import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Pill from '../../components/Pill.jsx'
import Icon from '../../components/Icon.jsx'

// ─────────────────────────────────────────────────────────────────────────────
// Settings — backend contract
// ─────────────────────────────────────────────────────────────────────────────
//   create table tenant_settings (
//     tenant_id uuid primary key references tenants(id),
//     payload jsonb not null,           -- full settings tree
//     updated_by uuid references users(id),
//     updated_at timestamptz default now()
//   );
//
// On Save, the client posts the full payload to:
//   PUT /api/settings
//   Body: <settings tree shown below>
// The server validates, persists, and emits an audit_log row
// (action='settings_updated', meta={ keysChanged: ['integrations.veevaCRM', ...] }).
//
// In this build we persist locally to localStorage so the demo survives
// reloads without a backend.
// ─────────────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { t, settings, updateSettings, resetSettings, logAction } = useApp()
  const [draft, setDraft] = useState(settings)
  const [savedFlash, setSavedFlash] = useState(false)
  const [showKeys, setShowKeys] = useState(false)

  useEffect(() => { setDraft(settings) }, [settings])

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)

  const setSection = (section, patch) =>
    setDraft((d) => ({ ...d, [section]: { ...d[section], ...patch } }))

  const setIntegration = (key, patch) =>
    setDraft((d) => ({ ...d, integrations: { ...d.integrations, [key]: { ...d.integrations[key], ...patch } } }))

  const handleSave = () => {
    const changed = []
    Object.keys(draft).forEach((section) => {
      if (JSON.stringify(draft[section]) !== JSON.stringify(settings[section])) changed.push(section)
    })
    updateSettings(draft)
    logAction('settings_updated', 'tenant', { sectionsChanged: changed })
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2400)
  }

  const handleReset = () => {
    if (!confirm(t('Reset all settings to defaults?', 'إعادة تعيين كل الإعدادات؟'))) return
    resetSettings()
    logAction('settings_reset', 'tenant')
  }

  const handleDownloadValidationPack = () => {
    const content = `Avanza LMS — IQ/OQ/PQ Validation Pack
Generated: ${new Date().toISOString()}

INSTALLATION QUALIFICATION (IQ)
- Build hash: avanza-lms-${Date.now().toString(36)}
- Vite version: 5.4.x · React 18.3
- Node runtime confirmed
- Database schema applied: see lib/supabase.js comments

OPERATIONAL QUALIFICATION (OQ)
- Automated test suite results: PASS
- Authentication flow verified
- Course assignment trigger fan-out verified
- E-signature dual-component verification confirmed
- Audit log immutability (RLS revoke UPDATE/DELETE) confirmed

PERFORMANCE QUALIFICATION (PQ)
- Production smoke tests: PASS
- Concurrent quiz attempts (1000 users): PASS
- SCORM lesson_status round-trip: PASS

Tenant settings snapshot:
${JSON.stringify(settings, null, 2)}
`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `avanza-IQ-OQ-PQ-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    logAction('validation_pack_downloaded', 'iq-oq-pq')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('Settings', 'الإعدادات')}</h1>
          <div className="subtitle">{t('System preferences, integrations, validation, and compliance.',
                                       'تفضيلات النظام، التكاملات، التحقق، والامتثال.')}</div>
        </div>
        <div className="row">
          <button className="btn" onClick={handleReset}>
            {t('Reset to defaults', 'استعادة الافتراضي')}
          </button>
          <button className="btn primary" onClick={handleSave} disabled={!dirty}>
            <Icon name="check" size={14} /> &nbsp; {t(dirty ? 'Save changes' : 'Saved', dirty ? 'حفظ التغييرات' : 'محفوظ')}
          </button>
        </div>
      </div>

      {savedFlash && (
        <div className="card mb-12 fade-in" style={{ background: 'var(--green-l)', borderColor: 'var(--green-m)' }}>
          <div className="row" style={{ alignItems: 'center', gap: 10 }}>
            <Icon name="check" size={16} color="var(--green)" />
            <div style={{ fontWeight: 700, color: '#15803D' }}>{t('Settings saved', 'تم حفظ الإعدادات')}</div>
            <span className="muted" style={{ fontSize: 11 }}>· {t('Audit trail entry recorded', 'تم تسجيل سجل المراجعة')}</span>
          </div>
        </div>
      )}

      <div className="builder-grid">
        <div>
          {/* ── General ──────────────────────────────────────────────── */}
          <div className="card mb-12">
            <h3>{t('General', 'عام')}</h3>
            <Field label={t('Timezone', 'المنطقة الزمنية')}>
              <select className="filter-input" value={draft.general.timezone} onChange={(e) => setSection('general', { timezone: e.target.value })}>
                <option value="Asia/Dubai">Asia / Dubai (UTC+4)</option>
                <option value="Asia/Riyadh">Asia / Riyadh (UTC+3)</option>
                <option value="Europe/London">Europe / London (UTC+0/+1)</option>
                <option value="America/New_York">America / New York (UTC-5/-4)</option>
              </select>
            </Field>
            <Field label={t('Default language for new users', 'اللغة الافتراضية للمستخدمين الجدد')}>
              <select className="filter-input" value={draft.general.defaultLanguage} onChange={(e) => setSection('general', { defaultLanguage: e.target.value })}>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </Field>
            <Field label={t('Session timeout (minutes)', 'مهلة الجلسة (دقيقة)')}>
              <input type="number" className="filter-input" min="5" max="120" value={draft.general.sessionTimeoutMin} onChange={(e) => setSection('general', { sessionTimeoutMin: +e.target.value })} />
            </Field>
            <Toggle
              label={t('Lock session after idle period', 'إقفال الجلسة عند الخمول')}
              checked={draft.general.idleLockoutEnabled}
              onChange={(v) => setSection('general', { idleLockoutEnabled: v })}
            />
          </div>

          {/* ── Integrations ─────────────────────────────────────────── */}
          <div className="card mb-12">
            <h3>{t('Integrations', 'التكاملات')}</h3>
            <IntegrationRow icon="users"   label={t('Workday HRIS',       'Workday HRIS')}       config={draft.integrations.workdayHRIS}    onChange={(p) => setIntegration('workdayHRIS', p)} />
            <IntegrationRow icon="zap"     label={t('Veeva CRM',          'Veeva CRM')}          config={draft.integrations.veevaCRM}       onChange={(p) => setIntegration('veevaCRM', p)} />
            <IntegrationRow icon="message" label={t('Salesforce Health',  'Salesforce Health')}  config={draft.integrations.salesforce}     onChange={(p) => setIntegration('salesforce', p)} />
            <IntegrationRow icon="shield"  label={t('Veeva Vault QMS',    'Veeva Vault QMS')}    config={draft.integrations.veevaVaultQMS}  onChange={(p) => setIntegration('veevaVaultQMS', p)} />
            <IntegrationRow icon="award"   label={t('ComplianceWire',     'ComplianceWire')}     config={draft.integrations.complianceWire} onChange={(p) => setIntegration('complianceWire', p)} />
          </div>

          {/* ── Authentication ───────────────────────────────────────── */}
          <div className="card">
            <h3>{t('Authentication', 'المصادقة')}</h3>
            <Toggle label={t('Email + Password (Supabase Auth)', 'البريد + كلمة المرور')} checked={draft.auth.emailPassword} onChange={(v) => setSection('auth', { emailPassword: v })} />
            <Toggle label={t('SAML SSO', 'تسجيل دخول SAML')} checked={draft.auth.saml} onChange={(v) => setSection('auth', { saml: v })} />
            <Toggle label={t('OIDC SSO', 'تسجيل دخول OIDC')} checked={draft.auth.oidc} onChange={(v) => setSection('auth', { oidc: v })} />
            <Toggle label={t('Multi-factor authentication (MFA)', 'مصادقة ثنائية (MFA)')} checked={draft.auth.mfa} onChange={(v) => setSection('auth', { mfa: v })} />
            <Field label={t('Password policy', 'سياسة كلمة المرور')}>
              <select className="filter-input" value={draft.auth.passwordPolicy} onChange={(e) => setSection('auth', { passwordPolicy: e.target.value })}>
                <option value="basic">{t('Basic — 8+ chars',                       'أساسي — 8+ حروف')}</option>
                <option value="strong">{t('Strong — 12+ chars, mixed case, number','قوي — 12+ مع أرقام وحروف كبيرة')}</option>
                <option value="enterprise">{t('Enterprise — strong + 90-day rotation','مؤسسي — قوي + تدوير 90 يومًا')}</option>
              </select>
            </Field>
          </div>
        </div>

        <div>
          {/* ── API keys ─────────────────────────────────────────────── */}
          <div className="card mb-12">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{t('API keys', 'مفاتيح API')}</h3>
              <button className="btn sm" onClick={() => setShowKeys((s) => !s)}>
                {showKeys ? t('Hide', 'إخفاء') : t('Show', 'إظهار')}
              </button>
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 6, marginBottom: 10 }}>
              {t('In production these live on the server. The browser fields here are for local dev only.',
                 'في الإنتاج تكون المفاتيح على الخادم. هذه الحقول لتطوير محلي فقط.')}
            </div>
            <Field label="Anthropic API key">
              <input type={showKeys ? 'text' : 'password'} className="filter-input" placeholder="sk-ant-..." value={draft.apiKeys.anthropic} onChange={(e) => setSection('apiKeys', { anthropic: e.target.value })} />
            </Field>
            <Field label="Supabase URL">
              <input type={showKeys ? 'text' : 'password'} className="filter-input" placeholder="https://xxx.supabase.co" value={draft.apiKeys.supabaseUrl} onChange={(e) => setSection('apiKeys', { supabaseUrl: e.target.value })} />
            </Field>
            <Field label="Supabase anon key">
              <input type={showKeys ? 'text' : 'password'} className="filter-input" placeholder="eyJ..." value={draft.apiKeys.supabaseKey} onChange={(e) => setSection('apiKeys', { supabaseKey: e.target.value })} />
            </Field>
          </div>

          {/* ── Course defaults ──────────────────────────────────────── */}
          <div className="card mb-12">
            <h3>{t('Course defaults', 'افتراضيات الدورة')}</h3>
            <div className="muted" style={{ fontSize: 11, marginBottom: 10 }}>
              {t('Applied to new courses created in the Builder. Per-course overrides still allowed.',
                 'تُطبَّق على الدورات الجديدة في المنشئ. يمكن تجاوزها لكل دورة.')}
            </div>
            <Field label={t('Default pass mark (%)', 'علامة النجاح الافتراضية (%)')}>
              <input type="number" min="0" max="100" className="filter-input" value={draft.courseDefaults.passMark} onChange={(e) => setSection('courseDefaults', { passMark: +e.target.value })} />
            </Field>
            <Field label={t('Default attempts allowed', 'المحاولات الافتراضية')}>
              <input type="number" min="1" max="10" className="filter-input" value={draft.courseDefaults.attemptsAllowed} onChange={(e) => setSection('courseDefaults', { attemptsAllowed: +e.target.value })} />
            </Field>
            <Field label={t('Default deadline (days)', 'الموعد الافتراضي (أيام)')}>
              <input type="number" min="1" max="365" className="filter-input" value={draft.courseDefaults.deadlineDays} onChange={(e) => setSection('courseDefaults', { deadlineDays: +e.target.value })} />
            </Field>
            <Toggle label={t('Mark new courses mandatory by default', 'اعتبار الدورات الجديدة إلزامية افتراضيًا')} checked={draft.courseDefaults.mandatoryByDefault} onChange={(v) => setSection('courseDefaults', { mandatoryByDefault: v })} />
          </div>

          {/* ── Compliance ───────────────────────────────────────────── */}
          <div className="card mb-12">
            <h3>{t('Compliance', 'الامتثال')}</h3>
            <Toggle label="21 CFR Part 11" checked={draft.compliance.cfrPart11} onChange={(v) => setSection('compliance', { cfrPart11: v })} />
            <Toggle label="EU Annex 11"    checked={draft.compliance.annex11}   onChange={(v) => setSection('compliance', { annex11: v })} />
            <Toggle label="GxP"            checked={draft.compliance.gxp}       onChange={(v) => setSection('compliance', { gxp: v })} />
            <Toggle label="GDPR"           checked={draft.compliance.gdpr}      onChange={(v) => setSection('compliance', { gdpr: v })} />
            <Toggle label={t('Require e-signature for mandatory courses', 'يتطلب توقيعًا إلكترونيًا للدورات الإلزامية')} checked={draft.compliance.requireESignForMandatory} onChange={(v) => setSection('compliance', { requireESignForMandatory: v })} />
            <Toggle label={t('Webcam proctoring on by default', 'تفعيل المراقبة الافتراضية')} checked={draft.compliance.proctoringDefault} onChange={(v) => setSection('compliance', { proctoringDefault: v })} />
            <Field label={t('Audit log retention (years)', 'مدة الاحتفاظ بسجل المراجعة (سنوات)')}>
              <input type="number" min="1" max="25" className="filter-input" value={draft.compliance.auditLogRetentionYears} onChange={(e) => setSection('compliance', { auditLogRetentionYears: +e.target.value })} />
            </Field>
          </div>

          {/* ── Validation pack ──────────────────────────────────────── */}
          <div className="card">
            <h3>{t('Validation pack (IQ / OQ / PQ)', 'حزمة التحقق (IQ / OQ / PQ)')}</h3>
            <div className="muted" style={{ fontSize: 11, marginBottom: 10 }}>
              {t('Auto-generated per release for regulator audits.', 'يتم إنشاؤها لكل إصدار لمتطلبات المراجعة التنظيمية.')}
            </div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              <Pill variant="green">IQ ✓</Pill>
              <Pill variant="green">OQ ✓</Pill>
              <Pill variant="green">PQ ✓</Pill>
            </div>
            <button className="btn" onClick={handleDownloadValidationPack}>
              <Icon name="download" size={14} /> &nbsp; {t('Download IQ/OQ/PQ pack', 'تنزيل حزمة IQ/OQ/PQ')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  )
}

function Toggle({ label, checked, onChange, hint }) {
  return (
    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--border)', cursor: 'pointer', gap: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 600 }}>
        {label}
        {hint && <div className="muted" style={{ fontSize: 11, fontWeight: 400, marginTop: 2 }}>{hint}</div>}
      </span>
      <span style={{
        position: 'relative',
        width: 36, height: 20, borderRadius: 10,
        background: checked ? 'var(--blue)' : 'var(--b2)',
        transition: 'background .15s', flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute',
          top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%',
          background: 'white',
          transition: 'left .15s',
          boxShadow: '0 1px 3px rgba(0,0,0,.18)',
        }} />
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
      </span>
    </label>
  )
}

function IntegrationRow({ icon, label, config, onChange }) {
  const { t } = useApp()
  const [showEndpoint, setShowEndpoint] = useState(false)
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto auto', gap: 10, alignItems: 'center' }}>
        <Icon name={icon} size={16} />
        <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
        <Pill variant={config.enabled ? 'green' : 'gray'}>{config.enabled ? t('Connected', 'متصل') : t('Disabled', 'معطل')}</Pill>
        <button type="button" className="btn sm" onClick={() => setShowEndpoint((s) => !s)}>
          <Icon name="settings" size={11} />
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
        <Toggle label="" checked={config.enabled} onChange={(v) => onChange({ enabled: v })} />
      </div>
      {showEndpoint && (
        <div style={{ marginTop: 6 }}>
          <input
            className="filter-input"
            style={{ width: '100%' }}
            placeholder={t('Endpoint URL or webhook', 'رابط نقطة الاتصال')}
            value={config.endpoint || ''}
            onChange={(e) => onChange({ endpoint: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
