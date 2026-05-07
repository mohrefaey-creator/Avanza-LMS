import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Icon from '../../components/Icon.jsx'

const ROLE_LABELS = {
  admin:   { en: 'Admin',   ar: 'المدير' },
  manager: { en: 'Manager', ar: 'المشرف' },
  learner: { en: 'Learner', ar: 'متعلم' },
  auditor: { en: 'Auditor', ar: 'المدقق' },
}

// Production state — only the platform owner is seeded. Each "Demo role"
// button still pre-fills the owner email; the login() handler matches by
// email and lands you as admin regardless of which button you click.
const OWNER_EMAIL = 'moh.refaey@gmail.com'
const DEMO_EMAILS = {
  admin:   OWNER_EMAIL,
  manager: OWNER_EMAIL,
  learner: OWNER_EMAIL,
  auditor: OWNER_EMAIL,
}

export default function Login() {
  const { t, login } = useApp()
  const [role, setRole] = useState('admin')
  const [email, setEmail] = useState(DEMO_EMAILS.admin)
  const [password, setPassword] = useState('')

  const handleRoleClick = (r) => {
    setRole(r)
    setEmail(DEMO_EMAILS[r])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    login(role, email)
  }

  return (
    <div className="login-screen">
      <main className="login-body">
        <section className="login-hero">
          <img src="/login-hero.png" alt="Avanza LMS" className="login-hero-img" />
          <img src="/logo-lms.png" alt="Avanza LMS" className="login-brand-logo" />
          <div className="login-hero-overlay">
            <div className="login-pitch-banner">
              {t(<>The <span>Smart</span> LMS built for Cigalah Team.</>, <>نظام التعلم <span>الذكي</span> المصمم لفريق سيجالا.</>)}
            </div>
            <div className="login-features">
              <Feature
                icon="message"
                en="Live AI voice roleplay"
                ar="محاكاة صوتية حية بالذكاء الاصطناعي"
                sub_en="Rehearse real calls with oncologist, cardiologist & pharmacist personas — mic in, voice out."
                sub_ar="تدرّب على مكالمات حقيقية مع شخصيات طبيب أورام وقلب وصيدلي — صوت داخل وصوت خارج." />
              <Feature
                icon="sparkle"
                en="From SOP to microlearning in minutes"
                ar="من إجراء SOP إلى تعلم مصغّر في دقائق"
                sub_en="Drop a product PDF; Claude returns a 5-min module, scored quiz, and target roles."
                sub_ar="ارفع ملف منتج؛ يولّد كلود وحدة 5 دقائق واختبارًا ودورًا مستهدفًا." />
              <Feature
                icon="users"
                en="Hierarchical team views"
                ar="عرض الفرق الهرمي"
                sub_en="District → Regional → National roll-ups, down to a single rep."
                sub_ar="من المنطقة إلى الإقليم إلى الوطني، وصولًا إلى المندوب الواحد." />
              <Feature
                icon="shield"
                en="GxP-grade e-signatures"
                ar="توقيع إلكتروني بمعيار GxP"
                sub_en="Every completion 21 CFR Part 11 e-signed, time-locked, inspector-ready."
                sub_ar="كل إتمام موقّع وفق 21 CFR Part 11، مختوم بالوقت، جاهز للتفتيش." />
            </div>
          </div>
        </section>

        <section className="login-form-pane">
          <form className="login-card" onSubmit={handleSubmit}>
            <h1>{t('Welcome back', 'مرحبًا بعودتك')}</h1>
            <p className="sub">{t('Sign in to your Avanza LMS account.', 'سجل الدخول إلى حسابك في أفانزا.')}</p>

            <div className="field">
              <label>{t('Demo role', 'الدور التجريبي')}</label>
              <div className="role-grid">
                {Object.keys(ROLE_LABELS).map((r) => (
                  <button key={r} type="button"
                    className={role === r ? 'active' : ''}
                    onClick={() => handleRoleClick(r)}>
                    {t(ROLE_LABELS[r].en, ROLE_LABELS[r].ar)}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>{t('Email', 'البريد الإلكتروني')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="field">
              <label>{t('Password', 'كلمة المرور')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn primary" style={{ width:'100%', padding:'10px', fontSize:12, marginTop:6 }}>
              {t('Sign in', 'تسجيل الدخول')}
            </button>

            <div style={{ marginTop:18, fontSize:10, color:'rgba(255,255,255,0.55)', textAlign:'center', lineHeight:1.5 }}>
              {t('Validated user authentication · Session locked after 15 min idle · IP: 10.0.0.42',
                 'تحقق محقق · إغلاق الجلسة بعد 15 دقيقة خمول · IP: 10.0.0.42')}
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

function Feature({ icon, en, ar, sub_en, sub_ar }) {
  const { t } = useApp()
  return (
    <div className="login-feature">
      <div className="ico">
        <Icon name={icon} size={16} />
      </div>
      <div>
        <strong>{t(en, ar)}</strong>
        {t(sub_en, sub_ar)}
      </div>
    </div>
  )
}
