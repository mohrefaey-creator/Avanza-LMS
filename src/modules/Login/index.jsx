import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Icon from '../../components/Icon.jsx'

// Production state — only the platform owner is seeded. The login handler
// matches the user by email; role is resolved server-side from the matched
// account, so no manual role picker is shown.
const CREDENTIALS = [
  { email: 'moh.refaey@gmail.com',       password: 'Refaey1234', role: 'admin'   },
  { email: 'malrefaey@cigalah.com.sa',   password: 'Refaey1234', role: 'learner' },
]

export default function Login() {
  const { t, login } = useApp()
  const [email, setEmail] = useState(CREDENTIALS[0].email)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const match = CREDENTIALS.find(
      (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password
    )
    if (!match) {
      setError(t('Incorrect email or password.', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'))
      return
    }
    setError('')
    login(match.role, match.email, { remember: true })
  }

  return (
    <div className="login-screen">
      <main className="login-body">
        <section className="login-hero">
          <img src="/login-hero.png" alt="Avanza LMS" className="login-hero-img" />
          <img src="/logo-lms.png" alt="Avanza LMS" className="login-brand-logo" />
          <div className="login-hero-overlay">
            {/* Desktop placement of pitch banner — hidden on mobile via CSS */}
            <div className="login-pitch-banner desktop-only">
              {t(<>The <span>Smart</span> LMS built for Cigalah Team.</>, <>نظام التعلم <span>الذكي</span> المصمم لفريق سيجالا.</>)}
            </div>
            {/* Desktop placement of the feature list — hidden on mobile via CSS */}
            <FeaturesList desktopOnly />
          </div>
        </section>

        <section className="login-form-pane">
          <form className="login-card" onSubmit={handleSubmit}>
            <h1>{t('Welcome back', 'مرحبًا بعودتك')}</h1>
            <p className="sub">{t('Sign in to your Avanza LMS account.', 'سجل الدخول إلى حسابك في أفانزا.')}</p>

            <div className="field">
              <label>{t('Email', 'البريد الإلكتروني')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="field">
              <label>{t('Password', 'كلمة المرور')}</label>
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); if (error) setError('') }} required />
            </div>

            {error && (
              <div style={{ color:'#ff7676', fontSize:11, marginTop:-4, marginBottom:4 }}>{error}</div>
            )}

            <button type="submit" className="btn primary" style={{ width:'100%', padding:'10px', fontSize:12, marginTop:6 }}>
              {t('Sign in', 'تسجيل الدخول')}
            </button>

            <div style={{ marginTop:18, fontSize:10, color:'rgba(255,255,255,0.55)', textAlign:'center', lineHeight:1.5 }}>
              {t('Validated user authentication · Session locked after 15 min idle · IP: 10.0.0.42',
                 'تحقق محقق · إغلاق الجلسة بعد 15 دقيقة خمول · IP: 10.0.0.42')}
            </div>
          </form>
        </section>

        {/* Mobile placement of pitch banner + feature list — hidden on desktop via CSS */}
        <section className="login-features-mobile-section">
          <div className="login-pitch-banner mobile-only">
            {t(<>The <span>Smart</span> LMS built for Cigalah Team.</>, <>نظام التعلم <span>الذكي</span> المصمم لفريق سيجالا.</>)}
          </div>
          <FeaturesList />
        </section>
      </main>
    </div>
  )
}

function FeaturesList({ desktopOnly = false }) {
  return (
    <div className={`login-features ${desktopOnly ? 'desktop-only' : ''}`}>
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
